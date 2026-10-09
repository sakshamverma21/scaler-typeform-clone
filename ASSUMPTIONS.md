# Assumptions, limitations, and submission notes ledger

Read alongside [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md), and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

This ledger separates approved choices from implemented facts. **Planned** does not mean working. Update entries when implementation, evidence, or scope changes; do not leave removed bonuses marked complete. Record meaningful deviations before documenting them as accepted behavior.

## Observed repository state

- 2026-10-09, beginning of Phase 0: workspace was empty; all six requested planning files were absent; no Git repository or application existed.
- The full assignment was extracted and audited (97 paragraphs, one evaluation table). Its source path, fingerprint, and coverage ledger are in REQUIREMENTS.md.
- Phase 0 completed on 2026-10-09: all six approved planning documents passed the source/consistency audit. That phase contained no application implementation or runtime testing.
- Phase 1 on 2026-10-09: frontend/backend foundation, lockfiles, health/migrations, cookie probe, tests, Docker/CI/deployment configuration, and README were implemented. All domain forms, real creator workspaces, submissions, and bonuses remain unimplemented. Live hosting is not verified.
- The user has approved implementation, one phase at a time, stopping after each phase for review. The earlier plan-approval restriction is satisfied; the per-phase stop remains active.

## Decision and limitation ledger

| ID | Category / decision | Rationale and affected requirements | Status | Submission relevance |
|---|---|---|---|---|
| A01 | FastAPI selected from permitted Python frameworks | Focused typed API and custom frontend; M34. | Foundation implemented, domain services pending | FastAPI 0.143.0 currently locked. |
| A02 | Isolated browser-specific anonymous creator workspace | Confirmed user preference; P05, M10, M23. | Confirmed preference, unimplemented | Explain demo access clearly. |
| A03 | Opaque creator cookie expires after 30 days | Simple persistence without full accounts; P05. Clearing/expiry loses UI access; no recovery/cross-device creator access. | Planned limitation | Disclose actual lifetime/access limits. |
| A04 | Public forms need no creator login | Explicit source requirement; M23. | Mandatory, unimplemented | Verify with unrelated browser. |
| A05 | Multiple choice is single-selection initially | Assignment does not mandate multiselect/Other/randomization; M06. | Approved scope, unimplemented | Mention only if material to evaluator. |
| A06 | Number is nonnegative whole number, maximum 15 digits | Typeform direction; zero explicitly accepted; M06–M07, M21. | Approved default, unimplemented | Document input contract. |
| A07 | Rating defaults to five stars; maximum configurable 1–10 | Practical type settings; M06. | Approved default, unimplemented | Document settings. |
| A08 | Short/long text maxima 999/10,000 characters | Bounded validation; M06, M21. | Approved limits, unimplemented | API/setup documentation. |
| A09 | Draft autosave and publication are separate | Prevent incomplete edits changing public forms; M03, M14–M16. | Approved improvement, unimplemented | Explain publish behavior. |
| A10 | Immutable published versions and version-specific summaries | Preserve historical question/answer meaning; M05, M25–M27. | Approved improvement, unimplemented | Explain schema and summary denominators. |
| A11 | Duplicate copies current draft only | Independent content/settings, no responses or published status; M12. | Approved behavior, unimplemented | README behavior overview. |
| A12 | Synthetic sample forms and responses per fresh workspace | Immediate evaluation; M32. No real personal data. | Planned seed strategy | Must identify sample data and whether counts include it. |
| A13 | Theme/ending customization starts as an explicit placeholder | Allowed baseline; M31. Actual default thank-you is mandatory. | Planned placeholder | Disclose unless replaced with real verified customization. |
| A14 | Advanced logic, integrations, teams, payment/file-upload begin as placeholders | P01–P04; actual public sharing remains functional. | Planned placeholders | List meaningful remaining placeholders at release. |
| A15 | Original creator font and exact animation timing not verified | Official image/live reference limitations; M28. Inter/timings are proposed approximations. | Known research limitation | Do not claim pixel-perfect fidelity. |
| A16 | Paid hosting with durable storage acceptable | Confirmed user preference; M38. Does not mean a specific purchase is authorized or an account exists. | Confirmed direction, no resources provisioned | Record actual host, URL, persistence after verification. |
| A17 | Vercel frontend / Render backend + SQLite disk | Approved deployment direction; M16, M27, M38. Cookie rewrite must be proved early. | Planned architecture | Disclose actual deployment, not merely intended deployment. |
| A18 | One backend instance/worker; possible brief deployment downtime | SQLite disk model and scope; M38. | Planned deployment limitation | Evaluator-relevant availability/scaling limit. |
| A19 | Local Docker named volume; native DB path configurable outside synced folder | Checkout is inside OneDrive; avoid cloud-sync database interference. | Verified native restart and Docker restart/recreation persistence for diagnostic data | Domain/redeployment proof still required later. |
| A20 | Earlier published versions accepted only within same open epoch | Keep in-flight answers stable; unpublish closes old sessions even after reopening; M15, M22. | Approved behavior, unimplemented | Explain interview edge case. |
| A21 | Optional answers stored as absent rows; false/zero are answers | Correct validation and denominators; M07, M26. | Approved behavior, unimplemented | API/schema documentation. |
| A22 | No email deliverability checking | Syntax validation satisfies baseline; M06, M21. | Planned simplification | Avoid suggesting address verification. |
| A23 | No full account/team/integration/payment product | Explicit scope permissions; P01–P05. | Approved scope | Do not present disabled controls as complete. |
| A24 | Actual submission deadline not yet recorded | User reported more than 36 hours available; source ~24-hour effort estimate is not a deadline. | External information pending | Scheduling only; no fabricated due date. |
| A25 | All six bonuses start only after mandatory release gate | Protect functionality/fidelity/reliability. | Approved sequencing | Report only individually verified bonuses. |
| A26 | Physical-phone software keyboard not yet tested | Viewport emulation is incomplete mobile evidence; U03. | Pending release check | Remains limitation until actual check. |
| A27 | Working repository private; Vercel deployment handed to user | Explicit latest user instruction; M36, M38. Public repository is still required for final submission. | Private repo created, visibility verified, Phase 1 source pushed to main; hosting handoff pending | Do not claim public repo/deployment; change visibility only with user authorization. |
| A28 | Temporary foundation probe and unavailable/empty route shell | Phase 1 diagnostic validates storage/cookies, not creator auth or real forms. Probe flag defaults false; example configurations enable it. | Implemented and tested locally | Disable probe/UI before release; remove or migrate diagnostics later. |
| A29 | Node 24.15+ / Python 3.11 runtime; TypeScript 5.9.3 | Modern patched test tools require newer Node; OpenAPI generator supports TypeScript 5.x. | Locked and tested locally, same targets in Docker/CI | Exact setup requirements. |
| A30 | Test ports 13000/18080, SQLite outside test-output cleanup | Existing unrelated Docker service uses 8000. Isolate tests and prevent cleanup from affecting live test DB. | Implemented, nine browser checks passed | Test instructions; no unrelated service stopped. |
| A31 | Development dependency advisories / upstream warnings | npm audit reports five high entries through Next's lint-only fast-glob/micromatch/braces chain; no patched braces release was available. Compatible Next lint plugins require ESLint 9. HTTPX TestClient has an upstream deprecation warning. | Recorded tooling limitation; production npm audit reports zero vulnerabilities | Recheck/update tools when compatible upstream fixes exist; do not use forced framework downgrades or suppress results. |

## Synthetic data specification

Planned data, not yet inserted anywhere:

- **Product feedback:** short text, email, multiple choice, yes/no, rating, long text; approximately 12 synthetic completed submissions.
- **Event registration:** short text, email, dropdown, number, multiple choice, long text; approximately 8 synthetic completed submissions.
- One small unpublished draft demonstrates draft status and continued editing.

Use original neutral copy and addresses such as `person@example.com`. Label sample forms and seed responses. Dashboard completed counts include seeds. Generate through the same validation/domain paths as normal records, with independent identifiers per workspace. Seed once transactionally; repeated initialization, restart, and deletion must not repopulate deleted samples. No destructive reset on startup.

## Bonus status ledger

| Requirement | Feature | State | Final-note rule |
|---|---|---|---|
| B01 | CSV export | Planned, unimplemented | Claim only after export correctness and authorization tests. |
| B02 | Custom themes | Planned, unimplemented | Claim only actual colors/fonts/background controls; no implied image uploads. |
| B03 | Dark mode | Planned, unimplemented | Specify creator shell scope. |
| B04 | Basic branching | Planned, unimplemented | Claim only after editor, public flow, server validation, progress, and results all work. |
| B05 | Partial responses/completion rate | Planned, unimplemented | Browser-local recovery alone is not partial-response analytics. |
| B06 | File upload | Planned, unimplemented | Record actual file limits/storage/cleanup; disclose absence of malware scanning if applicable. |

No theme background-image upload, arbitrary font upload, complex logic expression engine, payment processing, or real integration is planned. File uploads are last because public upload validation, durable storage, authorization, and cleanup must work together.

## Change protocol

For every material update: add date, category (assumption / mocked data / placeholder / limitation / bonus / deployment), affected requirement IDs, decision and rationale, actual implementation state, evidence link or test reference, and whether it belongs in final submission notes. Distinguish “proposed” from “observed.” Resolve or revise obsolete limitations rather than accumulating contradictory entries.

## README strategy

The README will be created and expanded during application development; Phase 0 does not provide fictional setup commands or nonexistent links. Final content:

1. Purpose, deployed URL, repository URL, and concise truthful feature checklist.
2. Demo access model, cookie/access limitations, synthetic data, and sample counts.
3. Prerequisites and exact tested fresh-clone setup commands.
4. Docker Compose and native development paths, including Windows and OneDrive notes.
5. Environment-variable table with safe example files and required/optional defaults.
6. Architecture diagram, frontend feature boundaries, and Python service responsibilities.
7. ER diagram, constraints/indexes, migration/seeding commands, publication history.
8. API overview, error conventions, revision/idempotency behavior, OpenAPI link.
9. Actual test/build commands, suite scope, evidence, and explicit untested cases.
10. Deployment, SQLite disk path, runtime migrations, backup/restore and restart/redeploy verification.
11. Intentional deviations, actual limitations, implemented bonuses, link to this ledger.
12. Reference/dependency attribution and concise tradeoffs the candidate can explain.

Include a five-minute evaluator walkthrough: create form → edit/reorder → preview → publish/copy link → anonymous submission in another context → historical detail and summary. Fresh-clone setup must be tried, not inferred from developer-machine success.

## Separate submission field strategy

The submission form field is named **Assumptions / Mocked Data / Notes**. Prepare it only after release verification, aiming for roughly 80–120 words subject to the actual form limit. Every sentence must reconcile with the deployed app, README, this ledger, and requirement evidence.

Template only; **not a completed submission answer**:

> Creator access uses [actual demo access model]; public forms require no login. [Actual synthetic forms/responses and how they are labeled]. Implemented optional features: [verified list, or omit if none]. [Meaningful placeholders and simplifications]. SQLite uses [verified host and durable storage arrangement]. Known limitations: [actual limitations, including relevant access, visual, or deployment constraints].

Do not fill brackets with planned behavior. Do not claim tests, restart/redeployment persistence, uploads, partial-response tracking, or any optional feature without the corresponding evidence. A limitation must be clear and proportionate, not hidden behind a broad “demo only” disclaimer.

## Phase 0 change log

- 2026-10-09: Created initial ledger from the approved plan; separated confirmed preferences, planned contracts, research limitations, and actual repository state. DOCS-PLAN passed all 18 automated document checks plus manual source/decision reconciliation; see the Phase 0 verification record in IMPLEMENTATION_PLAN.md. No application feature or bonus was promoted to Verified. Next phase is foundation and deployment proof, after review.

## Phase 1 change log

- 2026-10-09: Created the foundation and initial README/deployment handoff. Only diagnostic records exist; no mocked successful form workflows or seed responses were added.
- User directed creation of a private repository and retained Vercel deployment responsibility. Working repository: [sakshamverma21/scaler-typeform-clone](https://github.com/sakshamverma21/scaler-typeform-clone). Public visibility and live HTTPS checks remain pending.
- Actual local evidence: 18 API/database tests, five component/client tests, nine real-browser checks, production frontend build, both Docker image builds, native process-restart persistence, and retained diagnostic data across Docker restart/container recreation. GitHub Actions also passed all backend/frontend/browser jobs on Ubuntu for application commit `9744fcb`; the linked run and detailed evidence are in IMPLEMENTATION_PLAN.md. This is not live deployment proof.
