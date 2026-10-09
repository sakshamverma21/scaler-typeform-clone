"""Verify a real process restart against one file-backed SQLite database."""

import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from http.cookiejar import CookieJar
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "http://localhost:3000"


def start_backend(port: int, database: Path, log):
    environment = {
        **os.environ,
        "TYPEFORM_ENVIRONMENT": "test",
        "TYPEFORM_DATABASE_PATH": str(database),
        "TYPEFORM_ALLOWED_ORIGINS": json.dumps([ORIGIN]),
        "TYPEFORM_FOUNDATION_PROBE_ENABLED": "true",
    }
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
        ],
        cwd=ROOT,
        env=environment,
        stdout=log,
        stderr=log,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError("Backend exited before readiness; inspect the process log")
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/v1/health/ready", timeout=1):
                return process
        except OSError:
            time.sleep(0.1)
    process.terminate()
    process.wait(timeout=10)
    raise RuntimeError("Backend readiness timed out")


def stop_backend(process):
    if os.name == "nt":
        # A venv Python launcher can own the actual interpreter as a child.
        # Stop only this test's process tree, otherwise a false restart can pass.
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True,
        )
        process.wait(timeout=10)
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


def main():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        port = sock.getsockname()[1]
    with tempfile.TemporaryDirectory(prefix="typeform-restart-") as directory:
        database = Path(directory) / "restart.sqlite3"
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
        url = f"http://127.0.0.1:{port}/api/v1/foundation/probe"
        with (Path(directory) / "process.log").open("w", encoding="utf-8") as log:
            first = start_backend(port, database, log)
            try:
                request = urllib.request.Request(url, method="POST", headers={"Origin": ORIGIN})
                with opener.open(request, timeout=10) as response:
                    saved = json.load(response)
            finally:
                stop_backend(first)
            restarted = start_backend(port, database, log)
            try:
                with opener.open(url, timeout=10) as response:
                    restored = json.load(response)
                if restored != saved:
                    raise RuntimeError("The persisted record changed after restarting the process")
                print(
                    json.dumps(
                        {"result": "PASS", "record_id": saved["id"], "process_restart": True}
                    )
                )
            finally:
                stop_backend(restarted)


if __name__ == "__main__":
    main()
