import os
import subprocess
import time

import pytest
import requests

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_PORT = 3100
BASE_URL = f"http://localhost:{SERVER_PORT}"
SERVER_STARTUP_TIMEOUT = 30


def wait_for_server(timeout=SERVER_STARTUP_TIMEOUT):
    """Poll the server until it responds or the timeout is reached."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            requests.get(f"{BASE_URL}/counterfact/", timeout=2)
            return
        except requests.exceptions.ConnectionError:
            time.sleep(0.5)
    raise TimeoutError(
        f"Counterfact server at {BASE_URL} did not start within {timeout} seconds"
    )


@pytest.fixture(scope="session")
def server(tmp_path_factory):
    """Start the counterfact server and tear it down after all tests.

    The server is started with CWD set to a temporary directory so that
    generated files land in a clean, isolated location.  The OpenAPI spec
    is passed as an absolute path so it can be found regardless of CWD.
    """
    temp_work_dir = tmp_path_factory.mktemp("counterfact-work")
    openapi_spec = os.path.join(REPO_ROOT, "openapi-example.yaml")
    counterfact_bin = os.path.join(REPO_ROOT, "bin", "counterfact.js")

    process = subprocess.Popen(
        [
            "node",
            counterfact_bin,
            openapi_spec,
            "out",
            "--port",
            str(SERVER_PORT),
            "--serve",
            "--generate",
            "--build-cache",
        ],
        cwd=str(temp_work_dir),
        env={**os.environ, "DEBUG": "counterfact:*"},
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        wait_for_server()
    except TimeoutError:
        process.kill()
        raise

    yield {"out_dir": temp_work_dir / "out", "process": process}

    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
