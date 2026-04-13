"""Black-box tests for parallel-APIs (specs array) mode.

These tests verify that when counterfact is configured with a ``specs`` array
in ``counterfact.yaml``, it serves multiple OpenAPI documents at distinct URL
base paths from a single server instance.

A dedicated server process is started on port 3102 (separate from the
session-scoped server on 3100 and the reload-test server on 3101).
"""

import os
import shutil
import subprocess
import tempfile
import time

import requests

PARALLEL_PORT = 3102
PARALLEL_BASE_URL = f"http://localhost:{PARALLEL_PORT}"
REQUEST_TIMEOUT = 10
SERVER_STARTUP_TIMEOUT = 60

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_BLACK_BOX_DIR = os.path.dirname(os.path.abspath(__file__))

ALPHA_SPEC = os.path.join(TEST_BLACK_BOX_DIR, "alpha.yaml")
BETA_SPEC = os.path.join(TEST_BLACK_BOX_DIR, "beta.yaml")


def _wait_for_server(base_url: str, timeout: int = SERVER_STARTUP_TIMEOUT) -> None:
    """Poll until the server responds or the timeout is reached."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            response = requests.get(
                f"{base_url}/counterfact/swagger", timeout=2
            )
            if response.status_code == 200:
                return
        except requests.exceptions.RequestException:
            pass
        time.sleep(0.5)
    raise TimeoutError(
        f"Server at {base_url} did not start within {timeout} seconds"
    )


def _start_parallel_server(temp_work_dir: str) -> subprocess.Popen:
    """Write counterfact.yaml and start the server process."""
    alpha_spec_abs = os.path.abspath(ALPHA_SPEC)
    beta_spec_abs = os.path.abspath(BETA_SPEC)

    config_yaml = (
        f"specs:\n"
        f"  - source: {alpha_spec_abs}\n"
        f"    base: alpha\n"
        f"  - source: {beta_spec_abs}\n"
        f"    base: beta\n"
        f"port: {PARALLEL_PORT}\n"
        f"destination: out\n"
    )

    with open(os.path.join(temp_work_dir, "counterfact.yaml"), "w") as f:
        f.write(config_yaml)

    counterfact_bin = os.path.join(REPO_ROOT, "bin", "counterfact.js")
    log_path = os.path.join(temp_work_dir, "server.log")
    log_file = open(log_path, "w")  # noqa: SIM115

    process = subprocess.Popen(
        [
            "node",
            counterfact_bin,
            "--serve",
            "--generate",
            "--build-cache",
        ],
        cwd=temp_work_dir,
        stdout=log_file,
        stderr=log_file,
    )

    try:
        try:
            _wait_for_server(PARALLEL_BASE_URL)
        except TimeoutError:
            log_file.flush()
            try:
                with open(log_path) as f:
                    server_logs = f.read()
            except OSError:
                server_logs = "(could not read server log)"
            process.terminate()
            log_file.close()
            raise TimeoutError(
                f"Parallel-API server did not start.\nServer log:\n{server_logs}"
            )
    except Exception:
        process.terminate()
        log_file.close()
        raise

    # Store log_file on process so caller can close it
    process._log_file = log_file  # type: ignore[attr-defined]
    return process


def test_parallel_apis_serve_distinct_responses():
    """Alpha and beta specs each return distinct responses at their prefixes."""
    temp_work_dir = tempfile.mkdtemp(prefix="counterfact-parallel-test-")
    process = None
    try:
        process = _start_parallel_server(temp_work_dir)

        alpha_response = requests.get(
            f"{PARALLEL_BASE_URL}/alpha/ping", timeout=REQUEST_TIMEOUT
        )
        assert alpha_response.status_code == 200, (
            f"Expected 200 from /alpha/ping, got {alpha_response.status_code}"
        )
        assert alpha_response.text == "alpha-pong", (
            f"Expected 'alpha-pong' from /alpha/ping, got '{alpha_response.text}'"
        )

        beta_response = requests.get(
            f"{PARALLEL_BASE_URL}/beta/ping", timeout=REQUEST_TIMEOUT
        )
        assert beta_response.status_code == 200, (
            f"Expected 200 from /beta/ping, got {beta_response.status_code}"
        )
        assert beta_response.text == "beta-pong", (
            f"Expected 'beta-pong' from /beta/ping, got '{beta_response.text}'"
        )

    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            if hasattr(process, "_log_file"):
                process._log_file.close()  # type: ignore[attr-defined]
        shutil.rmtree(temp_work_dir, ignore_errors=True)


def test_parallel_apis_generate_route_files_in_subdirectories():
    """Each spec's route files land in its own subdirectory."""
    temp_work_dir = tempfile.mkdtemp(prefix="counterfact-parallel-gen-test-")
    process = None
    try:
        process = _start_parallel_server(temp_work_dir)
        out_dir = os.path.join(temp_work_dir, "out")

        alpha_ping = os.path.join(out_dir, "alpha", "routes", "ping.ts")
        assert os.path.exists(alpha_ping), (
            f"Expected alpha route file at {alpha_ping}"
        )

        beta_ping = os.path.join(out_dir, "beta", "routes", "ping.ts")
        assert os.path.exists(beta_ping), (
            f"Expected beta route file at {beta_ping}"
        )

        # Files generated for one spec must not bleed into the other's directory
        alpha_items = os.path.join(out_dir, "alpha", "routes", "items.ts")
        assert not os.path.exists(alpha_items), (
            f"Alpha should not have an items route (items belongs to beta): {alpha_items}"
        )

        beta_status = os.path.join(out_dir, "beta", "routes", "status.ts")
        assert not os.path.exists(beta_status), (
            f"Beta should not have a status route (status belongs to alpha): {beta_status}"
        )

    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            if hasattr(process, "_log_file"):
                process._log_file.close()  # type: ignore[attr-defined]
        shutil.rmtree(temp_work_dir, ignore_errors=True)


def test_parallel_apis_unmatched_prefix_returns_404():
    """A request whose path does not match any spec prefix returns 404."""
    temp_work_dir = tempfile.mkdtemp(prefix="counterfact-parallel-404-test-")
    process = None
    try:
        process = _start_parallel_server(temp_work_dir)

        response = requests.get(
            f"{PARALLEL_BASE_URL}/gamma/ping", timeout=REQUEST_TIMEOUT
        )
        # Koa returns 404 when no middleware handles the request
        assert response.status_code == 404, (
            f"Expected 404 for unknown prefix /gamma, got {response.status_code}"
        )

    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            if hasattr(process, "_log_file"):
                process._log_file.close()  # type: ignore[attr-defined]
        shutil.rmtree(temp_work_dir, ignore_errors=True)


def test_parallel_apis_specs_takes_precedence_over_spec():
    """When both ``spec`` and ``specs`` are in counterfact.yaml, ``specs`` wins."""
    temp_work_dir = tempfile.mkdtemp(prefix="counterfact-parallel-prec-test-")
    process = None
    try:
        alpha_spec_abs = os.path.abspath(ALPHA_SPEC)
        beta_spec_abs = os.path.abspath(BETA_SPEC)

        # Point ``spec`` at beta's spec directly — it should be ignored.
        config_yaml = (
            f"spec: {beta_spec_abs}\n"
            f"specs:\n"
            f"  - source: {alpha_spec_abs}\n"
            f"    base: alpha\n"
            f"  - source: {beta_spec_abs}\n"
            f"    base: beta\n"
            f"port: {PARALLEL_PORT}\n"
            f"destination: out\n"
        )

        with open(os.path.join(temp_work_dir, "counterfact.yaml"), "w") as f:
            f.write(config_yaml)

        counterfact_bin = os.path.join(REPO_ROOT, "bin", "counterfact.js")
        log_path = os.path.join(temp_work_dir, "server.log")
        log_file = open(log_path, "w")  # noqa: SIM115

        process = subprocess.Popen(
            [
                "node",
                counterfact_bin,
                "--serve",
                "--generate",
                "--build-cache",
            ],
            cwd=temp_work_dir,
            stdout=log_file,
            stderr=log_file,
        )
        process._log_file = log_file  # type: ignore[attr-defined]

        try:
            _wait_for_server(PARALLEL_BASE_URL)
        except TimeoutError:
            log_file.flush()
            try:
                with open(log_path) as f:
                    server_logs = f.read()
            except OSError:
                server_logs = "(could not read server log)"
            raise TimeoutError(
                f"Server did not start.\nServer log:\n{server_logs}"
            )

        # If ``specs`` was honoured, /alpha/ping should work; /ping (root)
        # would only work if ``spec`` was used instead.
        alpha_response = requests.get(
            f"{PARALLEL_BASE_URL}/alpha/ping", timeout=REQUEST_TIMEOUT
        )
        assert alpha_response.status_code == 200, (
            f"Expected /alpha/ping to be served (specs wins), got {alpha_response.status_code}"
        )

        # /ping at root should NOT be served when specs is used
        root_response = requests.get(
            f"{PARALLEL_BASE_URL}/ping", timeout=REQUEST_TIMEOUT
        )
        assert root_response.status_code == 404, (
            f"Expected /ping to return 404 when specs wins over spec, got {root_response.status_code}"
        )

    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            if hasattr(process, "_log_file"):
                process._log_file.close()  # type: ignore[attr-defined]
        shutil.rmtree(temp_work_dir, ignore_errors=True)
