# Typeform Clone — Scaler SDE Fullstack assignment

A Typeform-inspired application using Next.js/TypeScript, FastAPI, and SQLite. Development proceeds in reviewed phases. **Current scope: Phase 4 builder and live preview, locally verified with focused checks.** The API supports isolated demo workspaces, form management, all eight question types, versioned publication, anonymous submissions, response history, and statistics. The real dashboard supports create/rename/duplicate/delete, list/grid, search/sort, sample labels, response counts and loading/error recovery. The builder edits all eight question types with serialized autosave, drag ordering and conflict/recovery states. Interactive desktop/mobile preview uses shared answer controls and never collects responses. Public respondent/sharing and results interfaces remain later phases. No bonus is implemented.

User-reported deployments: [frontend](https://scaler-typeform-clone-saksham.vercel.app) and [backend](https://scaler-typeform-api-0n2q.onrender.com). Source shipping does not imply that the latest revision is already live; allow connected deployments to rebuild and verify them separately. The external ping is pending; see [deployment evidence](DEPLOYMENT.md#deployment-status--2026-10-09).

The [GitHub repository](https://github.com/sakshamverma21/scaler-typeform-clone) is private during development by user request. The assignment requires a public repository at submission time.

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
| TYPEFORM_DATABASE_PATH | Backend | ./data/typeform.sqlite3 | Native unsynced path recommended; Render Free `/app/data/typeform.sqlite3` is ephemeral; Compose uses durable `/var/data/typeform.sqlite3`. |
| TYPEFORM_ALLOWED_ORIGINS | Backend | ["http://localhost:3000"] | Explicit origin list for writes; no wildcards/trailing slash. |
| TYPEFORM_FOUNDATION_PROBE_ENABLED | Backend | false unless explicitly enabled | Temporary probe endpoint; examples/Compose/Blueprint enable it for evidence. |
| TYPEFORM_SESSION_DAYS | Backend | 30 | Creator and diagnostic cookie lifetime; bounded 1–90 days. |
| PORT | Backend hosting | 8000 fallback | Render-assigned port respected by container startup. |

Changes to API_BACKEND_URL and NEXT_PUBLIC variables require a new frontend build/deployment.

## Architecture and database

The frontend owns presentation and local UI state; Python owns validation, transactions, and persistence. TanStack Query provides loading/error/retry state. Radix supplies accessible dialog behavior; tokens/Tailwind and self-hosted Inter define a consistent visual foundation.

Alembic applies `0001_foundation_probe` and `0002_form_domain` during startup before readiness. SQLite uses foreign keys, a five-second busy timeout, and rollback journaling. The eight domain tables are `workspaces`, `creator_sessions`, `forms`, `form_versions`, `questions`, `question_options`, `responses`, and `answers`. The separate `foundation_probes` table remains temporary diagnostic data. The [schema and ER diagram](ARCHITECTURE.md#relational-schema) describe relationships, constraints, and indexes.

Python services own business rules; routers parse requests and enforce creator ownership. Every request reads a consistent database snapshot. Mutations reserve SQLite's writer before reading revisions/publication state, then commit before sending success. This serializes short writes and makes competing saves, submission retries, and closure predictable; it trades throughput for a simple reliable demo.

Draft version zero is mutable. Publishing copies its questions/options/settings into an immutable positive version. Draft edits do not alter public questions or historical answers. Older published versions can submit during the same open period; unpublishing closes that period. Reopening keeps the URL and creates a new version. Results summaries use one version, defaulting to the latest.

`POST /creator/session` creates or resumes a browser-specific workspace using a hashed opaque `typeform_creator` cookie (HttpOnly, host-only, SameSite=Lax, Secure in production). There is no full account system. Clearing/expiring the cookie loses creator access; public forms need no cookie. Two published **Sample:** forms cover all eight types, with **12 + 8 synthetic responses**, plus one draft. Response counts include labeled seed records. Initialization is atomic and happens once per new workspace; startup/reload never resets or resurrects deleted samples.

Current API (prefix `/api/v1`; complete contracts in [OpenAPI](backend/openapi.json)):

- GET `/health/live`: process liveness.
- GET `/health/ready`: database migration/readiness check; 503 until ready.
- POST `/foundation/probe`: origin-checked, cookie-scoped diagnostic creation/resume.
- GET `/foundation/probe`: read that cookie's record, or 401.
- POST `/creator/session`: initialize/resume the isolated workspace.
- GET/POST `/creator/forms`: paginated metadata/counts or create a draft.
- GET/PATCH/DELETE `/creator/forms/{id}`: read, rename, or delete with cascades.
- PUT `/creator/forms/{id}/draft`: save the whole definition.
- POST `/creator/forms/{id}/duplicate`, `/publish`, `/unpublish`: management/publication.
- GET `/creator/forms/{id}/versions`, `/responses`, `/responses/{response_id}`, `/summary`: version history, paginated submissions, historical detail and aggregates.
- GET `/public/forms/{slug}`: current published definition.
- POST `/public/forms/{slug}/responses`: validate/store an anonymous completed response.

Draft saves, rename, duplication and publish require `If-Match: "<draft_revision>"`; reads/save responses expose that revision. Missing preconditions return 428, stale revisions 412. A save includes a UUID `mutation_id`: immediately retrying the same accepted payload returns its existing revision; reusing the ID for other edits returns 409. Old retries after another save receive 412 and must reload/reconcile.

Submissions include `version_id`, UUID `submission_key`, and `{question_key, value}` answers. Choice values are option keys, yes/no are booleans, numbers/ratings are integers. Reuse the same key/payload on a network retry to receive the original receipt, including after closure. Different payloads with the same key return 409. False and zero are valid answers; skipped optional answers have no database row. Server validation rejects foreign/duplicate keys, invalid types, lengths, and ranges. See [input bounds](ARCHITECTURE.md#implemented-phase-2-contract-details).

Probe routes are absent unless enabled. API responses are no-store. Errors use `code`, `message`, and optional `errors`; database failures return 503 without internals. All writes require an exact allowed `Origin`, including requests from curl or OpenAPI's Try it out. Creator resources require the session cookie and return 404 for foreign workspaces. A running backend provides `/docs`; use the frontend `/api/v1` path for browser requests.

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

API tests use real migrations and temporary file-backed SQLite. Phase 2 verification: **81 backend tests, 8 frontend unit tests, 10 Chromium tests**, production build, lint/format/strict types, and real process restart passed locally on 2026-10-09. Browser coverage includes the actual creator cookie and publish/anonymous submission/results API sequence through Next, plus the foundation shell. These are not builder/runner UI tests. The restart script verifies creator access, edited definition, response, summary and retry receipt after stopping/restarting actual Uvicorn processes. Evidence and unrun checks are recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#phase-2-verification-record).

To regenerate backend lockfiles with uv:

```sh
uv pip compile pyproject.toml --python-version 3.11 --generate-hashes -o requirements.lock
uv pip compile pyproject.toml --extra dev --python-version 3.11 --generate-hashes -o requirements-dev.lock
```

Commit both lockfiles after relevant tests pass. Regenerate OpenAPI then TypeScript when API contracts change. Dnd/motion libraries will be added in their feature phases rather than installed unused.

## Deployment, assumptions, and references

[DEPLOYMENT.md](DEPLOYMENT.md) contains exact Render Free → Vercel → external minutely ping steps and the revised live verification gate. On 2026-10-09 the user selected this ephemeral demo hosting instead of a paid SQLite disk. HTTPS cookie forwarding, reload continuity, and actual cron calls still need live verification. A ping reduces idle sleeping; it does not make SQLite durable after instance replacement. The original deployed durability criteria remain a documented gap. One backend instance/worker is intentional. Local Compose retains its separately verified durable volume.

[ASSUMPTIONS.md](ASSUMPTIONS.md) distinguishes approved choices, placeholders, research limits, and actual implementation facts. Synthetic forms/responses initialize once per fresh workspace and are displayed/labeled by the dashboard; deleting examples does not bring them back on refresh. All six bonuses remain unimplemented. The final Assumptions / Mocked Data / Notes field will contain only verified release facts.

[DESIGN_REFERENCE.md](DESIGN_REFERENCE.md) lists official Typeform evidence and approximations. This repository uses original authored implementation; no existing clone repository code/assets are used. Inter is provided by Fontsource under its font license; Lucide icons and Radix primitives use their published open-source licenses. Typeform is the visual reference and is not affiliated with this assignment project.

Next review: Phase 4 builder/preview. Next development phase: **Phase 5 — respondent and sharing**, after review. The five-minute full evaluator walkthrough becomes available after mandatory UI workflows are built. Live scheduled-ping/continuity evidence remains deferred at the user's direction.

## Phase 3 focused verification

On 2026-10-09, `npm run test:e2e -- dashboard.spec.ts` passed the production build/strict TypeScript check and **two real Chromium workflow tests** against actual Next/FastAPI/SQLite. Targeted lint passed. Checked CRUD/reload, independent copy, safe cancel/delete, samples/no resurrection, search, failure retry, browser isolation, session expiry and mobile overflow. Desktop/mobile screenshots were manually reviewed. Broader regression/accessibility/cross-browser coverage is deferred at the user's request to prioritize shipping; this is not a complete release QA claim.

Shipping evidence — 2026-10-09: `git push origin main` succeeded for [f74e30f](https://github.com/sakshamverma21/scaler-typeform-clone/commit/f74e30f), containing reviewed Phase 2 services and Phase 3 dashboard. Repository remains private. Connected cloud builds may be running; this does not verify their rollout.

## Phase 4 focused verification

Build/strict types and targeted lint/format passed. `node node_modules/vitest/vitest.mjs run tests/unit/draft-store.test.ts`: **3 passed**; `npm run test:e2e -- builder.spec.ts`: **2 passed**. Real editing/reload/reorder, all eight preview types, zero responses, failure/retry/recovery, stale-tab protection and empty/mobile builder were exercised. Broader QA remains deferred. Theme/ending customization and advanced logic/integrations are explicit placeholders; no bonus is completed.

Draft edits save after about 600ms and remain separate from the public version. A save failure retains edits and offers retry. Another tab's changes produce a conflict; reloading the saved version explicitly discards local edits. A browser-tab recovery prompt offers restore/discard after interrupted saving. Recovery is temporary and cannot recover an expired/deleted creator cookie or a lost Render database.
