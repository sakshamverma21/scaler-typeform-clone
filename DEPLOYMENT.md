# Phase 1 deployment handoff

**Selected on 2026-10-09:** Vercel frontend + Render Free Docker backend + an external minutely HTTP ping. This supersedes the original paid Render disk proposal. The user accepts an ephemeral database for the expected short evaluation window; that window is an expectation, not a hosting guarantee. The ping reduces idle sleeping; it does not back up SQLite or preserve it after the instance is replaced. See [Render Free limitations](https://render.com/docs/free) and [ASSUMPTIONS.md](ASSUMPTIONS.md).

The [working repository](https://github.com/sakshamverma21/scaler-typeform-clone) is private by request; it must become public before submission. No live Render/Vercel service or cron job has been verified. The user retains Vercel deployment responsibility. Record actual URLs and evidence in IMPLEMENTATION_PLAN.md after deployment.

## 1. Create the Render backend

1. Open the [Render dashboard](https://dashboard.render.com/), sign in, and connect GitHub with access to the private repository above.
2. Choose **New → Blueprint**, select that repository and branch **main**, and use the root `render.yaml`. Ensure the latest Free configuration is pushed before continuing. Create only the service in this Blueprint; no database service or paid cron service is needed.
3. Inspect the resource summary: a **Free**, Docker web service named `scaler-typeform-api`, one instance, **no attached disk**. If the dashboard offers a paid instance, change it to Free before creating the service.
4. For the prompted `TYPEFORM_ALLOWED_ORIGINS`, use `["https://frontend-not-configured.invalid"]` temporarily if the Vercel address is not known. This is an explicit reserved placeholder, not a deployed frontend. The backend requires a nonempty HTTPS origin list; health requests work, while real creator writes remain blocked until step 2 sets the actual origin. Do not use `[]` or a wildcard.
5. Create/deploy the Blueprint. Its repository-relative Dockerfile is `./backend/Dockerfile`, build context `./backend`; Root Directory stays unset. The Dockerfile already supplies the start command and honors Render's assigned `PORT`. Do not add a separate build, start, or pre-deploy migration command.
6. Check the service's environment values:

   | Variable | Value |
   |---|---|
   | `TYPEFORM_ENVIRONMENT` | `production` |
   | `TYPEFORM_DATABASE_PATH` | `/app/data/typeform.sqlite3` |
   | `TYPEFORM_ALLOWED_ORIGINS` | `["https://frontend-not-configured.invalid"]` until the exact Vercel origin is available |
   | `TYPEFORM_FOUNDATION_PROBE_ENABLED` | `true` for Phase 1 checking |
   | `TYPEFORM_SESSION_DAYS` | `30` |

7. Wait for a successful deployment. Copy the actual service URL, such as `https://your-api.onrender.com`; this example is not an existing deployment.
8. Open that URL with `/api/v1/health/live` and `/api/v1/health/ready` appended. Both must return HTTP 200 with JSON. Render's health-check path is `/api/v1/health/ready`; runtime startup applies migrations before readiness.

If creating a Web Service manually instead of using the Blueprint, enter the same Docker paths, Free plan, environment values, and health-check path. Do not create both versions of the service.

## 2. Deploy the Vercel frontend

1. Open the [Vercel dashboard](https://vercel.com/dashboard). Choose **Add New → Project** and import `sakshamverma21/scaler-typeform-clone` using the connected GitHub account. Grant access to this private repository if it does not appear.
2. Set **Root Directory: frontend**, framework **Next.js**, Node.js **24.x**, install command `npm ci`, and build command `npm run build`. Leave Output Directory at the Next.js default.
3. Add these environment variables to the Production environment before deploying:

   | Variable | Value |
   |---|---|
   | `API_BACKEND_URL` | Actual Render HTTPS origin, for example `https://your-api.onrender.com` |
   | `NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED` | `true` for Phase 1 checking |

   `API_BACKEND_URL` has no `/api/v1`, other path, query, or trailing slash. It is server/build configuration; do not rename it with a `NEXT_PUBLIC_` prefix. The browser calls its own `/api/v1` and Next.js forwards to the fixed backend.

4. Deploy. Copy the stable Production frontend origin, for example `https://your-project.vercel.app`, rather than a per-deployment preview URL.
5. In Render, edit `TYPEFORM_ALLOWED_ORIGINS` to a JSON array containing that exact origin: `["https://your-project.vercel.app"]`. No trailing slash. Save/apply the environment change and wait for readiness again. **Do this before creating evaluation data**, since a backend redeployment replaces the Free instance's database.
6. Open `https://your-project.vercel.app/forms`. Confirm the connection check works. If using another Vercel preview origin, add it explicitly to Render's origin array; it is not automatically authorized.

Changes to the rewrite destination or public diagnostic flag need a new frontend build. Do not put tokens, cookies, or database paths in public frontend variables.

## 3. Configure the external ping

Use [cron-job.org](https://cron-job.org/en/), whose [official FAQ](https://cron-job.org/en/faq/) documents free minutely execution. This is an external HTTP scheduler, separate from Render's cron service.

1. Create/sign in to your cron-job.org account and create a cron job.
2. Title it `Scaler Typeform backend ping`.
3. Set its URL to the **actual backend** liveness endpoint: `https://your-api.onrender.com/api/v1/health/live`.
4. Set the request method to **GET**, with no request body, authentication, custom headers, or cookies. Use the schedule equivalent to **every minute**, and enable the job. Check the displayed next execution times are about one minute apart.
5. Run a manual test and inspect execution history: expect HTTP 200 and a small JSON body. Turn on failure notifications if desired.
6. Check several subsequent scheduled executions. If the first call hits a sleeping backend, open the health URL manually and wait for readiness, then test again. The scheduler's default timeout may expire during the initial wake-up; one timeout is not proof that the API is broken.

The job is **not configured yet**: an actual Render URL and access to the scheduler account are needed. It only calls health; it must never create a creator session, seed data, submit a response, or touch private account information. The existing frontend requests readiness on workspace load and has loading/error/retry states. Those local states are verified; deployed cold-start behavior still needs observation.

## 4. Verify the selected demo deployment

1. On the HTTPS frontend, confirm Connected. Open **Connection check → Run check**, confirm Cookie and storage verified, and record the displayed diagnostic UUID.
2. In browser developer tools, confirm its cookie belongs to the frontend host and is HttpOnly, Secure, SameSite=Lax, with Path=/; never copy the raw cookie token into documentation.
3. Reload the same browser, run the check again, and verify the UUID matches. Test an unrelated browser receives a different record.
4. Leave the backend untouched for more than 15 minutes while the cron job is active. Record successful scheduled calls, then reload the frontend and verify the same UUID. This tests the ping and same-instance continuity; it is **not** restart durability proof.
5. Confirm API responses have `Cache-Control: no-store`, disallowed write origins are rejected, and errors expose no stack traces or filesystem paths.
6. Record the date, deployed commit, frontend/backend URLs, procedure/results, and scheduler history. The live gate remains pending until these checks run.

At the user's direction, a cloud restart/redeploy survival test is no longer a prerequisite for the Phase 1 demo handoff. The original durability criteria for M16, M27, and M38 remain an explicitly recorded hosting gap; do not mark OPS-PERSIST fully passed. Local Docker volume persistence is already verified for diagnostic data.

## Data and evaluation preparation

Render Free stores SQLite at `/app/data/typeform.sqlite3` inside its ephemeral filesystem. Refreshes and separate browser sessions can use the same database while that instance and file remain available. Replacement can remove it; a scheduled ping does not prevent that.

Phase 2 will seed each fresh workspace once with clearly synthetic examples. Existing workspaces are never reset or refilled on page load/startup. If the entire database is lost, a new workspace gets new samples; previous edits/responses are not recovered by seeding. Domain seeds are **not implemented yet**.

Before the evaluator walkthrough, finish required deployments/environment changes, wait for health and successful cron calls, then prepare any demo data. Set Render auto-deploys to **Off** during the evaluation window, avoid manual redeployments, and inspect the frontend/health before sharing the link. Resume deployments deliberately after review. Record the Free hosting limitation in the final submission notes; do not advertise permanent storage.

Local Compose remains different: its `typeform-data` named volume at `/var/data` survives normal restart/rebuild. Do not use `docker compose down --volumes` when retaining local data. Native development accepts an unsynced database path outside OneDrive. The SQLite backup API and application-data restore checks remain planned for Phase 7/local durable storage.

## Disable diagnostics before final release

Set backend `TYPEFORM_FOUNDATION_PROBE_ENABLED=false` and frontend `NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED=false`, then deploy before preparing final demo data. Health endpoints remain available for the ping. Diagnostics are not creator authentication, form seeds, or analytics; Phase 2 supplies the domain schema and workspace sessions.

Official configuration references: [Render Blueprint fields](https://render.com/docs/blueprint-spec), [Next.js external rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), [Vercel project root directory](https://vercel.com/docs/builds/configure-a-build#root-directory).
