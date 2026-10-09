# Requirements and acceptance traceability

## Source, scope, and status rules

Primary source: `C:\Users\saksh\Downloads\Assignment Typeform Clone.docx`.

- SHA-256: `e7ef66133711e7371f40eb55c3ba2fc1015cd70a6f2d01da516929f7decb7696`.
- Audited on 2026-10-09: all 97 WordprocessingML paragraphs, including the seven evaluation rows and table header; one table total.
- No embedded screenshots, comments, tracked changes, supplementary attachments, headers, footers, footnotes, or endnotes were found in the inspected document.
- `P001`–`P097` below are extraction-order paragraph identifiers, including table paragraphs; they are not printed page numbers.
- The latest user instruction authorizes one implementation phase at a time and requires stopping for review. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) is the progress authority.

Classification: **M** = mandatory assignment requirement; **P** = expressly permitted simplification; **B** = assignment bonus; **U** = additional user requirement; **S** = suggested implementation behavior. Detailed acceptance criteria often include approved S decisions beyond the assignment's wording. Those choices do not become claims about the original document.

Status vocabulary: **Planned**, **In progress**, **Implemented / unverified**, **Verified**, **Blocked**. Verified requires recorded evidence for the whole acceptance criterion. Phase 2 API/database evidence advances relevant partial requirements; UI workflows remain unverified. M34/M35 can be verified independently at backend/schema level. The test identifiers below resolve to the catalog in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#verification-catalog).

## Mandatory feature matrix

| ID | Source | Required feature | Acceptance criteria, including approved implementation contract | Verification | Status |
|---|---|---|---|---|---|
| M01 | P018 | Create form with title and ordered questions | Creation opens a usable builder; title and question order survive reload and restart. | API-CRUD, E2E-CREATOR, OPS-PERSIST | Verified |
| M02 | P019–P020 | Add questions | All eight required types can be added repeatedly with independent stable identifiers. | API-DEFINITION, E2E-TYPES | Verified |
| M03 | P019, P021 | Edit questions | Prompt, description, settings, and applicable choices update the local canvas immediately and persist. | COMPONENT-BUILDER, E2E-CREATOR | Verified |
| M04 | P019 | Drag-and-drop reorder | Move first, middle, and last questions; numbering, preview, saved order, and published order agree. Cancelled drag changes nothing. | COMPONENT-BUILDER, E2E-REORDER | In progress |
| M05 | P019 | Delete questions | Selected and last-question deletion leave a usable builder and persist. Existing submissions remain readable through historical versions. | API-HISTORY, E2E-CREATOR | Verified |
| M06 | P020 | Eight question types | Every type in the type matrix works from editing through public submission and results. | API-VALIDATION, E2E-TYPES, E2E-RESULTS | In progress |
| M07 | P021, P032 | Required toggle | Missing required answers fail; optional answers can be skipped; boolean false and numeric zero count as answers. | API-VALIDATION, COMPONENT-RUNNER, E2E-VALIDATION | In progress |
| M08 | P021 | Description/help text | Add, edit, remove, save, preview, and publish optional descriptions. | E2E-CREATOR, VISUAL | In progress |
| M09 | P022, P043 | Live preview | Canvas reflects local edits; interactive desktop/mobile preview shares public rendering and validation. Preview creates no responses. | COMPONENT-PREVIEW, E2E-PREVIEW | In progress |
| M10 | P024 | Creator forms list | Every owned form shows correct draft/published state and completed-response count. | API-RESULTS, E2E-CREATOR | Verified |
| M11 | P025 | Rename forms | Dashboard and builder reflect persisted title; share URL does not change. | API-CRUD, E2E-CREATOR | Verified |
| M12 | P025 | Duplicate forms | Copy current draft definition/settings into independent identifiers, unpublished with zero responses. Subsequent edits are independent. | API-CRUD, E2E-CREATOR | Verified |
| M13 | P025 | Delete forms | Confirmation explains form/response removal; cancel preserves data; confirm removes data and invalidates link. | API-CRUD, E2E-CREATOR | Verified |
| M14 | P026 | Publish and share | A valid nonempty form publishes to a functioning public URL; invalid definitions report actionable errors. | API-PUBLISH, E2E-PUBLISH | In progress |
| M15 | P026 | Unpublish | Link becomes unavailable and rejects new submissions; republishing restores the same URL. | API-PUBLISH, E2E-PUBLISH | In progress |
| M16 | P027 | Persist definitions | Titles, questions, order, options, required flags, descriptions, and settings survive restart and redeployment. | API-DEFINITION, OPS-PERSIST | In progress |
| M17 | P030, P042 | Full-screen conversational flow | One question is visually active, creator navigation is absent, and going backward preserves answers. | COMPONENT-RUNNER, E2E-RESPONDENT, VISUAL | In progress |
| M18 | P030, P042 | Smooth transitions | Forward/backward motion has correct direction, no flicker or overlapping controls, and no accidental multiple advances. | COMPONENT-RUNNER, E2E-KEYBOARD, VISUAL-MOTION | In progress |
| M19 | P031 | Keyboard navigation | Enter advances appropriately; arrows navigate without breaking text cursors, dropdowns, radio groups, or Tab navigation. | E2E-KEYBOARD | In progress |
| M20 | P031 | Progress indicator | Answered progress stays consistent when answers change; successful completion reaches 100%. Position is also visible. | COMPONENT-RUNNER, E2E-RESPONDENT | In progress |
| M21 | P032 | Client and server validation | Invalid UI and direct API answers are rejected with question-specific errors. Server does not trust client metadata. | API-VALIDATION, E2E-VALIDATION | In progress |
| M22 | P033 | Submit and thank-you screen | Response and answers commit atomically; thank-you appears only after confirmed success; failures retain answers for retry. | API-SUBMISSION, E2E-RESPONDENT | In progress |
| M23 | P014, P034 | Public filling without login | Published link works in a separate browser context without a creator session. | E2E-PUBLIC | In progress |
| M24 | P036 | Per-form submissions table/list | Completed responses show submission time and can be browsed with pagination. | API-RESULTS, E2E-RESULTS | In progress |
| M25 | P037 | Full individual response | Detail shows every question in its submitted version, including skipped optional questions and original labels. | API-HISTORY, E2E-RESULTS | In progress |
| M26 | P038 | Basic per-question statistics | Choice counts/percentages, numeric/rating summaries, answered/skipped counts reconcile with stored version-specific responses. | API-STATS, E2E-RESULTS | In progress |
| M27 | P039 | Persist responses | Responses and aggregates survive restart and redeployment. | OPS-PERSIST | In progress |
| M28 | P007, P041–P043, P047, P063 | Typeform visual fidelity | Workspace, builder, respondent, dialogs, and results pass the reference-based visual rubric. No generic default component styling substitutes for the reference. | VISUAL | In progress |
| M29 | P044 | Forms, modals, inline editing | Creation/rename/delete dialogs and inline question/choice editing work; dialog focus is restored. | COMPONENT-DIALOG, E2E-CREATOR | Verified |
| M30 | P045 | Notifications/toasts | Create, duplicate, publish, copy-link, and delete give truthful feedback; save failure remains visibly recoverable. | E2E-STATES | In progress |
| M31 | P046 | Theme/thank-you settings placeholders | Both are discoverable and honestly labeled if unimplemented. Actual default thank-you screen still functions. | E2E-PLACEHOLDERS | In progress |
| M32 | P064 | Seed data | Fresh workspace has two published mixed-type forms and synthetic existing responses; together they exercise all eight types. | API-SEED, E2E-FIRST-VISIT | Verified |

## Question-type contract

Only the eight type names, required setting, descriptions, and sensible validation are explicitly mandated. Defaults and limits below are approved implementation choices. No multiple selection, Other choice, randomization, rich text, or media support is implied by M06.

| ID | Type | Selected behavior | Acceptance cases |
|---|---|---|---|
| Q01 | Short text | Single line, maximum 999 characters; whitespace-only is missing when required. | Empty, whitespace, Unicode, length boundary, back navigation and stored text. |
| Q02 | Long text | Multiline, maximum 10,000 characters; internal newlines preserved. Desktop Enter advances, Shift+Enter inserts newline. | Newline round trip, keyboard behavior, long-content scrolling, length boundary. |
| Q03 | Multiple choice | One selection; editable ordered options, letter shortcuts, visible selection. | Change selection, keyboard choice, missing required answer, foreign/deleted option rejection. |
| Q04 | Dropdown | Searchable single selection; optional answer can be cleared; empty/no-match states. | Search, selection, clear, Escape/arrows, invalid option rejection. |
| Q05 | Email | Trim outer whitespace, validate syntax; no deliverability check. | Valid and malformed addresses, empty optional value, invalid direct API request. |
| Q06 | Number | Nonnegative whole number up to 15 digits: 0 through 999999999999999. | Zero and upper bound accepted; overflow, decimals, negatives, booleans, text rejected; required empty rejected. |
| Q07 | Yes/no | Explicit boolean; no preselected answer. | True and false accepted; missing required answer and string booleans rejected. |
| Q08 | Rating | Stars, default maximum 5; creator maximum from 1 through 10. | Every value, keyboard selection, minimum/maximum, fractional and out-of-range rejection. |

The number direction follows Typeform's documented whole-number restriction; accepting zero is our explicit choice. [Official question types](https://help.typeform.com/hc/en-us/articles/360051789692-Question-types). All Q cases run through API-VALIDATION, E2E-TYPES, and E2E-RESULTS; interaction cases also use COMPONENT-RUNNER and E2E-KEYBOARD.

## Technical and submission requirements

| ID | Source | Requirement | Acceptance evidence | Verification | Status |
|---|---|---|---|---|---|
| M33 | P011 | Next.js and TypeScript | Next.js App Router, strict TypeScript, production build, and working browser flows. | BUILD, E2E-CREATOR, E2E-RESPONDENT | In progress |
| M34 | P012 | Python, FastAPI or Django | Selected FastAPI owns validation, persistence, publishing, submissions, and results. | REVIEW-ARCH, API-CRUD, API-SUBMISSION | Verified |
| M35 | P013, P065 | SQLite; self-designed schema | Migrations, ER diagram, constraints, indexes, relationships, and file-backed database tests. | REVIEW-ARCH, API-DEFINITION, OPS-PERSIST | Verified |
| M36 | P069, P073 | Public GitHub repository | Signed-out access works; repository contains frontend/ and backend/. | RELEASE | In progress |
| M37 | P066, P070 | README | Setup, stack, architecture, schema, API, assumptions, tests, deployment; fresh-clone instructions actually work. | DOCS-RELEASE, RELEASE | In progress |
| M38 | P071, P074 | Hosted working application | HTTPS creator and public workflows work with deployed persistent SQLite. | RELEASE, OPS-PERSIST, E2E-PUBLIC | In progress |
| M39 | P075 | Submit repository and deployment links | Both final URLs independently verified and included in submission package. | RELEASE | Planned |
| M40 | P067 | Original work | No existing clone code/assets copied; reference and dependency attribution is accurate. | REVIEW-ORIGINALITY | Planned |
| M41 | P009, P093 | Understand submitted code | Candidate can explain code, architecture, queries, decisions, and failures in an interview. AI assistance is allowed. | INTERVIEW | Planned |
| U01 | User request | Six persistent planning files | All six files exist, cross-link, preserve the approved decisions, and pass the complete source coverage audit. | DOCS-PLAN | Verified |
| U02 | User request | Separate submission notes field | Concise professional Assumptions / Mocked Data / Notes text contains only implemented, verified facts. | DOCS-RELEASE | Planned |
| U03 | User request | Responsive and accessible | Desktop/tablet/mobile, keyboard, focus, zoom, reduced motion, and physical-phone review pass. | ACCESSIBILITY, VISUAL, E2E-KEYBOARD | In progress |
| U04 | User request | Behavior verified beyond build | Relevant API/database, component, browser, deployment, and persistence evidence exists. | RELEASE, OPS-PERSIST | In progress |

## Permitted simplifications

These permissions do not require us to build the corresponding complete products. Visible navigation must remain truthful.

| ID | Source | Permission | Planned baseline and acceptance | Verification | Status |
|---|---|---|---|---|---|
| P01 | P050 | Advanced logic/branching | Workflow page clearly says Coming soon until B04 is complete. | E2E-PLACEHOLDERS | Planned |
| P02 | P051 | Integrations/webhooks | Clearly labeled placeholder; no fake connections or success states. | E2E-PLACEHOLDERS | Planned |
| P03 | P052 | Team collaboration/sharing | Clearly labeled team placeholder; M14 public sharing remains functional. | E2E-PLACEHOLDERS, E2E-PUBLISH | Planned |
| P04 | P053 | Payment/file-upload types | Disabled picker entries marked Coming soon; unsupported types cannot publish. File upload may later become B06. | E2E-PLACEHOLDERS, API-VALIDATION | Planned |
| P05 | P054 | Simplified creator authentication | Browser-specific opaque session and isolated workspace; no account signup or recovery. | API-ISOLATION, E2E-FIRST-VISIT | Planned |

## Optional bonuses, in implementation priority order

All bonuses remain unimplemented until their independent acceptance gate passes. See effort, modules, and edge cases in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#bonus-backlog).

| ID | Source | Bonus | Acceptance criteria | Verification | Status |
|---|---|---|---|---|---|
| B01 | P058 | CSV export | Authorized version-specific export matches stored rows; quotes/newlines/Unicode and spreadsheet formula prefixes are safe. | BONUS-CSV | Planned |
| B02 | P057 | Custom themes | Colors, approved fonts, solid background persist in draft and publication; preview/public match; contrast reviewed. | BONUS-THEMES | Planned |
| B03 | P061 | Dark mode | Creator light/dark/system preference persists without flash or illegible controls; public theme remains form-controlled. | BONUS-DARK | Planned |
| B04 | P056 | Basic branching | Forward-only choice rules affect editor, runner, server validation, history, and progress; hidden required questions do not block. | BONUS-BRANCHING | Planned |
| B05 | P059 | Partial responses/completion rate | Real attempt starts and partial persistence; refresh resumes; finalize once; coherent cohort counts exclude preview. | BONUS-PARTIAL | Planned |
| B06 | P060 | File upload question | Scoped durable attachments, type/size limits, creator-authorized downloads, ownership checks, cleanup, and recovery. | BONUS-UPLOAD | Planned |

## Evaluation criteria

| ID | Source | Criterion | How the submission demonstrates it | Verification |
|---|---|---|---|---|
| E01 | P080–P081 | Functionality | Complete create/edit/publish/public-submit/results walkthrough, plus edge cases. | RELEASE |
| E02 | P082–P083 | UI/UX | Side-by-side reference comparisons of five principal surfaces, motion, keyboard, mobile. | VISUAL, VISUAL-MOTION, ACCESSIBILITY |
| E03 | P084–P085 | Database design | Explain versioned relational schema, typed answers, foreign keys, constraints, and indexes. | REVIEW-ARCH, INTERVIEW |
| E04 | P086–P087 | Backend/API design | OpenAPI, thin routers, transactional services, consistent errors, validation/isolation tests. | REVIEW-ARCH, API-VALIDATION, API-ISOLATION |
| E05 | P088–P089 | Code quality | Readable feature modules, strict types, formatting/lint checks, focused tests. | BUILD, REVIEW-ARCH |
| E06 | P090–P091 | Code modularity | Reusable question presentation, separate builder/runner state, clear service boundaries. | REVIEW-ARCH |
| E07 | P092–P093 | Code understanding | Candidate explains autosave races, publication history, cookies, retries, SQL, deployment tradeoffs. | INTERVIEW |

## Approved improvements, not additional assignment mandates

- **S01:** Versioned publications and version-aware results preserve historical meaning (M05, M25–M27).
- **S02:** Serialized autosave, revision checks, mutation IDs, and temporary recovery prevent lost edits (M03, M16).
- **S03:** Idempotent atomic submission handles retries and lost acknowledgements (M22, M27).
- **S04:** Browser-specific workspace isolation, ownership checks, origin checks, and hashed cookies implement P05 safely.
- **S05:** Dashboard search, sorting, and list/grid toggle are small usability improvements; do not delay mandatory gates.
- **S06:** Pagination, version filters, accessibility, and explicit empty/error states make the baseline reviewable and reliable.
- **S07:** Detailed numeric/rating settings, duplicate semantics, validation limits, and in-flight publication rules are project contracts, not verbatim assignment requirements.

## Complete source coverage audit

Each paragraph belongs to one row below, including headings, blank content, estimate, and closing text. All actionable clauses are represented above; this ledger guards against silently discarding non-feature instructions.

| Paragraphs | Assignment content | Disposition |
|---|---|---|
| P001–P003 | Title, role, Description heading | Context: SDE fullstack Typeform Builder assignment. |
| P004–P007 | Clone scope; builder/respondent priority; exact original look/feel | M01–M32, especially M04, M17–M19, M28; fidelity-first design plan. |
| P008–P009 | AI tools usage and understanding | M41; AI permitted but candidate must explain implementation. |
| P010–P014 | Stack and public access | M23, M33–M35. |
| P015–P022 | Core features / Form Builder | M01–M09; all eight Q types. |
| P023–P027 | Form management CRUD | M10–M16. |
| P028–P034 | Respondent flow | M17–M23. |
| P035–P039 | Results and storage | M24–M27. |
| P040–P047 | Typeform experience and UI details | M09, M17–M19, M28–M31. |
| P048–P054 | Permitted mocked sections | P01–P05. |
| P055–P061 | Six optional bonuses | B01–B06, reordered by implementation priority only. |
| P062–P067 | Notes: fidelity, seeds, schema, README, originality | M28, M32, M35, M37, M40. |
| P068–P075 | Deliverables and submission | M36–M39; frontend/backend folders, both public links. |
| P076–P079 | Evaluation heading, blank paragraph, table header | Context for E01–E07, no extra feature. |
| P080–P093 | Seven evaluation rows | E01–E07. |
| P094–P096 | Timeline heading, about 24-hour estimate, external deadline | Estimate is guidance, not our deadline. Record actual communicated deadline when known. |
| P097 | Closing wish | Non-actionable context. |

## Verification evidence

U01 was verified on 2026-10-09 through DOCS-PLAN. Phase 1 evidence is recorded in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#phase-1-verification-record): production builds, 18 backend tests, five component/client tests, nine browser tests, and local process/volume persistence. This is partial evidence for M28, M33–M38, U03, U04; that historical record precedes Phase 2; its missing live cookie/continuity/ping checks remain deferred. M36's working repository is private at the user's request and must become public before submission. Phase 2 now verifies M34/M35 at backend/schema level; UI-dependent requirements are still In progress or Planned. Future evidence must identify command/manual procedure, date, result, environment, and untested cases.

**User-directed hosting deviation, 2026-10-09:** Render Free + an external minutely ping replaces the paid persistent disk proposal. The user waived cloud restart/redeploy proof for the short demo handoff. This does not change the persistence clauses or verify their original criteria: M16/M27/M38 retain a known deployed durability gap. Keep matrix status/criteria unchanged and disclose it.

**Design research, 2026-10-09:** In-app browser access recovered; [38 actual reference images and observations](docs/design-reference/OBSERVATIONS.md) cover workspace/builder/eight types/preview/share/empty results. Pointer/menu reordering, validation, preview completion and public closure observed in original Typeform. This improves M28 evidence but does not verify clone behavior; M28 remains In progress. Populated results and complete keyboard/motion/physical-phone evidence remain missing.

### Phase 2 API/database evidence — 2026-10-09

See [Phase 2 verification record](IMPLEMENTATION_PLAN.md#phase-2-verification-record) for commands, counts, faults exercised and boundaries. `backend/tests/test_domain.py` covers API-CRUD/DEFINITION/PUBLISH/HISTORY/VALIDATION/SUBMISSION/RESULTS/STATS/SEED/ISOLATION; the existing foundation suite remains passing. The real restart script verifies the creator cookie, edited definition, response, summary and idempotent retry against one file. Chromium's domain API test uses actual Next.js/FastAPI servers and an unrelated browser context.

| Requirements | Verified part | Still required before whole requirement is Verified |
|---|---|---|
| M01–M08 | Draft create/edit/delete/order persistence; eight type contracts, required/help/settings; immutable question history | Builder canvas, drag interactions, public controls and UI tests in Phases 4–6. |
| M10–M13 | Owned list/status/counts, rename, independent draft duplication, deletion cascades/link invalidation | Dashboard, confirmations/cancellation, empty/error states and UI evidence in Phase 3. |
| M14–M16 | Strict publish gate, private drafts, stable URL, close/reopen epochs; local restart definition retention | Sharing/public UI; deployed persistence still has the accepted Render Free gap. |
| M21–M23 | Strict server validation, atomic submission/retries, public API without cookie | Client validation, runner/thank-you UI and actual anonymous form filling in Phase 5. |
| M24–M27 | Paginated list/detail; original labels/skips; SQL statistics reconcile; local restart response retention | Results UI in Phase 6; deployed restart/redeploy durability remains unverified. |
| M32 | Two published Sample forms (12 and 8 synthetic responses) plus one draft; all types, once per workspace, atomic/isolation tests | First-visit dashboard displays and labels samples through the real UI in Phase 3. |
| M34 | FastAPI owns validation, persistence, publication, submission and results in thin routers/domain services | Verified by API suite and code review against architecture. |
| M35 | Eight relational domain tables, frozen migration, ER diagram, composite FKs/checks/indexes; metadata, downgrade/re-upgrade and restart tests | Verified locally; deployed durability belongs separately to M16/M27/M38. |

No builder, respondent, results UI or bonus is claimed complete. Live HTTPS health/readiness and frontend rewrite returned 200/no-store at the supplied URLs; domain code from this local Phase 2 revision has not been deployed or tested there. Scheduled ping and live cookie/continuity evidence remain pending.

### Phase 3 workspace evidence — 2026-10-09

See [Phase 3 verification record](IMPLEMENTATION_PLAN.md#phase-3-verification-record). Production build/strict types and targeted lint passed; `npm run test:e2e -- dashboard.spec.ts`: **2 real Chromium workflow tests passed**, plus manual desktop/mobile screenshot review.

M10/M12/M13/M32 are Verified using complementary Phase 2 API/database evidence and Phase 3 actual UI checks: owned list/status/counts, independent draft copy/no responses, deletion cancellation/confirmation plus API cascades/link invalidation, and labeled first-visit samples covering all types. M11 remains In progress because dashboard rename/reload is verified but the actual builder is Phase 4 (stable public slug is API-verified). M29/M30 and U03 retain partial evidence; inline question editing, share/publish notifications and full responsive/accessibility review are later. M01 still requires builder behavior. M28 is not claimed pixel-perfect.

The user explicitly reduced interim test scope for shipping. Comprehensive cross-browser, accessibility, pagination/fault and release checks remain deferred. Source shipping and actual live deployment are separate evidence; ephemeral storage and pending cron remain documented.

### Phase 4 builder/preview evidence — 2026-10-09

See [Phase 4 verification record](IMPLEMENTATION_PLAN.md#phase-4-verification-record): 3 focused autosave unit checks, 2 real Chromium workflows, strict build/types/lint and desktop/mobile builder review passed. M01/M02/M03/M05/M11/M29 combine current usable-builder/add/edit/title/reload/choice/delete/focus UI evidence with earlier API persistence, independent keys, immutable history and stable-slug evidence. Original deployed durability remains separately unverified under M16/M27/M38.

M04 is implemented and tested for pointer last-to-first order, cancelled keyboard sorting and move buttons; all positional permutations/published UI order remain untested. M06–M09/M17–M22/M31 stay partial: all eight preview controls work, blank required/email format/zero/false/multiline/dropdown and zero-write completion were checked, but public flow/results integration and broader validation/mobile-motion matrices are later. Theme/ending/workflow/connect placeholders and disabled payment/upload picker entries exist; not completed bonuses. No requirement advances solely because a build passed. Broader QA is deferred at the user's explicit direction.
