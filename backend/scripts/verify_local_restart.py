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
from uuid import uuid4

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
        api = f"http://127.0.0.1:{port}/api/v1"

        def call(path, method="GET", body=None, revision=None):
            headers = {"Origin": ORIGIN}
            if body is not None:
                headers["Content-Type"] = "application/json"
            if revision is not None:
                headers["If-Match"] = f'"{revision}"'
            request = urllib.request.Request(
                api + path,
                method=method,
                headers=headers,
                data=json.dumps(body).encode() if body is not None else None,
            )
            with opener.open(request, timeout=10) as response:
                return json.load(response)

        with (Path(directory) / "process.log").open("w", encoding="utf-8") as log:
            first = start_backend(port, database, log)
            try:
                request = urllib.request.Request(url, method="POST", headers={"Origin": ORIGIN})
                with opener.open(request, timeout=10) as response:
                    saved = json.load(response)
                workspace = call("/creator/session", "POST")
                created = call("/creator/forms", "POST", {"title": "Process restart proof"})
                form_path = f"/creator/forms/{created['form']['id']}"
                definition = created["draft"]
                key = str(uuid4())
                definition["questions"] = [
                    {"question_key": key, "type": "number", "title": "How many?", "required": True}
                ]
                call(
                    form_path + "/draft",
                    "PUT",
                    {"mutation_id": str(uuid4()), "definition": definition},
                    0,
                )
                published = call(form_path + "/publish", "POST", revision=1)
                public_path = f"/public/forms/{published['public_slug']}"
                version = call(public_path)
                submission = {
                    "version_id": version["version_id"],
                    "submission_key": str(uuid4()),
                    "answers": [{"question_key": key, "value": 0}],
                }
                receipt = call(public_path + "/responses", "POST", submission)
            finally:
                stop_backend(first)
            restarted = start_backend(port, database, log)
            try:
                with opener.open(url, timeout=10) as response:
                    restored = json.load(response)
                if restored != saved:
                    raise RuntimeError("The persisted record changed after restarting the process")
                assert call("/creator/session", "POST") == workspace
                persisted = call(form_path)
                assert persisted["draft"]["questions"][0]["question_key"] == key
                assert persisted["form"]["response_count"] == 1
                assert call(public_path + "/responses", "POST", submission) == receipt
                assert call(form_path + f"/responses/{receipt['id']}")["answers"][0]["value"] == 0
                assert call(form_path + "/summary")["questions"][0]["mean"] == 0
                print(
                    json.dumps(
                        {
                            "result": "PASS",
                            "record_id": saved["id"],
                            "process_restart": True,
                            "form_id": created["form"]["id"],
                            "response_id": receipt["id"],
                            "creator_session": True,
                            "summary": True,
                            "retry": True,
                        }
                    )
                )
            finally:
                stop_backend(restarted)


if __name__ == "__main__":
    main()
