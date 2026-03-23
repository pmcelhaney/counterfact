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
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


REQUEST_TIMEOUT = 10


def test_home_page(server):
    """The built-in dashboard is served at /counterfact/."""
    response = requests.get(f"{BASE_URL}/counterfact/", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200


def test_creates_route_file_for_hello_kitty(server):
    """A TypeScript route file is generated for every path in the spec."""
    out_dir = server["out_dir"]
    kitty_file = os.path.join(out_dir, "routes", "hello", "kitty.ts")
    assert os.path.exists(kitty_file), f"Expected generated file at {kitty_file}"
    with open(kitty_file) as f:
        content = f.read()
    assert "export const GET" in content


def test_compiles_route_file(server):
    """Generated TypeScript route files are compiled to .cjs for hot-reload."""
    out_dir = server["out_dir"]
    kitty_cjs = os.path.join(out_dir, ".cache", "hello", "kitty.cjs")
    assert os.path.exists(kitty_cjs), f"Expected compiled cache file at {kitty_cjs}"


def test_responds_to_get_request(server):
    """A GET request to a generated route returns a successful response."""
    response = requests.get(f"{BASE_URL}/hello/kitty", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200
    assert isinstance(response.text, str)


def test_handles_path_with_colon(server):
    """Paths containing a colon are handled correctly."""
    response = requests.get(f"{BASE_URL}/weird/path/with:colon", timeout=REQUEST_TIMEOUT)
    assert response.status_code == 200
    assert isinstance(response.text, str)


def test_spec_flag_generates_route_files():
    """The --spec flag allows passing the OpenAPI spec path as a named option."""
    temp_dir = tempfile.mkdtemp(prefix="counterfact-spec-test-")
    try:
        counterfact_bin = os.path.join(REPO_ROOT, "bin", "counterfact.js")
        openapi_spec = os.path.join(REPO_ROOT, "openapi-example.yaml")
        result = subprocess.run(
            [
                "node",
                counterfact_bin,
                "--spec",
                openapi_spec,
                temp_dir,
                "--generate",
            ],
            timeout=30,
            check=False,
        )
        assert result.returncode in (0, None), (
            f"Process exited with unexpected code {result.returncode}"
        )
        kitty_file = os.path.join(temp_dir, "routes", "hello", "kitty.ts")
        assert os.path.exists(kitty_file), f"Expected generated file at {kitty_file}"
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
