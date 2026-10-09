# Phase 1 deployment handoff

The user will take over Vercel deployment. The working repository is private by request; it must become public before the assignment submission. No live deployment is implied by these configuration files. Record actual URLs and evidence in IMPLEMENTATION_PLAN.md after deployment.

## Render backend

1. Connect the repository to Render and use `render.yaml` as a Blueprint, or create an equivalent Docker web service with Dockerfile `backend/Dockerfile` and Docker build context `backend` relative to the repository root. Leave Root Directory unset for this explicit-path configuration.
2. Attach the configured disk at `/var/data`. The Blueprint selects a paid Starter service and 1 GB disk; review the current cost before provisioning.
3. Set `TYPEFORM_ALLOWED_ORIGINS` to a JSON array containing the exact HTTPS Vercel origin, for example `["https://your-project.vercel.app"]`. No trailing slash or wildcard. Include any separate preview origin explicitly if testing it.
4. Keep `TYPEFORM_ENVIRONMENT=production`, `TYPEFORM_DATABASE_PATH=/var/data/typeform.sqlite3`, and one instance/worker. The Docker command respects Render's `PORT`.
5. Runtime startup applies Alembic migrations before readiness. Do not put migrations in a pre-deploy/build command because the disk is only available at runtime.
6. Confirm `https://<backend>/api/v1/health/live` and `/api/v1/health/ready` return 200. Readiness failure should prevent traffic from reaching an unmigrated database.

The frontend origin can be assigned before deployment; if it changes, update the backend allowed origins. The temporary probe is enabled in the Blueprint solely for Phase 1 evidence. Disable it before final release.

## Vercel frontend

1. Import the private repository using the connected GitHub account.
2. Select **Root Directory: frontend**, framework Next.js, Node.js 24.x, install command `npm ci`, build command `npm run build`.
3. Set server-only `API_BACKEND_URL=https://<render-backend-host>` with no path/query or trailing path. The browser calls `/api/v1`; Next.js uses a fixed external rewrite.
4. Set `NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED=true` for the initial deployment check. This value is baked into the build; redeploy after changes.
5. Deploy and set Render's allowed origins to the resulting frontend origin. Repeat any affected deployment after changing the rewrite target or public flag.

No token, database path, or backend credential should use a `NEXT_PUBLIC_` variable. The Render backend itself does not need a public frontend API key.

## Required live verification

1. On the HTTPS frontend, open the workspace; confirm Connected.
2. Open Connection check and Run check. Confirm Cookie and storage verified; record the displayed UUID.
3. In browser developer tools, confirm the cookie belongs to the frontend host, is HttpOnly, Secure, SameSite=Lax, and has Path=/; the raw token must not be copied into logs or documentation.
4. Reload and run the check again; the UUID must match.
5. Restart the Render service, then run the check in the same browser; UUID must match again.
6. Trigger a backend redeployment with the disk retained; UUID must still match. Test an unrelated browser receives a distinct record.
7. Confirm API responses have Cache-Control: no-store, disallowed creator-write origins are rejected, and no stack traces or filesystem paths appear in errors.

Record date, commit, URLs, restart/redeploy steps, UUID, result, and environment. If a cookie fails, inspect Set-Cookie forwarding and backend allowed origins before relying on the arrangement for creator sessions. Successful local checks do not complete this live gate.

## SQLite operations

Docker Compose uses the `typeform-data` named volume; normal stop/restart/rebuild preserves it. Do not use `docker compose down --volumes` when retaining data. Render data belongs on the mounted disk, never the checkout or image filesystem. Deployments may briefly pause service, and this setup deliberately uses one backend instance.

The final backup/restore command and real domain-data restoration proof belong to Phase 7. Use SQLite's backup API; do not copy a live database file. Native development can set TYPEFORM_DATABASE_PATH outside OneDrive.

## Disable diagnostics before final release

Set `TYPEFORM_FOUNDATION_PROBE_ENABLED=false` on the backend and `NEXT_PUBLIC_FOUNDATION_PROBE_ENABLED=false` on the frontend, then redeploy. Health endpoints remain available. The foundation record and cookie are diagnostics, not real creator authentication, form seeds, or respondent analytics; Phase 2 introduces the domain schema and workspace sessions.

Official references: [Next.js external rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites), [Render persistent disks](https://render.com/docs/disks), [Vercel project root directory](https://vercel.com/docs/builds/configure-a-build#root-directory).
