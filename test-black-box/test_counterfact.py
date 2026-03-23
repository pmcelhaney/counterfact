"""Black-box tests for Counterfact.

These tests run counterfact as an external process and verify its behaviour
from the outside — no knowledge of internals required.
"""

import os
import shutil
import subprocess
import tempfile

import requests

BASE_URL = "http://localhost:3100"
TEST_BLACK_BOX_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(TEST_BLACK_BOX_DIR)
OPENAPI_SPEC = os.path.join(TEST_BLACK_BOX_DIR, "openapi.yaml")

REQUEST_TIMEOUT = 10


def test_home_page(server):
    """The built-in dashboard is served at /counterfact/."""
    response = requests.get(f"{BASE_URL}/counterfact/", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200


def test_creates_route_file_for_ping(server):
    """A TypeScript route file is generated for every path in the spec."""
    out_dir = server["out_dir"]
    ping_file = os.path.join(out_dir, "routes", "ping.ts")
    assert os.path.exists(ping_file), f"Expected generated file at {ping_file}"
    with open(ping_file) as f:
        content = f.read()
    assert "export const GET" in content


def test_compiles_route_file(server):
    """Generated TypeScript route files are compiled to .cjs for hot-reload."""
    out_dir = server["out_dir"]
    ping_cjs = os.path.join(out_dir, ".cache", "ping.cjs")
    assert os.path.exists(ping_cjs), f"Expected compiled cache file at {ping_cjs}"


def test_ping_returns_pong(server):
    """GET /ping returns the expected 'pong' response."""
    response = requests.get(f"{BASE_URL}/ping", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200
    assert response.text == "pong"


def test_items_returns_list(server):
    """GET /items returns the expected JSON array."""
    response = requests.get(f"{BASE_URL}/items", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200
    assert response.json() == ["apple", "banana", "cherry"]


def test_handles_path_with_colon(server):
    """Paths containing a colon are handled correctly."""
    response = requests.get(f"{BASE_URL}/path/with:colon", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200
    assert response.text == "colon handled"


def test_spec_flag_generates_route_files():
    """The --spec flag allows passing the OpenAPI spec path as a named option."""
    temp_dir = tempfile.mkdtemp(prefix="counterfact-spec-test-")
    try:
        counterfact_bin = os.path.join(REPO_ROOT, "bin", "counterfact.js")
        result = subprocess.run(
            [
                "node",
                counterfact_bin,
                "--spec",
                OPENAPI_SPEC,
                temp_dir,
                "--generate",
            ],
            timeout=30,
            check=False,
        )
        assert result.returncode in (0, None), (
            f"Process exited with unexpected code {result.returncode}"
        )
        ping_file = os.path.join(temp_dir, "routes", "ping.ts")
        assert os.path.exists(ping_file), f"Expected generated file at {ping_file}"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
