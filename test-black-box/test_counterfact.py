"""Black-box tests for Counterfact.

These tests run counterfact as an external process and verify its behaviour
from the outside — no knowledge of internals required.
"""

import requests

BASE_URL = "http://localhost:3100"


def test_home_page(server):
    """The built-in dashboard is served at /counterfact/."""
    response = requests.get(f"{BASE_URL}/counterfact/")
    assert response.status_code == 200


def test_creates_route_file_for_hello_kitty(server):
    """A TypeScript route file is generated for every path in the spec."""
    out_dir = server["out_dir"]
    kitty_file = out_dir / "routes" / "hello" / "kitty.ts"
    assert kitty_file.exists(), f"Expected generated file at {kitty_file}"
    content = kitty_file.read_text()
    assert "export const GET" in content


def test_compiles_route_file(server):
    """Generated TypeScript route files are compiled to .cjs for hot-reload."""
    out_dir = server["out_dir"]
    kitty_cjs = out_dir / ".cache" / "hello" / "kitty.cjs"
    assert kitty_cjs.exists(), f"Expected compiled cache file at {kitty_cjs}"


def test_responds_to_get_request(server):
    """A GET request to a generated route returns a successful response."""
    response = requests.get(f"{BASE_URL}/hello/kitty")
    assert response.status_code == 200
    assert isinstance(response.text, str)


def test_handles_path_with_colon(server):
    """Paths containing a colon are handled correctly."""
    response = requests.get(f"{BASE_URL}/weird/path/with:colon")
    assert response.status_code == 200
    assert isinstance(response.text, str)
