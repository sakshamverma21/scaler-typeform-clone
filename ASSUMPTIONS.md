# Assumptions, limitations, and submission notes ledger

Read alongside [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md), and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

This ledger separates approved choices from implemented facts. **Planned** does not mean working. Update entries when implementation, evidence, or scope changes; do not leave removed bonuses marked complete. Record meaningful deviations before documenting them as accepted behavior.

## Observed repository state

- 2026-10-09, beginning of Phase 0: workspace was empty; all six requested planning files were absent; no Git repository or application existed.
- The full assignment was extracted and audited (97 paragraphs, one evaluation table). Its source path, fingerprint, and coverage ledger are in REQUIREMENTS.md.
- Phase 0 completed on 2026-10-09: all six approved planning documents passed the source/consistency audit. That phase contained no application implementation or runtime testing.
- Phase 1 on 2026-10-09: frontend/backend foundation, lockfiles, health/migrations, cookie probe, tests, Docker/CI/deployment configuration, and README were implemented. At that historical point domain forms, real creator workspaces and submissions were unimplemented. Phase 2 implementation/evidence is recorded below; bonuses remain unimplemented.
- The user has approved implementation, one phase at a time, stopping after each phase for review. The earlier plan-approval restriction is satisfied; the per-phase stop remains active.

## Decision and limitation ledger

| ID | Category / decision | Rationale and affected requirements | Status | Submission relevance |
|---|---|---|---|---|
| A01 | FastAPI selected from permitted Python frameworks | Focused typed API and custom frontend; M34. | Implemented and API-verified | FastAPI 0.143.0 currently locked. |
| A02 | Isolated browser-specific anonymous creator workspace | Confirmed user preference; P05, M10, M23. | Implemented; isolation/cookie tests passed | Explain demo access clearly. |
| A03 | Opaque creator cookie expires after 30 days | Simple persistence without full accounts; P05. Clearing/expiry loses UI access; no recovery/cross-device creator access. | Implemented; expiry/Secure-cookie tests passed | Disclose actual lifetime/access limits. |
| A04 | Public forms need no creator login | Explicit source requirement; M23. | Public API verified; runner UI pending | Verify with unrelated browser. |
| A05 | Multiple choice is single-selection initially | Assignment does not mandate multiselect/Other/randomization; M06. | Server contract verified; UI pending | Mention only if material to evaluator. |
| A06 | Number is nonnegative whole number, maximum 15 digits | Typeform direction; zero explicitly accepted; M06–M07, M21. | Server contract/boundaries verified; UI pending | Document input contract. |
| A07 | Rating defaults to five stars; maximum configurable 1–10 | Practical type settings; M06. | Server contract verified; settings UI pending | Document settings. |
| A08 | Short/long text maxima 999/10,000 characters | Bounded validation; M06, M21. | Server boundaries/newlines verified; UI pending | API/setup documentation. |
| A09 | Draft autosave and publication are separate | Prevent incomplete edits changing public forms; M03, M14–M16. | Draft/public isolation API-verified; Phase 4 serialized autosave/retry/conflict/recovery checks passed | Explain publish behavior. |
| A10 | Immutable published versions and version-specific summaries | Preserve historical question/answer meaning; M05, M25–M27. | Version/history/statistics API verified; UI pending | Explain schema and summary denominators. |
| A11 | Duplicate copies current draft only | Independent content/settings, no responses or published status; M12. | Copy independence API verified; Phase 3 duplicate/status/count UI smoke passed | README behavior overview. |
| A12 | Synthetic sample forms and responses per fresh workspace | Immediate evaluation; M32. No real personal data. | Implemented once per workspace; 12 + 8 synthetic responses and one draft; dashboard labels/counts/reload and no resurrection verified | Must identify sample data and whether counts include it. |
| A13 | Theme/ending customization starts as an explicit placeholder | Allowed baseline; M31. Actual default thank-you is mandatory. | Discoverable Phase 4 placeholders; preview ending functions, public ending pending | Disclose unless replaced with real verified customization. |
| A14 | Advanced logic, integrations, teams, payment/file-upload begin as placeholders | P01–P04; actual public sharing remains functional. | Planned placeholders | List meaningful remaining placeholders at release. |
| A15 | Partial measured typography; exact motion unverified | R09 initial canvas prompt measured Inter 26px/34px and rgb(42,34,43); not every product text style. M28. | Improved reference evidence; motion/full typography still limited | Do not claim pixel-perfect fidelity. |
| A16 | Original paid disk proposal superseded by Render Free | Latest user choice on 2026-10-09; M16, M27, M38. No purchase or durable service is required for the chosen demo handoff. | Superseded by A32 | Do not describe paid storage as provisioned. |
| A17 | Vercel frontend / Render Free backend + external ping | Latest user direction replaces SQLite disk hosting; cookie rewrite still needs live proof. | User supplied deployed URLs; HTTPS health/rewrite 200/no-store; cookie/ping/domain deployment pending | Record actual URLs and ephemeral storage limitation. |
| A18 | One backend instance/worker; possible brief deployment downtime | SQLite disk model and scope; M38. | Planned deployment limitation | Evaluator-relevant availability/scaling limit. |
| A19 | Local Docker named volume; native DB path configurable outside synced folder | Checkout is inside OneDrive; avoid cloud-sync database interference. | Verified native restart and Docker restart/recreation persistence for diagnostic data | Domain/redeployment proof still required later. |
| A20 | Earlier published versions accepted only within same open epoch | Keep in-flight answers stable; unpublish closes old sessions even after reopening; M15, M22. | Same-period/closure/reopening/retry behavior API-verified | Explain interview edge case. |
| A21 | Optional answers stored as absent rows; false/zero are answers | Correct validation and denominators; M07, M26. | Verified with skips, zero/false and exact aggregates | API/schema documentation. |
| A22 | No email deliverability checking | Syntax validation satisfies baseline; M06, M21. | Implemented practical syntax validator; see A37 | Avoid suggesting address verification. |
| A23 | No full account/team/integration/payment product | Explicit scope permissions; P01–P05. | Approved scope | Do not present disabled controls as complete. |
| A24 | Actual submission deadline not yet recorded | User reported more than 36 hours available; source ~24-hour effort estimate is not a deadline. | External information pending | Scheduling only; no fabricated due date. |
| A25 | All six bonuses start only after mandatory release gate | Protect functionality/fidelity/reliability. | Approved sequencing | Report only individually verified bonuses. |
| A26 | Physical-phone software keyboard not yet tested | Viewport emulation is incomplete mobile evidence; U03. | Pending release check | Remains limitation until actual check. |
| A27 | Working repository private; Vercel deployment handed to user | Explicit latest user instruction; M36, M38. Public repository is still required for final submission. | Private repo; Phase 2/3 pushed in f74e30f; user reported hosting, new rollout not yet verified | Do not claim public repo/deployment; change visibility only with user authorization. |
| A28 | Temporary foundation probe and unavailable/empty route shell | Phase 1 diagnostic validates storage/cookies, not creator auth or real forms. Probe flag defaults false; example configurations enable it. | Implemented and tested locally | Disable probe/UI before release; remove or migrate diagnostics later. |
| A29 | Node 24.15+ / Python 3.11 runtime; TypeScript 5.9.3 | Modern patched test tools require newer Node; OpenAPI generator supports TypeScript 5.x. | Locked and tested locally, same targets in Docker/CI | Exact setup requirements. |
| A30 | Test ports 13000/18080, SQLite outside test-output cleanup | Existing unrelated Docker service uses 8000. Isolate tests and prevent cleanup from affecting live test DB. | Implemented; ten browser checks passed in Phase 2 | Test instructions; no unrelated service stopped. |
| A31 | Development dependency advisories / upstream warnings | npm audit reports five high entries through Next's lint-only fast-glob/micromatch/braces chain; no patched braces release was available. Compatible Next lint plugins require ESLint 9. HTTPX TestClient has an upstream deprecation warning. | Recorded tooling limitation; production npm audit reports zero vulnerabilities | Recheck/update tools when compatible upstream fixes exist; do not use forced framework downgrades or suppress results. |
| A32 | Render Free ephemeral SQLite accepted for short evaluation | User expects evaluation within 20–30 minutes and chose a minutely ping. Timeframe is unverified; ping reduces idle sleeping but does not preserve data after instance replacement. M16, M27, M38 retain a hosting gap. | Confirmed choice; configured ephemeral path; live health works, retention/ping still unverified | Disclose loss on instance replacement; never claim cron ensures persistence. |
| A33 | Revised Phase 1 deployment gate | User waived cloud restart/redeploy proof for this demo. HTTPS cookie/origin/no-store, reload/isolation, and actual scheduled-ping checks still required. | Gate revised; live checks pending | Local persistence evidence is separate; original deployed OPS-PERSIST is not passed. |
| A34 | Signed-in reference access recovered in in-app browser | Initial Chrome/native runtime failure; later in-app access succeeded. M28. | 38 actual captures/observations archived; Chrome itself not reverified | Populated results, full keyboard/motion and physical phone uninspected. |
| A35 | Synthetic research form in original Typeform account | UI inspection only; all authored content synthetic. Share immediately published; user explicitly approved closure. | Published but closed; public closure verified; Results showed no responses after preview | Not clone seed data or a clone feature; screenshots for reference only. |

## Phase 2 decisions - 2026-10-09

| ID | Category / decision | Rationale and affected requirements | Actual status / evidence | Submission relevance |
|---|---|---|---|---|
| A36 | Bounded demo definitions and pages | Title 200, prompt/help 2,000, choice label 500 characters; 100 questions/options/answers; page 1-100/default 30. M01-M08, M21, M24. | Structural validation implemented; malformed/type tests passed; unfinished drafts allowed. | Practical limits are project choices, not assignment wording. |
| A37 | Practical email/text normalization | Trim outer text; preserve internal newlines. ASCII unquoted email local part and IDNA domain, 254/64 limits, at least two domain labels. M06, M21. | Boundary and syntax tests passed. No deliverability or exhaustive RFC mailbox support. | Syntax-only email validation. |
| A38 | SQLite serializes mutations before state reads | BEGIN IMMEDIATE protects revision, retry and close decisions; read BEGIN provides consistent snapshots. M03, M15, M22, M26. | Competing saves/submissions, unpublish race and rollback/commit failures passed; contention can return 503 after five seconds. | Reliability/throughput tradeoff; one demo backend instance. |
| A39 | Last-save replay plus explicit revision preconditions | Missing If-Match 428; malformed 422; stale 412. Same last mutation/payload succeeds; different payload 409. M03, M16. | API/wrapper and Phase 4 autosave queue/retry/stale-tab behavior verified with focused checks. | Explain two-tab/lost-ack recovery without claiming UI autosave. |
| A40 | Anonymous bootstrap identity boundary | Cookie identifies workspace; no-cookie requests cannot be correlated. P05, M32. | Atomic seeds and existing-cookie concurrent resume passed. Phase 3 implements a shared in-flight bootstrap promise and no automatic first-visit retry; focused isolation/expiry browser checks passed. | Cookie loss starts a new workspace; no account recovery. |
| A41 | Presentation settings are schema groundwork | Bounded theme/ending JSON persists in draft/public snapshots. M31/B02. | Stored by definition services; no customization UI or completed bonus. | Do not advertise customization or dark mode. |
| A42 | Reported cloud deployments; Phase 1 checks deferred | User authorized Phase 2 while doing cron later. M38. | Both supplied HTTPS readiness URLs returned 200/no-store. Phase 2 local/unpushed; secure browser cookie, ping/continuity pending. | Actual revision/evidence only; no deployed durability claim. |

## Synthetic data specification

Implemented in Phase 2 and displayed/labeled in the Phase 3 dashboard, locally tested; current deployed revision still needs separate verification:

- **Product feedback:** short text, email, multiple choice, yes/no, rating, long text; 12 synthetic completed submissions.
- **Event registration:** short text, email, dropdown, number, multiple choice, long text; 8 synthetic completed submissions.
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

> Creator access uses [actual demo access model]; public forms require no login. [Actual synthetic forms/responses and how they are labeled]. Implemented optional features: [verified list, or omit if none]. [Meaningful placeholders and simplifications]. SQLite uses [actual host and storage arrangement; disclose ephemeral Render Free if retained]. Known limitations: [actual limitations, including relevant access, visual, or deployment constraints].

Do not fill brackets with planned behavior. Do not claim tests, restart/redeployment persistence, uploads, partial-response tracking, or any optional feature without the corresponding evidence. A limitation must be clear and proportionate, not hidden behind a broad “demo only” disclaimer.

## Phase 0 change log

- 2026-10-09: Created initial ledger from the approved plan; separated confirmed preferences, planned contracts, research limitations, and actual repository state. DOCS-PLAN passed all 18 automated document checks plus manual source/decision reconciliation; see the Phase 0 verification record in IMPLEMENTATION_PLAN.md. No application feature or bonus was promoted to Verified. Next phase is foundation and deployment proof, after review.

## Phase 1 change log

- 2026-10-09: Created the foundation and initial README/deployment handoff. Only diagnostic records exist; no mocked successful form workflows or seed responses were added.
- User directed creation of a private repository and retained Vercel deployment responsibility. Working repository: [sakshamverma21/scaler-typeform-clone](https://github.com/sakshamverma21/scaler-typeform-clone). Public visibility and live HTTPS checks remain pending.
- Actual local evidence: 18 API/database tests, five component/client tests, nine real-browser checks, production frontend build, both Docker image builds, native process-restart persistence, and retained diagnostic data across Docker restart/container recreation. GitHub Actions also passed all backend/frontend/browser jobs on Ubuntu for application commit `9744fcb`; the linked run and detailed evidence are in IMPLEMENTATION_PLAN.md. This is not live deployment proof.
- 2026-10-09 hosting revision: selected Render Free plus an external minutely health ping. Removed the paid disk from the Blueprint and changed its database path to `/app/data/typeform.sqlite3`; local Compose keeps its durable volume. Cloud restart/redeploy survival is waived for the demo gate, not recorded as passed. Live URLs, cookie path, scheduler, and continuity remain unverified.
- 2026-10-09 design evidence: signed-in Chrome inspection was explicitly authorized. Both browser and native computer-use initialization failed with `failed to write kernel assets: The system cannot find the path specified. (os error 3)`, including a reset/retry. No screenshot was obtained; pending capture states are indexed from DESIGN_REFERENCE.md. Seeding remains unimplemented, with the existing once-per-workspace contract unchanged.
- 2026-10-09 subsequent recovery: signed-in in-app browser worked; 38 actual screenshots and measured/observed details archived. A15/A34 updated and A35 added. Initial failure above is historical, not current capture status. Synthetic research form remains published but closed after explicit user-approved closure; public page confirmed closed, Results had no responses after preview. No clone code/seeds implemented during this research; full results/motion/phone reference gaps retained.

## Phase 2 change log

- 2026-10-09: Implemented and locally verified domain schema/migration, creator sessions and once-only synthetic seeds, complete creator/public APIs, historical responses and summary queries, typed frontend wrappers/errors and generated contracts. API/database: 81 passed; frontend unit: 8 passed; Chromium: 10 passed; lint/format/types/build and actual Uvicorn process restart passed. See IMPLEMENTATION_PLAN.md for procedures/limitations. M34/M35 Verified; UI requirements retain partial status. No bonus or Phase 3 UI implemented. Changes remain local for review; no cloud deployment of this revision claimed.

## Phase 3 decisions and change log — 2026-10-09

| ID | Category / actual decision | Evidence and submission relevance |
|---|---|---|
| A43 | Demo cold-start tolerance / scope | Creator bootstrap waits up to 90 seconds with a visible waking/loading state and manual retry. Other API requests retain 15-second timeout. Failed bootstrap does not fabricate data. Browser failure/retry smoke passed; actual Render wake duration unmeasured. |
| A44 | Suggested search/sort simplification | Search/sort act on loaded pages; Load more retrieves another 30. The UI explains loaded-page search when more pages exist. No global server search claim. Many-page UI coverage deferred. |
| A45 | Temporary builder placeholder superseded | Replaced in Phase 4 by real question editing/autosave/preview; obsolete read-only module removed. Public/share/results UI still pending. |
| A46 | User-directed reduced interim QA | Phase 3 production build/types, targeted lint and 2 Chromium smoke tests passed. Desktop/mobile captures reviewed. Full regression, browser/accessibility/phone matrix deferred to Phase 7 due time constraint; do not claim those passed. |

Phase 3 integrates real workspace operations, menus/dialogs/toasts, pending/failure/empty states, sample counts and expiry recovery. No bonus, fake successful action, question editor or public/results UI was introduced. Local screenshots are test artifacts, not product assets. Phase 2's local test record remains separate historical evidence. Phase 2/3 source pushed to private repository main in f74e30f; verify actual cloud rollout separately.

## Phase 4 assumptions and actual scope — 2026-10-09

| ID | Decision / limitation | Actual behavior and submission relevance |
|---|---|---|
| A47 | Temporary recovery is per browser tab/workspace/form | Session storage retains unsaved definition and pending mutation. Restore/discard is explicit; editing is blocked until chosen. Save/reload recovery passed. Storage denial still permits server editing but disables recovery; tab closure/SPA unmount cannot guarantee completed network writes. |
| A48 | Explicit conflict resolution | Keep local draft on 412; accepted own mutation can reconcile, otherwise only explicit discard/reload. No silent merge/overwrite. Stale-tab browser and queue tests passed. Expired creator cookies have no account recovery; no cross-workspace restoration claim. |
| A49 | Question/type editing scope | Fixed text/number bounds, single choice, rating 1–10. Type changes preserve prompt/help/required, clear incompatible settings, preserve choice keys only between dropdown/multiple choice. Caps 100 questions/options. Full type-switch/limit matrix deferred; repeated/shared keys validated by server. |
| A50 | Preview and visual limitations | Shared controls/validator and local completion; 8-type zero-write flow passed. Representative mobile frame uses container queries. CSS transitions 250ms are chosen, not measured; original timing/physical-phone/software-keyboard/full visual parity remains unverified. No public UI yet. |
| A51 | Honest placeholders | Design/ending customization, Workflow/Connect, future Share/Results dialogs describe their current scope. Default preview ending works; current saved theme/ending persists. Payment/upload picker entries disabled. No bonus is advertised. |
| A52 | Focused Phase 4 QA | 3 autosave unit checks, 2 actual Chromium workflows, strict build/lint/format and desktop/mobile builder screenshots checked. Full regression/parity/cross-browser/phone/fault matrix deferred by user time constraint, not passed. |

No schema/business-rule change or new seed dataset was necessary. Original modules authored locally; no clone code/assets reused. dnd-kit 0.5.0 pinned; package installation initially warned because npm used system Node 22, while all acceptance commands explicitly used bundled Node 24.19.0. Existing five development-only advisories remain recorded in A31; no forced downgrade performed. Source shipment is recorded separately from actual cloud rollout.

## Dashboard visual correction — 2026-10-09

| ID | Actual decision / limitation | Evidence / submission relevance |
|---|---|---|
| A53 | Match the user-supplied workspace screenshot without inventing commercial functionality | Full-width tabs/banner and broad sidebar replace the initial shell. Account remains a browser-private demo. Banner describes the demo; sidebar counts loaded responses, including labeled synthetic seeds. No paid response quota is enforced or advertised. Completion-rate column displays an em dash because attempts are not tracked. Out-of-scope sections explicitly explain that they are placeholders; no bonus is claimed. |
| A54 | Focused verification for urgent dashboard correction | Strict production build/types, ESLint and the existing two real Chromium dashboard workflows passed; desktop/mobile captures inspected and mobile overflow checked. Full regression, physical phone and exhaustive visual/accessibility testing remain deferred. No backend/database behavior changed. Source push does not itself verify cloud rollout. |

## Expedited remaining essentials — 2026-10-09

A55: User explicitly authorized combining the remaining essential phases with minimal verification under a ten-minute deadline. Public/shared controls, publish/unpublish/link UI and results/detail/summary are implemented. One real Chromium submission workflow, strict build/types and targeted lint passed. Full release QA, all-eight public UI matrix, mobile physical keyboard, cross-browser/motion and live rollout are deferred, not verified.

A56: Submission keys remain stable per exact normalized answer payload within the open page; retries reuse them and rely on server idempotency. Refresh does not restore public answers/keys; browser-resumable partial responses are not implemented. Public opening may wait 90 seconds for cold starts. Results use response timestamp links and a scrollable dialog rather than the original side drawer. Summary selects latest publication by default; Responses defaults to all versions. No completion-rate or invented analytics.

A57: Share and Results builder placeholders are superseded by working routes. Workflow/Connect/theme/ending customization and dashboard out-of-scope tabs remain labeled placeholders. Existing default ending works after actual submission acknowledgement. Render ephemeral storage and private repository remain owner/submission considerations.
