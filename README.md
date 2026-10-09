# Typeform Clone — Scaler SDE Fullstack assignment

A Typeform-inspired application using Next.js/TypeScript, FastAPI, and SQLite. Development proceeds in reviewed phases. **Current scope: Phase 1 foundation.** Form CRUD, the builder, publishing, submissions, sample forms, and results are not implemented yet. Live deployment is pending the user's Vercel handoff and Render setup.

The repository is private during development by user request. The assignment requires a public repository at submission time.

## Run locally

Prerequisites: Node.js **24.15 or newer in the 24.x line**, npm, Python **3.11**, and Git. Docker Desktop with its Linux engine is optional for the Compose path. Dependencies are pinned in `frontend/package-lock.json` and the hash-locked backend requirements files.

### Native Windows / PowerShell

From the repository root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install --require-hashes -r backend/requirements-dev.lock
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Because this checkout is inside OneDrive, edit `backend/.env` to use an unsynced database path, for example `C:/Users/<you>/AppData/Local/ScalerTypeform/typeform.sqlite3`. No real data or secrets belong in Git. Then start the backend in one terminal:

```powershell
Set-Location backend
.venv/Scripts/python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal:

```powershell
Set-Location frontend
npm ci
npm run dev
```

Open [the workspace](http://localhost:3000/forms). Health endpoints are [liveness](http://localhost:8000/api/v1/health/live) and [readiness](http://localhost:8000/api/v1/health/ready). The frontend's `/api/v1` rewrite is the browser API path. Do not open the site as `127.0.0.1:3000` without also configuring that exact allowed origin.

If port 8000 is occupied, choose another backend port and set API_BACKEND_URL in `frontend/.env.local` to match. The current machine has another Docker service on 8000; the Compose path below avoids publishing the backend host port altogether.

### macOS / Linux

Use `python3.11 -m venv backend/.venv` and `backend/.venv/bin/python` in place of the Windows Python paths. Copy environment files with `cp`. Otherwise the same working directories, npm commands, and backend command apply. Activate the virtual environment or invoke its executables explicitly.

### Docker Compose

```sh
docker compose up --build -d
docker compose logs -f
```

Open localhost:3000. SQLite uses a named volume mounted at `/var/data`. Normal stop/restart/rebuild preserves it; `docker compose down --volumes` removes data and is not part of a persistence check. Only the frontend is published on localhost; its rewrite reaches the backend inside the Docker network. Compose is configured for local HTTP, while Render uses production secure cookies.

## Environment variables

| Variable | Location | Default / example | Purpose |
|---|---|---|---|
| API_BACKEND_URL | Frontend, server/build only | http://127.0.0.1:8000 | Fixed API rewrite destination; production uses Render HTTPS origin. |
| NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED | Frontend build | true in example | Temporary Connection check UI; disable before release. |
| TYPEFORM_ENVIRONMENT | Backend | development | Production requires HTTPS origins and Secure cookies. |
| TYPEFORM_DATABASE_PATH | Backend | ./data/typeform.sqlite3 | Native absolute unsynced path recommended; deployment `/var/data/typeform.sqlite3`. |
| TYPEFORM_ALLOWED_ORIGINS | Backend | ["http://localhost:3000"] | Explicit origin list for writes; no wildcards/trailing slash. |
| TYPEFORM_FOUNDATION_PROBE_ENABLED | Backend | false unless explicitly enabled | Temporary probe endpoint; examples/Compose/Blueprint enable it for evidence. |
| TYPEFORM_SESSION_DAYS | Backend | 30 | Probe cookie lifetime; bounded 1–90 days. |
| PORT | Backend hosting | 8000 fallback | Render-assigned port respected by container startup. |

Changes to API_BACKEND_URL and NEXT_PUBLIC variables require a new frontend build/deployment.

## Architecture and database

The frontend owns presentation and local UI state; Python owns validation, transactions, and persistence. TanStack Query provides loading/error/retry state. Radix supplies accessible dialog behavior; tokens/Tailwind and self-hosted Inter define a consistent visual foundation.

The only current application table is `foundation_probes` (UUID, unique hashed opaque token, UTC creation/expiry). It contains diagnostic records, not forms or responses. Alembic migration `0001_foundation_probe` runs during startup before readiness; SQLite uses foreign keys, a five-second busy timeout, and rollback journaling. Probe cookies are HttpOnly, host-only, SameSite=Lax, and Secure in production. Repeated checks reuse a browser's saved record.

The eight-table domain design, immutable published definitions, typed answers, optimistic draft saves, and idempotent responses are planned in [ARCHITECTURE.md](ARCHITECTURE.md), not yet implemented. Domain schema/ER diagram and feature/API overview will expand in Phase 2.

Current API (prefix `/api/v1`):

- GET `/health/live`: process liveness.
- GET `/health/ready`: database migration/readiness check; 503 until ready.
- POST `/foundation/probe`: origin-checked, cookie-scoped diagnostic creation/resume.
- GET `/foundation/probe`: read that cookie's record, or 401.

Probe routes are absent unless enabled. API responses are no-store. Errors use code/message fields; database failures return recoverable 503 without internal paths. [OpenAPI JSON](backend/openapi.json) is committed; a running backend also provides `/docs`.

## Checks and generated contracts

Backend, from `backend/`:

```powershell
.venv/Scripts/ruff.exe check .
.venv/Scripts/ruff.exe format --check .
.venv/Scripts/python.exe -m pytest -q
.venv/Scripts/python.exe scripts/verify_local_restart.py
.venv/Scripts/python.exe scripts/export_openapi.py
```

Frontend, from `frontend/`:

```sh
npm run api:generate
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser-test runner builds a real production artifact with the diagnostic flag and dedicated API rewrite, then Playwright starts its backend on **18080** and packaged standalone frontend on **13000**. Keep those test ports free; normal development remains on 8000/3000. It writes temporary SQLite under ignored `frontend/.cache/e2e`, outside the test-output cleanup directory. CI supplies its Python executable through PYTHON_EXECUTABLE; native tests use the project virtual environment. Run `npm run build` again before `npm run start` to restore the normal backend target after browser tests; `npm run dev` reads the normal environment directly.

API tests use real migrations and temporary file-backed SQLite. Browser tests verify the actual rewrite/cookie path, reload persistence, responsive shell/dialogs, focus return, and retry after simulated failure. The restart script stops and restarts actual Uvicorn processes against the same database. A build alone is not feature proof. Evidence and unrun checks are recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

To regenerate backend lockfiles with uv:

```sh
uv pip compile pyproject.toml --python-version 3.11 --generate-hashes -o requirements.lock
uv pip compile pyproject.toml --extra dev --python-version 3.11 --generate-hashes -o requirements-dev.lock
```

Commit both lockfiles after relevant tests pass. Regenerate OpenAPI then TypeScript when API contracts change. Dnd/motion libraries will be added in their feature phases rather than installed unused.

## Deployment, assumptions, and references

[DEPLOYMENT.md](DEPLOYMENT.md) contains the private-repository→Render→Vercel handoff and exact live verification gate. Persistent SQLite storage, HTTPS cookie forwarding, and deployed restart/redeploy survival must still be verified on real hosts. One backend instance/worker is intentional, with brief deployment downtime possible.

[ASSUMPTIONS.md](ASSUMPTIONS.md) distinguishes approved choices, placeholders, research limits, seed plans, and actual implementation facts. No synthetic forms/responses have been inserted yet; all six bonuses remain unimplemented. The final Assumptions / Mocked Data / Notes field will contain only verified release facts.

[DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) lists official Typeform evidence and approximations. This repository uses original authored implementation; no existing clone repository code/assets are used. Inter is provided by Fontsource under its font license; Lucide icons and Radix primitives use their published open-source licenses. Typeform is the visual reference and is not affiliated with this assignment project.

Next review: finish Phase 1 deployment evidence, then Phase 2 schema/core services. The five-minute full evaluator walkthrough becomes available after mandatory workflows are built.
