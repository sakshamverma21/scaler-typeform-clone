# Implementation roadmap and verification gates

The user has approved the design and authorized implementation **one phase at a time**. Complete the current phase, verify it, update evidence and assumptions, then stop for review. Do not automatically start the next phase. The old planning-approval gate is satisfied; this per-phase boundary remains active.

Read [AGENTS.md](AGENTS.md), [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN_REFERENCE.md](DESIGN_REFERENCE.md), and [ASSUMPTIONS.md](ASSUMPTIONS.md) before changes. Source requirements take priority over suggested improvements. No bonus starts before the mandatory release gate passes.

## Progress

| Phase | Scope | Status | Gate / evidence |
|---|---|---|---|
| 0 | Persist and freeze approved plan | Verified | DOCS-PLAN passed on 2026-10-09; see Phase 0 verification record. |
| 1 | Foundation and deployment proof | In progress — local verified; revised live gate pending | User selected Render Free + minutely ping on 2026-10-09; HTTPS cookie/reload/ping checks pending. See Phase 1 verification record. |
| 2 | Schema, core services, sessions, seeds | Not started | Requires Phase 1. |
| 3 | Workspace management | Not started | Requires Phase 2. |
| 4 | Complete builder and preview | Not started | Requires Phase 3. |
| 5 | Respondent and sharing | Not started | Requires Phase 4. |
| 6 | Responses and summaries | Not started | Requires Phase 5. |
| 7 | Release hardening and submission preparation | Not started | Requires Phase 6; mandatory release gate. |

Last fully completed phase: **0**. Current phase: **1 — Foundation and deployment proof**. Local implementation is verified and ready for review; the user has retained Vercel deployment responsibility, so the live gate remains pending. Phase 2 has not started. No application implementation was included in Phase 0.

**Approved hosting revision, 2026-10-09:** Use Vercel + Render Free + an external minutely health ping. The user accepts ephemeral SQLite for an expected short evaluation and waived cloud restart/redeploy survival checks for this demo handoff. The gate now requires live HTTPS cookie/origin/no-store checks, same-instance reload continuity/isolation, and actual scheduled calls. Keep local durable-volume evidence and the original M16/M27/M38 persistence criteria separate: deployed durability remains a documented gap, not a passed check. See [DEPLOYMENT.md](DEPLOYMENT.md) and A32–A34 in ASSUMPTIONS.md.

Indicative allowance from the approved plan: **35–43 implementation hours plus 6–8 hours contingency/refinement**, before the full bonus backlog. This is an estimate, not a promise or deadline. The assignment's approximately 24-hour guidance is separate; the actual externally communicated deadline is unknown.

## Phase 0 — Persist and freeze the plan

**Dependencies:** Approved plan and original assignment. Workspace inspection found all six documents absent.

**Deliverables:** AGENTS.md, REQUIREMENTS.md, ARCHITECTURE.md, IMPLEMENTATION_PLAN.md, DESIGN_REFERENCE.md, ASSUMPTIONS.md. Preserve requirement IDs, design evidence boundaries, schema/API contracts, bonus ordering, test procedures, and documentation strategy. Re-read all assignment paragraphs and the evaluation table, not just a summary.

**Acceptance:** Every source paragraph maps to requirements, permission, bonus, evaluation, or contextual note. All 41 mandatory requirements, eight types, five permissions, six bonuses, seven criteria, and four user requirement groups appear. Relative document links and test references resolve; planned features are not marked verified. The latest per-phase authorization is reflected consistently.

**Verification:** DOCS-PLAN: source hash/count/coverage audit, document structure and cross-reference checks, manual decision reconciliation, status audit, and workspace inventory. No application builds/tests are applicable to this documentation-only phase.

**Risks:** Accidentally implementing Phase 1; reducing full plan to vague stubs; promoting suggested defaults to assignment mandates; stale approval restrictions; treating research approximations as measured product values. Mitigate with explicit status/classification and final self-review.

**Stop:** After document audit, record Phase 0 Verified and U01 Verified, leaving all application requirements Planned. Stop for review.

## Phase 1 — Foundation and deployment proof

**Dependencies:** Phase 0 complete and subsequent user instruction to work on the next phase.

**Modules / changes:** Initialize Git and the required frontend/backend structure; Next.js App Router/strict TypeScript, FastAPI config/main/health routes, database session configuration, Alembic setup, environment examples, formatting/lint/test scripts, CI, Dockerfiles/Compose named volume, Render configuration, Next.js API rewrite, and initial README setup. Create shared typography/tokens and styled accessible primitive foundations. Resolve compatible package versions and commit lockfiles.

**Decisions:** Keep business logic in Python. Prove the browser→Next rewrite→FastAPI cookie path with a minimal foundation-level session/probe, then use it in Phase 2. Use a minimal persisted diagnostic record/migration for durability proof; do not prematurely build all domain services. No arbitrary generic infrastructure.

**Acceptance / tests:**

- BUILD: clean dependency installation, lint/type checks, production frontend build, backend import/config/health checks.
- Real browser reaches health through `/api/v1`; allowed-origin configuration and cookie round-trip work on localhost and HTTPS deployment.
- Database readiness is false until runtime migration succeeds; health does not disclose secrets.
- Local OPS-PERSIST foundation probe: record survives process/volume restart; already verified. Revised live demo check: record survives reload and more than 15 minutes with successful minutely pings on the same instance. Cloud restart/redeploy survival is waived, not verified.
- A styled shell at desktop/mobile widths demonstrates the visual foundation; loading and failure states are not blank screens.
- CI runs meaningful available checks; README reproduces local startup from documented environment variables.

**Risks / edges:** Missing hosting URL/account access, Free instance data replacement, cookies set for the backend domain instead of frontend, accidental caching, rewrite mismatches, OneDrive database interference, migrations at build time, and cron failures during wake-up. Verify the deployment steps and scheduled requests. Do not introduce paid resources or claim cron provides durability.

**Gate:** A local build is not deployment proof. If HTTPS cookie/reload/origin checks or actual cron history are missing, leave the revised demo gate pending with exact missing evidence. Do not claim deployed durability. The user retains Vercel responsibility and requested a private working repository. Stop for review/handoff; do not proceed to Phase 2 automatically.

## Phase 2 — Data model and core services

**Dependencies:** Phase 1 proxy/local persistence foundation and revised live demo gate, or explicit user authorization to defer missing live checks. No cloud durability assumption may be introduced by Phase 2.

**Modules / changes:** `backend/app/db/models`, migration revisions, Pydantic contracts, API routers/session dependencies, form/publishing/submission/results services, `seed.py`, file-backed pytest fixtures, generated frontend API types/fetch wrapper. Implement all eight baseline tables and their constraints/indexes. Add browser-specific session bootstrap and transactional seed initialization.

**Scope:** API vertical slice can initialize workspace → create/save/rename/duplicate/delete → publish/unpublish → submit → list/detail/summary. UI remains foundation-level; later phases supply full interactions. API completeness avoids disconnected frontend mock behavior.

**Acceptance / tests:** API-CRUD, API-DEFINITION, API-PUBLISH, API-HISTORY, API-VALIDATION, API-SUBMISSION, API-RESULTS, API-STATS, API-SEED, API-ISOLATION. Include real migration application and FK checks, same/different-payload retries, concurrent duplicate requests, stale revisions, malformed definitions, copy independence, deletion cascades, invalid cross-version options, historical answers after draft edits, and unpublish races.

**Seed contract:**

- Product feedback: short text, email, multiple choice, yes/no, rating, long text; approximately 12 synthetic submissions.
- Event registration: short text, email, dropdown, number, multiple choice, long text; approximately 8 synthetic submissions.
- One small unpublished draft; all eight mandatory types covered by the two published forms.
- Original neutral copy, example.com addresses, clear sample labels, deterministic values and independent workspace IDs. Seed via normal validators/services once; concurrent initialization must not duplicate samples. Restart and deletion never resurrect samples.

**Risks / edges:** SQLite composite FK parent uniqueness, integer/bool coercion, zero/false interpreted as missing, reordering uniqueness conflicts, partial writes, non-idempotent seeds, same content after reopen retaining invalid epoch, mutation acknowledgement lost. Keep transactions short and test the actual file-backed DB.

**Gate:** Core service behavior and isolation are verified at API/database level. Do not mark UI-dependent requirements wholly Verified yet.

## Phase 3 — Workspace management

**Dependencies:** Phase 2 creator/form APIs and seed data.

**Modules / changes:** `frontend/src/features/dashboard`, creator layout/session bootstrap, forms query/mutations, list/grid views, Create/Rename/Delete dialogs, contextual menus, notifications. Introduce search/sort only if the mandatory flow remains complete and consistent.

**Acceptance / tests:** E2E-FIRST-VISIT, E2E-CREATOR, E2E-STATES, COMPONENT-DIALOG, relevant API-CRUD/RESULTS. Verify fresh and returning browsers, session expiry behavior, actual ownership isolation, title persistence, duplicate independence/no responses, cancel/confirm deletion, status/count accuracy, reload, and operation failure feedback. Review desktop/mobile workspace and dialogs against R01/R02. Keyboard focus must return sensibly after menus/dialogs.

**States:** Synthetic first visit, no forms after deletion, long names, loading skeleton, retryable network failure, pending mutations, clipboard failure when sharing controls arrive. Do not report actions successful before server acknowledgement.

**Risks / edges:** Stale cached counts, double clicks creating duplicates, click-through menus, deleting the selected item while detail is open, orphaned queries after deletion. Invalidate relevant queries and preserve useful recovery paths.

**Gate:** Every management action works through the real UI and persists. Builder destinations can be minimal until Phase 4, but must not falsely present unfinished editing as functional.

## Phase 4 — Builder and live preview

**Dependencies:** Phase 3 creator shell plus complete draft API.

**Modules / changes:** Builder reducer/actions, serialized save queue and recovery, question registry, type picker, sortable navigation, inline canvas editors, settings pane, shared answer controls, desktop/mobile preview route, endings/settings placeholders, small-screen drawers.

**Acceptance / tests:**

- Add/edit/delete/reorder all eight types with stable keys; edit description/required/options/rating max; save/reload preserves definition.
- Drag first/middle/last, cancel, and keyboard reorder; selection and numbering follow saved order. Deleting selected/last question leaves usable UI.
- Incomplete drafts can save; publication validation remains strict. Type changes remove incompatible settings/options safely and have explicit UI behavior.
- COMPONENT-BUILDER proves queued edits, stale acknowledgements, retry/recovery, conflict handling, and deliberate-navigation flushing. Inject failed/lost save acknowledgements and two-tab revision conflicts.
- COMPONENT-PREVIEW / E2E-PREVIEW prove immediate draft reflection, desktop/mobile rendering, same validation, and **zero responses** created by completing preview.
- E2E-TYPES, E2E-REORDER, E2E-CREATOR, E2E-PLACEHOLDERS; VISUAL against builder/picker/reference states.

**Risks / edges:** Cursor jumps on render/save, drag activation inside inputs, deleting a dragged item, invalid drafts blocking autosave, route change losing edits, browser tab closure not finishing an async save. Recovery storage is temporary and never a substitute for verified persistence.

**Gate:** Complete usable builder, all type settings/preview, truthful save state, no silent overwrite across tabs. This phase does not claim the public runner/submission UI until Phase 5.

## Phase 5 — Respondent and sharing

**Dependencies:** Phase 4 shared controls/drafts and Phase 2 publication/submission API.

**Modules / changes:** Public runner reducer, question navigation/validation, directional motion, focus management, answered progress, public route, unavailable state, share page, publish/unpublish controls, stable URL, copy/open feedback, receipt/thank-you and retry UI.

**Acceptance / tests:** E2E-PUBLISH, E2E-PUBLIC, E2E-RESPONDENT, E2E-KEYBOARD, E2E-VALIDATION, COMPONENT-RUNNER, API-SUBMISSION/PUBLISH/HISTORY; VISUAL-MOTION and respondent visual review.

- Unrelated browser completes a real published form and sees success only after commit; all eight controls round-trip to storage.
- Draft changes remain private until publication. Rename/republish retain URL. Same-period older versions submit with original semantics.
- Unpublish rejects new submissions from fresh and already-open forms. Reopen does not validate old epochs; an already committed retry can still obtain its receipt.
- Enter, Shift+Enter, arrows, Tab, letters, Escape, IME, reduced motion, repeated keys, back navigation, optional skipping, and explicit final submit behave as documented.
- Failed validation/submission retains answers; retry creates one response; wrong direct API payloads fail server validation.
- Mobile long-content scrolling, safe areas, action placement, progress, loading/unavailable/server-error states remain usable.

**Risks / edges:** Auto-submitting final choice, repeated transitions, keyboard events stolen from text/dropdown, duplicate responses after timeout, success UI before commit, unpublish races, mobile keyboard obscuring action/error. Physical-phone testing should start here and be repeated before release.

**Gate:** Creator→publish→anonymous submission works end to end with real persistence and failure handling, and preview still creates nothing.

## Phase 6 — Responses and summaries

**Dependencies:** Phase 5 real submissions and historical definition model.

**Modules / changes:** Results route/tabs, version filter/URL state, paginated response table, detail panel/sheet, aggregate API integration, accessible CSS charts, seed labels, loading/empty/error states.

**Acceptance / tests:** API-RESULTS/STATS/HISTORY and E2E-RESULTS. Reconcile fixtures and fresh submissions exactly; correct option zero counts, answered/skipped denominators, number/rating min/max/mean, text access, optional blanks, zero/false, mixed versions, empty forms, pagination boundaries. Detail uses original labels after edit/delete. Default latest-version summary displays version/sample size. Review R06/R07 at desktop/mobile sizes.

**Risks / edges:** Combining incompatible versions, losing deleted options, fabricated zero means or NaN, inaccurate total counts, unstable timestamp ordering, huge text cells breaking layout. All-response table uses version/preview until version-specific columns are selected.

**Gate:** Every submission is discoverable, details complete, displayed totals reconcile, and history stays meaningful.

## Phase 7 — Release hardening and documentation

**Dependencies:** Phase 6; all baseline workflows implemented.

**Modules / changes:** Complete browser suites and CI, deterministic visual baselines, accessibility review, deployment fixes, backup/restore procedure, README/ER diagram/API docs, public repository readiness, evaluator walkthrough, final notes draft derived from facts.

**Acceptance / tests:** Run the full verification catalog applicable to mandatory requirements. Critical workflows in Chromium; respondent smoke in Firefox and WebKit. Widths 360/390/768/1280/1440 and 200% zoom; physical-phone software keyboard; reduced motion and keyboard-only operation. Local restart/container recreation and backup restore with recorded form/response IDs. For selected Render Free hosting, verify live workflows and same-instance continuity; retain cloud restart/redeploy durability as an accepted, disclosed gap rather than a passing test. Fresh-clone setup. Signed-out repository access, HTTPS app/public URLs, no committed secrets/live data. Manual comparison of all five principal surfaces.

**Mandatory release gate:** Zero unresolved mandatory workflow failures, zero unexplained data discrepancies, no obvious layout/focus defects. Each mandatory requirement's entire acceptance criterion is verified or a real gap remains; “build passes” is not completion. Under the user-selected ephemeral hosting, report verified functional scope with an accepted deployed-durability deviation; do not mark M16/M27/M38 wholly Verified or state all original mandatory criteria passed. The accepted hosting deviation does not require a purchase or block the user-directed demo handoff. M41 requires the user's actual code walkthrough, not an agent assertion that the candidate understands it.

**Documentation:** Reconcile README, REQUIREMENTS, ASSUMPTIONS, deployed behavior, and the separate submission notes field. Include actual links and test outcomes only. Follow the README and submission-field strategy in ASSUMPTIONS.md. Prepare reviewable submission material; do not send messages or submit external forms without appropriate explicit authorization.

**Risks / edges:** Last-minute bonuses/regressions, stale docs, inaccessible public repo, session proxies working only locally, ephemeral data, untested restores, screenshots accepted blindly. Freeze mandatory behavior before bonus work and re-run relevant regressions after each bonus.

**Stop:** Present mandatory release evidence and remaining limitations for review before starting any bonus slice.

## Bonus backlog

Each bonus is a separate reviewed feature slice after Phase 7. Include migration when needed, focused tests, mandatory regressions, and documentation updates. All six are planned and will be attempted in priority order when authorized and feasible; no claim of guaranteed completion by an unknown deadline.

| Order / requirement | Features and likely modules | Acceptance and edge cases | Indicative effort |
|---|---|---|---|
| 1 / B01 CSV export | Creator-authorized export service/endpoint and results action; selected-version timestamp/question columns. | Stored rows/counts match, unauthorized access denied; Unicode, commas, quotes, multiline values quoted correctly; spreadsheet formula prefixes neutralized, including user-defined headers. | 1.5–2.5 h |
| 2 / B02 Custom themes | Builder theme editor, bounded presentation settings, shared renderer tokens; text/answer/button/background colors, approved font list, solid background. | Draft/preview/public consistency; publication isolation; contrast; reload; no implied arbitrary font or background-image upload. | 3–4 h |
| 3 / B03 Dark mode | Creator shell semantic tokens, light/dark/system preference stored locally, early theme initialization. | No first-paint flash, unreadable dialogs/charts/focus states; public form theme is independent. | 1.5–2.5 h |
| 4 / B04 Basic branching | Rule schema/editor, publication validator, shared client path logic, independent server path validation, results/progress changes. Forward-only equality for MC/dropdown/yes-no; ordered first-match, normal-next fallback, later-question or ending target. | Invalid/cyclic targets cannot publish; server recomputes reachable path; hidden required fields not required; backtracking removes unreachable answers; correct progress and historical version rules. | 5–8 h |
| 5 / B05 Partial responses / completion rate | Attempt records, partial persistence after validated advancement, resume identity, finalization, results cohorts. | Start on first meaningful interaction, not GET; refresh resumes; finish upgrades once rather than duplicates; preview excluded, seeds distinguished; started/completed same cohort and denominator. | 5–8 h |
| 6 / B06 File upload | Scoped staged attachments, durable storage, question control, submission association, authenticated creator download, quotas and abandoned-upload cleanup. One PDF/JPEG/PNG up to 5 MiB. | Actual size/type checks, ownership/version checks, no orphan on failure, durable restart, recoverable upload/download failures; document absence of malware scanning if applicable. | 6–10 h |

Do not ship a branching editor that has no server semantics. Do not call browser-local answer recovery partial-response analytics. File uploads require a complete lifecycle; payment, integrations, arbitrary expression logic, font uploads, and background-image uploads remain out of scope.

## Verification catalog

Tests are added with behavior in each phase. Commands/files will be recorded once they exist; the following identifiers are planned suites/procedures, not claims that test files already exist.

| ID | Scope and required procedure |
|---|---|
| DOCS-PLAN | Audit source fingerprint and all 97 paragraphs; six docs, IDs, relative links, test references, phase/feature statuses, agreed decisions, no application files. |
| BUILD | Frontend lint/typecheck/production build, backend lint/import/config and relevant checks, clean reproducible dependency setup. |
| REVIEW-ARCH | Inspect module boundaries, generated contracts, migrations, ER/schema/indexes, SQL ownership and transactions against ARCHITECTURE.md. |
| REVIEW-ORIGINALITY | Review provenance/dependency/reference attribution and authored code; no existing clone repository code/assets. |
| API-CRUD | Create/rename/duplicate/delete; draft independence, response count, deletion cascade, stale mutation behavior. |
| API-DEFINITION | All type definitions/settings, order, stable keys, full draft round trips, incomplete draft vs strict publish, migrations/FKs. |
| API-PUBLISH | Invalid/empty publish, stable slug, private draft, idempotent publish, close/reopen epochs, same-period versions. |
| API-HISTORY | Old labels/options/order survive draft deletion/change; detail and summary use correct immutable version. |
| API-VALIDATION | All Q01–Q08 cases; required/optional, zero/false, duplicate/unknown keys, foreign options, strict types, lengths/ranges, direct malformed requests. |
| API-SUBMISSION | Atomic rollback, idempotency/payload conflict, simultaneous duplicate requests, lost acknowledgement retry, close/race handling. |
| API-RESULTS | Pagination, stable order, form totals, version filters, full detail, missing optional answers. |
| API-STATS | Exact fixture counts/percentages/means, answered/skipped denominators, zero-answer states, version separation. |
| API-SEED | First/repeated/concurrent initialization, independent workspaces, deleted samples not recreated, validated seed data. |
| API-ISOLATION | Foreign workspace IDs rejected for every creator read/write/nested resource; cookie expiry/origin/ownership behavior. |
| COMPONENT-BUILDER | Reducer invariants, type changes, keyboard reorder, save sequencing, stale acknowledgement, lost acknowledgement, conflict/recovery. |
| COMPONENT-RUNNER | Validation, answer retention, progress, navigation lock, IME/widget keyboard ownership, rating/dropdown state. |
| COMPONENT-PREVIEW | Shared rendering/validation; completion path makes no response/attempt write. |
| COMPONENT-DIALOG | Focus trap/return, Escape, safe destructive default, cancellation/pending/error behavior. |
| E2E-CREATOR | Real UI create/edit/reload/rename/duplicate/delete; copy independence and correct statuses/counts. |
| E2E-TYPES | Add/configure/render/fill/store/read every required type using real API and database. |
| E2E-REORDER | Pointer and keyboard first/middle/last moves, cancelled move, preview/save/publish ordering. |
| E2E-PREVIEW | Desktop/mobile live draft preview and zero change in response count after completion. |
| E2E-PUBLISH | Publish/copy/open, draft isolation, republish/stable link, close/reopen, already-open respondent rejection. |
| E2E-KEYBOARD | Enter, Shift+Enter, arrows, Tab, letters, Escape, back navigation, repeated keys, focused widgets, IME. |
| E2E-RESPONDENT | Fullscreen real public flow, progress, back retention, explicit submit, confirmed thank-you, retry without duplicates. |
| E2E-VALIDATION | Required/invalid UI inputs, inline errors/focus, correct optional skipping, server rejection recovery. |
| E2E-PUBLIC | Separate unauthenticated browser context opens and submits public link without creator bootstrap. |
| E2E-RESULTS | Real submission appears in table/detail/summary; historic labels, skipped values, version filtering and pagination. |
| E2E-STATES | Loading/empty/failure states, save/submission fault injection, truthful notifications, clipboard fallback, retry. |
| E2E-PLACEHOLDERS | Workflow/integrations/team/payment/upload/settings placeholders honestly labeled, unsupported types rejected. |
| E2E-FIRST-VISIT | New browser receives samples once; returning session preserves edits; fresh independent browser has isolated workspace. |
| ACCESSIBILITY | Labels, error announcements, focus order, keyboard-only use, reduced motion, contrast, touch targets, 200% zoom, physical phone. |
| VISUAL | Five-surface side-by-side review at specified widths, long/empty/loading/error data; approved deterministic screenshot regression. |
| VISUAL-MOTION | Observe transition direction, timing, repeated actions, no flicker/overlap, focus and reduced motion in live browser. |
| OPS-PERSIST | Record sentinel IDs; restart, real redeploy, backup and separate restore; verify definitions, answers, totals survive each. |
| DOCS-RELEASE | README fresh-clone commands and links; assumptions/bonuses/limitations reconcile; concise final submission-field text. |
| INTERVIEW | User walkthrough explaining services/schema/autosave/history/retries/SQLite and representative code/query decisions. |
| RELEASE | Integrated mandatory checklist, logged-out repo/app links, deployment/persistence evidence, evaluator walkthrough, no secrets/data committed. |
| BONUS-CSV | Version-specific export correctness, quoting/Unicode/formula prefixes, creator authorization. |
| BONUS-THEMES | Theme edit/persist/publish isolation, shared rendering, contrast and supported fonts. |
| BONUS-DARK | Preference/system updates, first paint, all creator surfaces and charts, respondent theme independence. |
| BONUS-BRANCHING | Reachability/server recomputation, hidden required fields, backtracking/pruning, invalid rules, progress/history. |
| BONUS-PARTIAL | Actual start/partial persistence, resume, finalize once, cohort denominator, preview/seed handling. |
| BONUS-UPLOAD | Limits/content/ownership, durable file and response association, download auth, quota/cleanup/failure recovery. |

### API/database methodology

Use temporary **file-backed** SQLite databases with real migrations and production foreign-key configuration. Do not replace integrity tests with mocked sessions or in-memory behavior that differs from deployment. Assert constraints, commit/rollback, independent sessions, concurrency, exact aggregates, and ownership boundaries. Shared valid/invalid answer fixture cases cover Python and frontend validators; test actual semantics rather than repeating implementation code.

### Browser workflow sequence

Use real frontend and backend; do not mock successful core workflows. Fault injection is appropriate to test failure paths.

1. Create a form; add all eight types; edit descriptions/settings; reorder; reload and verify.
2. Duplicate; modify copy; prove original unchanged, copy unpublished and response-free.
3. Publish and copy URL; open unrelated browser context; submit; inspect detail and summary.
4. Edit published form; public version unchanged until republish.
5. Submit an older version from same open period; historical rendering remains correct.
6. Unpublish; fresh and already-open sessions cannot submit new responses; verify reopen epoch rules.
7. Exercise all specified keys, IME, reduced motion, progress, and back navigation.
8. Fail save/submission requests or acknowledgements; retain work, truthful status, retry once.
9. Complete interactive preview; response/attempt counts remain unchanged.
10. Delete questions/forms, including cancellation, last-question selection, and historical-response behavior.

Run critical suite in Chromium; respondent smoke in Firefox and WebKit. Capture useful failure artifacts (trace, screenshot, logs) without real personal data.

### Responsive, operational, and visual review

Widths: 360, 390, 768, 1280, 1440 px; 200% zoom. Check long titles/prompts/options/descriptions/answers, no unintended page-wide horizontal scroll, keyboard visibility, bottom actions/safe areas, focus and error announcements, empty dashboard/builder/results, unavailable form, and slow/failed requests. Physical-phone software-keyboard testing remains a manual gate.

For persistence, record uniquely named form and response IDs and known answers/counts. Restart backend and verify; repeat after actual redeployment; restore a consistent SQLite backup into a separate database and verify again. Record host/database path and exact steps. Local survival is not proof of deployed durability.

Compare reference and implementation at matching viewport/state for hierarchy, typography, spacing, color, border, icons, controls, dialogs, and navigation. Review motion separately. Save regression screenshots only after manual acceptance; never update baselines solely to make CI pass. [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).

## Final critical review and safeguards

| Risk / weak point | Mitigation and completion evidence |
|---|---|
| Fidelity becomes a final cosmetic pass | Establish tokens in Phase 1, inspect each principal surface in its own phase, record mismatches and source limitations. |
| Bonuses consume reliability time | Full mandatory release gate before any bonus; separate reviewed slices and regressions. |
| Autosave overwrites or loses edits | Serialized queue, mutation IDs, revision checks, temporary recovery, two-tab and network-failure tests. |
| Draft edits destroy historical meaning | Immutable published definitions and version-specific aggregates/detail. |
| Anonymous visitors edit one another's forms | Isolated sessions, ownership checks on every creator path, foreign-ID integration tests. |
| Preview contaminates responses/metrics | Nonpersisting completion callback and zero-write tests, including future attempts. |
| SQLite is durable locally but ephemeral in deployment | User chose Free demo: document ephemeral path and loss boundary; verify reload/pings, retain local durability checks, disclose M16/M27/M38 gap. |
| Ambiguous statistics / optional values | Explicit version/sample size; percentages among answered; skipped separate; zero/false tested. |
| Unsupported functionality appears complete | Explicit placeholders/disabled controls; no fake analytics or success notifications. |
| Cookie/proxy assumptions fail late | Deployed same-origin session proof in Phase 1. |
| Planning decisions become false completion claims | Evidence-based requirement status and final reconciliation of deployed app/docs/notes. |
| Exact references or deadline are missing | Preserve documented research limits; record actual deadline when provided; no guessed fidelity or dates. |
| Code understanding is inferred from passing tests | Candidate performs an actual interview walkthrough; M41 stays unverified until then. |

All assignment sections are mapped in REQUIREMENTS.md, including non-feature guidance. UI polish is part of every phase; reliability and submission evidence are explicit gates, not optional cleanup.

## Phase 0 verification record

Status: **Verified on 2026-10-09**. Historical state at Phase 0 completion: requirement U01 was Verified, all application requirements remained Planned, and Phase 1 had not started. Subsequent Phase 1 progress is recorded below.

Source inspection: all 97 paragraphs and the evaluation table read; source SHA-256 matches the fingerprint in REQUIREMENTS.md. Manual reconciliation with the approved plan checked feature contracts, all eight types, permissions/bonuses, design evidence limits, technology/schema/API decisions, phase order, testing procedures, and README/submission strategy.

Automated documentation audit: an inline, read-only Python script was run through PowerShell using the bundled Python executable (`C:\Users\saksh\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`). It used pathlib, hashlib, zipfile, ElementTree, and regular expressions; no packages were installed and no audit artifacts or application files were generated. Final result: **18 of 18 checks passed, exit code 0**.

| Check group | Actual result |
|---|---|
| Document existence/encoding | Six nonempty UTF-8 planning files. |
| Source identity/structure | Fingerprint matches; 97 paragraphs and one table. |
| Matrix identifiers | Complete, unique M01–M41, U01–U04, P01–P05, B01–B06, Q01–Q08, E01–E07. |
| Paragraph coverage | P001–P097 covered exactly once in the source ledger. |
| Local Markdown links | Every local file link and heading anchor resolves. External references were preserved from research, not live-revalidated in this audit. |
| Test traceability | All 44 test identifiers referenced by REQUIREMENTS.md resolve within the 45-entry planned verification catalog. |
| Status boundaries | Mandatory application/bonus rows remain Planned; phases 1–7 remain Not started; per-phase stop rule is consistent. |
| Architecture preservation | Eight schema tables and key revision, publication, idempotency, cookie, and durable-database decisions present. |
| Workspace scope | Exactly the six planning Markdown files; no application code or Git initialization. |

Reproduction procedure for DOCS-PLAN: read all six UTF-8 documents; compute source SHA-256 and parse document.xml counts; compare matrix IDs to the contiguous expected ranges; expand the paragraph coverage ranges and compare to 1–97 exactly once; resolve relative links/anchors and requirement test IDs against the catalog; inspect phase/feature status and the workspace inventory; manually compare architectural and design contracts with the approved plan. This is a document audit, not a substitute for future runtime verification.

Final status edits are followed by a separate consistency check that Phase 0/U01 alone are verified and no later phase was started. Remaining limitations: original-font/timing references and physical-phone behavior are unverified; deadline and deployment access remain external information. These do not block the documentation acceptance gate and remain recorded in ASSUMPTIONS.md.

Application builds, API/component/browser tests, deployment, and durability checks have **not** run and are not applicable to Phase 0. Their procedures are planned above; no application behavior is claimed.

## Future evidence format

For each later phase, append: date and revision; implemented modules/requirements; exact commands/manual checks and results; environment (local/deployed, browser, database); artifacts or logs; failed/skipped tests with reasons; limitations and assumption changes; final gate status and next phase. Mark a requirement Verified only after all its acceptance cases have evidence, not merely its current phase's portion.

## Phase 1 verification record

Date: **2026-10-09**. Gate: **local implementation verified; live deployment pending user handoff**. No Phase 2 domain code has been implemented. Working repository: [private scaler-typeform-clone](https://github.com/sakshamverma21/scaler-typeform-clone). The user asked for private visibility during development and will take over Vercel; public visibility is still required for final submission.

Implemented scope:

- Next.js 16.4 / React 19.3 / strict TypeScript foundation, self-hosted Inter, semantic Tailwind tokens, responsive creator shell, shared buttons and Radix dialog, loading/error/unavailable states.
- FastAPI configuration, app factory, no-store health/readiness endpoints, origin checks, structured validation/database errors, SQLite connections, and runtime Alembic migration before readiness.
- Temporary `foundation_probes` migration/model/service/router with opaque hashed browser token, expiry, HttpOnly/SameSite cookie and production Secure setting. This is a diagnostic, not full workspace authentication or form data.
- Generated OpenAPI and TypeScript API types, typed fetch helper with failure handling, query/mutation state, explicit connection check.
- Exact npm lockfile and hash-locked Python production/dev requirements; Node 24/Python 3.11 targets, Compose named volume, production Dockerfiles, Vercel settings, Render Blueprint, CI workflow, README and deployment handoff.

| Verification | Actual procedure/result |
|---|---|
| Backend lint/format | From backend: `.venv/Scripts/ruff.exe check .` and `ruff.exe format --check .`: pass. |
| API/database | `.venv/Scripts/python.exe -m pytest -q`: **18 passed** using real migrations/file-backed SQLite. Covers readiness-before-migration, browser isolation, cookie hashing/reuse/expiry, origin rejection, production cookie flags, disabled probe, pragmas, recoverable DB failure. One upstream HTTPX TestClient deprecation warning remains. |
| Native restart | `python scripts/verify_local_restart.py`: pass, exit 0. Actual processes stopped/restarted against one temporary SQLite file; UUID `63f40c8c-8409-4a62-8cee-4cc5571d539e` retained. Windows verifier stops its own process tree to close child interpreters/log handles. |
| Frontend lint/format/types | `npm run lint`, `npm run format:check`, `npm run typecheck`: pass with the Node 24 runtime. |
| Component/client tests | `npm test`: **five passed**. Dialog accessible title/description and asynchronous focus return; structured/API HTML/network failures; caller Headers/revision header preservation. |
| Production frontend | `npm run build`: pass. Browser runner also builds a real standalone artifact with its test rewrite and copies static assets before serving. |
| Browser integration | `npm run test:e2e`: **nine passed** in Chromium against real FastAPI and standalone Next.js. Cookie transport/reload through rewrite; dialog Tab containment/Escape; 360/390/768/1280/1440 widths without horizontal overflow; failure/retry, visible slow-loading state, public shell without creator chrome. |
| Manual visual check | Viewed actual 390 px and 1440 px screenshots generated by the browser suite: readable type/spacing, consistent rounded neutral panels, controls, no obvious overlap/overflow. This verifies the foundation only, not complete Typeform fidelity. Screenshots are ignored test artifacts, not preapproved full-product baselines. |
| Compose/images | `docker compose config --quiet` and `docker compose up --build -d`: pass; both Linux images built using clean locked installs; backend healthy and frontend served at localhost:3000. |
| Volume durability | Through frontend rewrite, POST/GET probe; `docker compose restart backend`; then `docker compose up -d --no-deps --force-recreate backend`; wait for readiness and GET with the same cookie after each. **Pass**, UUID `6dbfda91-1549-439f-9c9d-43d90594e221` retained on `scaler-typeform_typeform-data`. Local container recreation is not cloud redeployment proof. |
| Production npm audit | `npm audit --omit=dev --json`: zero reported vulnerabilities. Full audit retains five high development-only entries in Next's lint dependency chain; recorded in ASSUMPTIONS.md. No forced framework downgrade or suppressed audit was used. |
| OpenAPI contracts | Export via `backend/scripts/export_openapi.py`, then `npm run api:generate`: pass; generated source committed with backend contract. |
| Git / CI | Private repository [sakshamverma21/scaler-typeform-clone](https://github.com/sakshamverma21/scaler-typeform-clone) created; visibility confirmed through GitHub API. `git push -u origin main` passed for application commit `9744fcb6080e84ac63f857ed8eaaa31181e66d9a`. Staged credential/data audit and `git diff --cached --check` passed; no local databases, secrets, or build artifacts tracked. [Remote CI run](https://github.com/sakshamverma21/scaler-typeform-clone/actions/runs/37890180546) **passed** on Ubuntu for all three jobs: backend lint/format/pytest, frontend lint/format/types/unit/build, and real-browser workflow. Result confirmed through GitHub API on 2026-10-09. |
| Final documentation audit | Relative file links resolve; all M01–M41, Q01–Q08, P01–P05, B01–B06, E01–E07, and U01–U04 remain present. `git diff --check` passed. Requirements retain partial evidence status rather than claiming full workflows. |

Initial failures corrected before acceptance: incompatible compiler/test-tool dependencies and missing optional native binding were replaced with a clean Node-24 install; the dialog test now waits for Radix's asynchronous focus restoration; standalone startup includes static assets; browser tests use dedicated ports because an existing unrelated Docker service occupies 8000. No unrelated service was stopped. Windows process cleanup in the restart verifier was corrected and retested successfully.

Remaining revised live gate: provision/configure Render Free, import frontend into Vercel, set exact HTTPS origins/rewrite, verify Secure/HttpOnly cookie on frontend host and reload/isolation, configure the external minutely ping and verify more-than-15-minute continuity, then record URLs/commit/date. Cloud restart/redeploy survival is waived by the user's 2026-10-09 instruction and remains a documented durability gap. Follow [DEPLOYMENT.md](DEPLOYMENT.md). The local Docker preview remains available at [localhost:3000/forms](http://localhost:3000/forms).

Limitations: no form CRUD/builder/respondent submission/results/seed data/domain schema yet; no full creator workspace session; no physical-phone/software-keyboard or full accessibility/zoom review; no bonuses. These belong to subsequent phases. M28, M33–M38, U03, U04 are In progress, not wholly Verified.

Next development phase after review and resolution of the live gate (or an explicit user-directed gate adjustment): **Phase 2 — schema, core services, sessions, and seeds**. Stop here for review/handoff.

### Phase 1 hosting and design-reference follow-up — 2026-10-09

Implemented configuration/documentation only: Free plan with no disk and `/app/data/typeform.sqlite3`; detailed Render/Vercel/external-ping handoff; reconciled architecture, requirements, assumptions, and agent instructions. Seed behavior remains planned for Phase 2, once per fresh workspace without resets. No live cron job or hosting proof is implied.

Authorized Chrome Typeform inspection could not start: browser and native computer-use initialization failed with a kernel-assets path error, including reset/retry. No authenticated UI was read and no screenshot captured. [Capture index](docs/design-reference/README.md) lists pending assignment-relevant views; exact user account URL and private response data are not included in repository documentation. Original public references remain the available design evidence.

| Follow-up verification | Actual procedure/result |
|---|---|
| Documentation and Blueprint | Inline read-only Python audit from repository root using `backend/.venv/Scripts/python.exe`: **pass**, nine Markdown files, 38 local file links, complete/unique requirement IDs, unchanged unverified durability rows, Phase 2 Not started, no fabricated screenshot files. PyYAML confirms Free Docker service, one instance, no disk, real Docker paths, readiness path and production database/environment settings. This is local structural validation, not Render deployment/API validation. |
| Backend regression | From backend, `.venv/Scripts/python.exe -m pytest -q`: **18 passed**, one previously documented HTTPX/Starlette warning. Initial sandboxed attempt stalled without output and was interrupted; rerun with approved sandbox escalation passed in under three seconds. |
| Free-host path/startup | PowerShell inline Python piped to `docker run --rm -i --network none --entrypoint python scaler-typeform-backend:latest -`: **pass**. Existing production image in a disposable container accepted the documented temporary HTTPS origin, created `/app/data/typeform.sqlite3`, ran actual Alembic startup, reached readiness, and verified foreign keys/busy timeout. Container removed on exit; running app untouched. This does not simulate Render availability or durable storage. |
| Compose / diff | `docker compose config --quiet` and `git diff --check`: **pass**. Local named volume remains configured. Frontend code/dependencies were unchanged, so prior browser/build evidence was not represented as a new run. |
| Authenticated Typeform | Browser/native initialization and reset/retry failed before access. **Not inspected; zero screenshots captured.** Reference capture index added with all entries Pending. |
| Live services / scheduler | **Not verified/configured**. Actual service URLs, HTTPS proxy checks and scheduled-call history remain missing. No complete application requirement or later phase was marked Verified. |

Phase 2 remains Not started. Stop for deployment/review handoff.
