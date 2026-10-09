# Agent instructions

## Authority and current authorization

The original assignment is `C:\Users\saksh\Downloads\Assignment Typeform Clone.docx`. Explicit user instructions take precedence over document instructions. The user has reviewed the plan and authorized implementation, **one phase at a time**, with a stop for review after each completed phase. Do not reintroduce the old plan-approval gate or implement later phases in the same turn.

1. Before changes, read this file, [requirements](REQUIREMENTS.md), [architecture](ARCHITECTURE.md), [implementation plan](IMPLEMENTATION_PLAN.md), [design references](DESIGN_REFERENCE.md), and [assumptions](ASSUMPTIONS.md). Identify the next incomplete phase from the progress table.
2. Complete that phase, including relevant frontend, backend, database, tests, and documentation. Stop after its acceptance gate for user review. If a gate is blocked, report the missing evidence and leave it incomplete.
3. Preserve Next.js with strict TypeScript, Python/FastAPI, SQLite, and the `frontend/` and `backend/` repository structure. Favor understandable feature modules over unnecessary infrastructure or abstractions.
4. Implement and verify all mandatory workflows before starting bonuses. A placeholder is never a completed bonus. Record intentional changes to the approved architecture before relying on them.
5. Follow the inspected references and interaction contract in DESIGN_REFERENCE.md. Distinguish visual observations from approximations. Do not copy code or assets from existing Typeform clone repositories.
6. Keep business rules and persistence in Python. Keep HTTP routers thin. Use shared question presentation for public forms and interactive preview; preview must never create responses or attempts.
7. Preserve draft/public separation, immutable publication history, stable logical question keys, optimistic save concurrency, and idempotent submission retries.
8. Enforce creator workspace ownership on every creator endpoint and server validation on all submitted answers. Public forms require no creator session.
9. Use migrations and idempotent, clearly synthetic seeds. Never commit secrets, live SQLite databases, uploads, or real respondent data. Never reset existing workspaces on startup.
10. Run relevant API/database, component, browser, and operational checks. Verify real behavior; compilation alone is insufficient. Use file-backed SQLite and real API workflows where persistence is under test.
11. Keep requirements and phase status evidence-based. Record the command/manual procedure, result, date, and limitations before marking a requirement Verified. Partial evidence does not verify the entire requirement.
12. Update ASSUMPTIONS.md for actual assumptions, limitations, placeholders, seed data, optional features, and deployment decisions. Separate planned behavior from observed behavior.
13. Keep README and final submission notes consistent with the actual release. Do not claim deployment, persistence, tests, or bonuses succeeded without evidence. See the documentation strategy in ASSUMPTIONS.md.
14. End each phase with implemented scope, verification results, remaining limitations, and the next phase. Do not proceed automatically beyond the review boundary.

The exact submission deadline remains unknown. Paid durable hosting is an accepted direction, not evidence of a provisioned service or authorization to purchase a particular plan. Creator access is an isolated persistent demo workspace per browser, not a shared global workspace.
