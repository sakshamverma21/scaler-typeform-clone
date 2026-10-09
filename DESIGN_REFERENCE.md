# Typeform design references and interaction contract

This document preserves the research recorded in the approved planning phase, dated **2026-10-09**. Phase 0 rechecks the assignment and persists the research; it does not claim a new authenticated Typeform inspection or an implemented interface. Read with [REQUIREMENTS.md](REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

## Reference evidence inventory

| ID | Surface and official source | Evidence recorded during planning | Implications |
|---|---|---|---|
| R01 | [Workspaces](https://help.typeform.com/hc/en-us/articles/360029612971-Workspaces) | Official documentation and dashboard screenshot inspected. | Narrow workspace rail, subdued surfaces, prominent Create form action, list/grid affordances, contextual actions. |
| R02 | [My first form](https://help.typeform.com/hc/en-us/articles/360053660271-My-first-form) | Official builder, canvas, question settings, and picker screenshots inspected. | Three-part builder; inline editing; compact colored question badges; separate Endings area. |
| R03 | [Edit your form in preview mode](https://help.typeform.com/hc/en-us/articles/360052109711-Edit-your-form-in-preview-mode) | Official preview/publishing documentation reviewed. | Autosave and publication are separate; desktop/mobile preview does not collect real responses. |
| R04 | [Customer Feedback template](https://www.typeform.com/templates/customer-feedback) | Live template opened; desktop and 390×844 viewport screenshots inspected, including welcome/contact/multiple-choice states. | Large prompts, generous whitespace, lettered choice tiles, restrained navigation, mobile bottom action placement. |
| R05 | [Keyboard shortcuts](https://help.typeform.com/hc/en-us/articles/4410017947412-Keyboard-shortcuts-and-text-formatting-in-Typeform) and [navigation arrows](https://help.typeform.com/hc/en-us/articles/360053850492-Navigation-arrows) | Official behavior documentation reviewed. | Visible shortcuts, normal Tab interaction, letter choices, navigation controls. |
| R06 | [Working with responses](https://help.typeform.com/hc/en-us/articles/360029253732-Working-with-your-responses) | Official table and individual-response screenshots inspected. | Compact table, count in navigation, expandable ordered answer detail. |
| R07 | [Response summary](https://help.typeform.com/hc/en-us/articles/360029577071-Your-Response-summary) | Official summary screenshot and documentation inspected. | Per-question cards, answered counts, categorical distributions, numerical summaries. |
| R08 | [Question types](https://help.typeform.com/hc/en-us/articles/360051789692-Question-types), [Multiple Choice](https://help.typeform.com/hc/en-us/articles/360052409312-Multiple-Choice-question), [Dropdown](https://help.typeform.com/hc/en-us/articles/360037943011-Dropdown-question), [Rating](https://help.typeform.com/hc/en-us/articles/360052870831-Rating-question) | Official behavior references used to refine type contracts. | Required assignment scope is the eight types; default ranges and limits remain explicit project choices. |

Direct official image references from the planning inventory, useful for later side-by-side review:

- [Workspace screenshot](https://help.typeform.com/hc/article_attachments/51096488298644).
- [Builder screenshot](https://help.typeform.com/hc/article_attachments/51096488309780).
- [Question picker screenshot](https://help.typeform.com/hc/article_attachments/26831927370004).
- [Rename dialog screenshot](https://help.typeform.com/hc/article_attachments/36576960989460).
- [Responses table screenshot](https://help.typeform.com/hc/article_attachments/52768859276820).
- [Individual response screenshot](https://help.typeform.com/hc/article_attachments/38145132864276).
- [Summary screenshot](https://help.typeform.com/hc/article_attachments/52737273227796).

These are reference links, not copied product assets or a local screenshot archive. If an attachment moves, use its official parent article and record the replacement. Do not substitute screenshots from existing clone repositories.

## Evidence limitations

- No authenticated creator account was operated. Official screenshots are evidence for creator layout, not proof of measured live drag/hover behavior.
- Exact creator font, spacing measurements, animation timing, and authenticated hover states were not established.
- The live template inspection did not cover all eight input types or all validation states. No real response was intentionally submitted as part of research.
- Mobile evidence used viewport emulation; a physical phone and software keyboard still require manual testing.
- Help-center images span several interface generations. Use the newer rounded-panel workspace/builder shell as the primary direction; do not mix incompatible shells.
- Typeform currently offers additional flows, including multiple questions per page. Those do not override the assignment's one-question-at-a-time requirement.
- The assignment asks for exact original look/feel. Font/timing approximations must remain documented until improved; do not call the result pixel-perfect without evidence.

## Visual foundation

The following are **initial implementation tokens**, not claimed measurements of Typeform. Refine them by comparison without fragmenting styles between screens.

| Category | Initial direction |
|---|---|
| Creator surfaces | White and pale neutral panels; near-black primary text; muted secondary labels; fine neutral borders; dark primary action. |
| Typography | Self-hosted Inter initially; creator body 14 px, metadata 12 px, page heading 24 px. Verify font licensing and attribution when adding assets. |
| Respondent prompts | Approximately 28–32 px desktop and 22–24 px mobile, comfortable line spacing and readable measure. |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 px scale. |
| Corners and elevation | Restrained 6–12 px radii; shadows primarily on menus, dialogs, dragged items. |
| Icons | One consistent outline family; colored question-type badges, not inconsistent emoji icons. |
| Respondent color | Neutral background, blue answer/action accent; themed seeds only when B02 is actually verified. |
| States | Explicit hover, active, focus-visible, selected, disabled, error, and loading tokens. No color-only indication of selection/errors. |

Define semantic CSS variables centrally. Accessible primitives need custom styling to match the reference. Avoid introducing a new accent, card shape, or spacing system for each feature.

## Workspace

Use a narrow workspace rail, top application navigation, workspace title, a prominent Create form action, and a forms list. Default to list view; a simple grid toggle, search, and sorting are approved small improvements rather than assignment mandates.

Each form shows title, draft/published status, completed-response count, updated time, and a contextual action menu. Rows/cards lead to the builder without making the menu impossible to use by keyboard. Create, rename, duplicate, and delete use truthful success/failure feedback.

Design first-visit synthetic samples, an empty workspace after samples are deleted, loading skeletons with stable layout, retryable list errors, and keyboard-operable menus. Explain the browser-specific workspace without exposing implementation details in ordinary flows.

## Builder

Desktop starting proportions: approximately 240 px question navigation, flexible canvas, and 280 px settings panel. Verify against reference at the target viewport rather than treating these as exact product measurements.

- Header: breadcrumb/editable title, Content, Workflow, Connect, Share, Results destinations.
- Toolbar: Add content, Design, desktop/mobile preview controls, interactive preview play action.
- Left pane: ordered question rows with type badge, number, selected state, drag handle, contextual actions; distinct Endings area.
- Canvas: inline prompt, description, and applicable option editing, generous whitespace, clear question hierarchy.
- Right pane: required toggle and type-specific settings, including rating maximum.
- Save status remains visible: Unsaved, Saving, Saved, Save failed. Errors are not transient toast-only events.
- Default ending functions. Theme and ending customization are clearly labeled placeholders until implemented; no misleading active customization controls.

Dragging must have an obvious handle and target indication, retain a clear selected question, and support cancellation and keyboard reordering. Prevent text editing from initiating a drag. After delete, choose a sensible adjacent selection; an empty builder has a clear Add question action. Selection and numbering follow stable keys rather than array-index identity.

On narrow screens, show one main pane with Questions and Settings drawers. Do not compress all three desktop columns into the phone viewport. Inline edits must preserve cursor/focus across local updates and server acknowledgements.

## Public respondent and preview

Use a full-viewport shell without creator chrome and a bounded readable question column. One question is active at a time. Desktop text inputs use lightweight underlines and prominent answer text; large choice tiles carry letter badges and clear selected states.

Provide previous/next controls, visible keyboard hints, answered-progress indicator, and question position. Mobile choices span available width; bottom actions respect safe areas and the virtual keyboard. Long prompts/answers must scroll without hiding validation or submission controls.

Preview uses this same presentation and validation, receives current draft data, and never persists responses. Desktop/mobile preview controls show representative viewport sizes; they do not replace testing real responsive layouts. Preview completion must clearly remain a preview rather than falsely implying data was collected.

## Results

Responses and Response summary tabs use a compact, readable layout. Responses show time/version and a preview; version filtering enables stable question columns. Individual detail opens in a side panel on desktop and a full-screen sheet on mobile. Preserve original question order, labels, skipped values, and typed formatting.

Summary uses question cards with textual sample sizes, answered/skipped counts, and accessible horizontal bars. Show numeric mean/min/max and rating distribution only when data supports them. Empty results invite a public submission, not fabricated analytics. Seed data is labeled. Summary version and denominator must be visible.

## Interaction contract

1. Animate question changes with directional vertical movement and opacity, initially around 220–280 ms. These durations are proposed, not measured.
2. Respect reduced motion: remove spatial movement and preserve focus. Focus the active question/answer appropriately without breaking screen-reader context.
3. Lock navigation during transitions or otherwise guarantee that repeated keydown events cannot skip multiple questions accidentally.
4. Preserve IME composition, text cursor movement, selection, dropdown, radio-group, and native editing behavior. Events belong first to the active widget.
5. Desktop Enter validates and advances; Shift+Enter inserts long-text newlines. Test mobile text entry separately and retain an explicit action button.
6. Arrow keys navigate questions only when a focused input/widget does not own the key. Tab remains normal focus navigation.
7. Letter shortcuts select choices only outside editable text fields. Rating and dropdown controls retain their own documented keyboard behavior.
8. Selecting the final answer does not automatically submit. Submission is explicit; thank-you follows server acknowledgement.
9. Back navigation retains answers. Optional fields may be skipped. Answered progress and position are separate; successful submission displays completion even if optional questions were skipped.
10. Dialogs trap focus, support Escape when appropriate, and restore focus to the trigger. Destructive confirmation initially focuses the safe action.
11. Show question-specific errors inline with appropriate announcement. Toasts supplement persistent feedback; never hide save/submission failure behind a disappearing message.
12. Copy-link feedback must depend on actual clipboard success, with a usable fallback if permissions fail. Disabled or Coming soon controls must not report success.

## Visual acceptance process

Review each main surface during its implementation phase, not just at release. Match reference viewport and UI state before comparison. Record the reference, application route, viewport, data state, findings, and resolution.

| Surface | Compare | Important failure states |
|---|---|---|
| Workspace | Rail/header proportions, density, typography, primary action, row/menu alignment | No forms, long titles, loading, failed request. |
| Builder | Three-pane hierarchy, canvas scale, row badges, toolbar, settings and endings | Empty form, long prompt/options, active drag, failed save, conflict. |
| Respondent | Prompt/input scale, whitespace, choice styling, progress/nav/action placement | Invalid answer, long content, mobile keyboard, submission retry, unavailable link. |
| Dialogs | Width, radius, overlay, spacing, button hierarchy, focus ring | Validation, pending destructive action, cancellation/focus restoration. |
| Results | Table/card density, detail hierarchy, chart labels and sample size | No responses, skipped answers, mixed versions, loading/error, long answers. |

Test widths 360, 390, 768, 1280, and 1440 px and 200% zoom. Review horizontal overflow, touch targets, focus visibility, contrast, reduced motion, and keyboard-only completion. Physically test at least one phone's software keyboard before release.

Review animations in motion separately from screenshots. Establish deterministic screenshots only after manual acceptance, then use them for regressions. Do not approve new baselines merely to silence diffs. [Playwright screenshot comparisons](https://playwright.dev/docs/test-snapshots).

Every unresolved mismatch should have severity, affected requirement, and disposition. Mandatory release requires no obvious layout/focus defects, no unsupported control disguised as functional, and no unacknowledged limitation in the fidelity claim.

## Phase 1 local visual review

On 2026-10-09, actual browser-test screenshots of the implemented empty workspace were viewed at 390×900 and 1440×900. The shared neutral surfaces, typography, spacing, rounded panels, primary action hierarchy, and narrow desktop rail follow the approved direction. Mobile uses a horizontal workspace strip and one main pane; no horizontal overflow was found at the five tested widths. Dialog focus containment, Escape, and focus return passed browser/component checks.

This is a foundation review, not a claim that the full Typeform interface or all creator/respondent interactions have been recreated. Create form is visibly disabled/Coming soon; no fake form cards or analytics are shown. Original font/timing measurement, full builder/results comparisons, physical-phone behavior, and final visual regression acceptance remain pending their feature phases. Images from test runs are ignored artifacts; the planning reference inventory above is unchanged.
