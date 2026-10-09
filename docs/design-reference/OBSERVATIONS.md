# Authenticated Typeform observations — 2026-10-09

Actual signed-in inspection through the Codex in-app browser: workspace, builder, preview, Workflow, Connect, Share, Results and closed public form. Private account/workspace identifiers intentionally omitted. All authored prompts/answers are synthetic. These observations supplement [official references](../../DESIGN_REFERENCE.md), not the application test suite.

## Image catalog

Requested desktop viewport: **1440×900**. Most files are the full viewport. Files 01, 18, 36 and 37 are browser-captured regions with dimensions below; public-tab image 38 actually measures 1440×810 despite the requested override. Files 25–28 show Typeform's built-in mobile frame within desktop; they are **not** 390×844 or physical-phone screenshots. Some captures reflowed the page; 18 records the resulting warning. JPEG rendering is occasionally soft; use DOM measurements/live inspection for precise comparisons.

| Image | Actual state and purpose |
|---|---|
| [01 Workspace empty](01-workspace-empty-desktop.jpg) | 1440×836, header omitted, rail collapsed. Empty CTA, list/grid controls. |
| [02 Creation error](02-create-form-error.jpg) | Actual error/Refresh page state; refreshing recovered. |
| [03 Creation start](03-new-form-start.jpg) | AI start page; Start from scratch used. AI/CRM out of scope. |
| [04 Question picker](04-question-picker.jpg) | Categorized picker; pink contact, purple choice, blue text, green rating, yellow other badges. |
| [05 Rename dialog](05-rename-dialog.jpg) | Centered modal; unchanged name disables Save. Rename verified afterward. |
| [06 Short text](06-builder-short-text.jpg) | Independent question, description, required on, max characters 999. |
| [07 Long text](07-builder-long-text.jpg) | Selected child in question group; optional, Shift+Enter hint, type settings. Unselected content fades. |
| [08 Mode menu](08-builder-mode-menu.jpg) | Universal/lead qualification/knowledge quiz/match quiz; not a page-layout selector. |
| [09 Question actions](09-question-actions.jpg) | Move up/down, Duplicate, Delete. Move up performed; duplicate/delete not executed. |
| [10 Email](10-builder-email.jpg) | Required email; format-validation explanation/settings. |
| [11 Multiple choice](11-builder-multiple-choice.jpg) | Three synthetic options, required, vertical layout; optional settings displayed. |
| [12 Dropdown choices dialog](12-dropdown-choices-dialog.jpg) | One choice per line. Three choices saved and count verified. |
| [13 Dropdown](13-builder-dropdown.jpg) | Underlined control, Edit choices, 3 options; randomize/alphabetical settings. |
| [14 Number](14-builder-number.jpg) | Underlined answer; Min/Max toggles. Bounds not configured. |
| [15 Yes/no](15-builder-yes-no.jpg) | Y/N tiles, simple required settings. |
| [16 Rating](16-builder-rating.jpg) | Five stars; initial 3 changed to 5. Range menu offers 1–10. |
| [17 Theme font panel](17-theme-font-panel.jpg) | Logo/Font/Buttons/Background tabs; font/color/size/alignment controls. Temporary theme discarded. |
| [18 Creator small-screen warning](18-creator-small-screen-warning.jpg) | 960×590 region; capture reflow triggered larger-screen warning over settings. Not a general-settings image. |
| [19 Ending editor](19-ending-editor.jpg) | Inline ending prompt; social/button controls. Only sample text changed. |
| [20 Desktop preview](20-preview-desktop.jpg) | First page has two inputs because Typeform permits groups. Clone remains one question per page. |
| [21 Required error](21-preview-required-error.jpg) | Please fill this in; focused underline and pink warning. |
| [22 Email error](22-preview-email-error.jpg) | Synthetic invalid string: Hmm... that email doesn't look right. |
| [23 Desktop choices](23-preview-choice-desktop.jpg) | Letter badges, large tiles, OK, top progress, bottom-right arrows. |
| [24 Respondent dropdown](24-preview-dropdown.jpg) | Open searchable list; Engineering selected afterward. |
| [25 Mobile preview](25-preview-mobile-frame.jpg) | Built-in frame, grouped text page, bottom full-width OK. |
| [26 Mobile choices](26-preview-choice-mobile-frame.jpg) | Built-in frame, stacked tiles, previous button/bottom OK. |
| [27 Mobile rating](27-preview-rating-mobile-frame.jpg) | Final rating, explicit Submit. Hover fill shown; selection verified separately. |
| [28 Preview ending](28-preview-thank-you-mobile-frame.jpg) | After synthetic rating 4; sample thank-you/social icons/Typeform CTA. |
| [29 After pointer drag](29-builder-after-drag.jpg) | Dropdown above Multiple Choice, number 4→3; sidebar/canvas agree. |
| [30 Workflow](30-workflow.jpg) | Horizontal flow, logic/quiz tabs and action panel. No rules changed. |
| [31 Connect](31-connect-catalogue.jpg) | Integration rail/search/cards. No connection created. |
| [32 Share](32-share-page.jpg) | Link field/preview/embed cards; original Share immediately published. Link not distributed. |
| [33 Empty responses](33-results-empty-responses.jpg) | No responses after preview. Test-response generator not used. |
| [34 Empty summary](34-results-empty-summary.jpg) | Question cards, zero counts, waiting states, count/percentage/filter controls. |
| [35 Closure settings](35-form-closed-settings.jpg) | User-approved Publish edits applied: closed message, open switch off. |
| [36 Workspace actions](36-workspace-actions.jpg) | 1440×780, header omitted; list/rail/menu. Upper menu clipped; full menu read through DOM. |
| [37 Workspace grid](37-workspace-grid.jpg) | 1440×780, header omitted; grid selected, sample card, rail. |
| [38 Closed public form](38-public-closed.jpg) | Actual 1440×810; independently confirms This typeform is now closed. No public submission made. |

## Observed visual details

- Rounded pale panels separated by white gutters: header, left question list/Endings, central toolbar/canvas, right stacked Question/Answer/Logic/Comments settings. Side panels approximately 256px each at the inspected desktop; screenshot observation, not a universal fixed contract.
- Read-only computed-style measurement of initial short-question canvas prompt: **Inter, sans-serif; 26px; line-height 34px; rgb(42,34,43)**. One canvas state, not all product text. No font downloaded from Typeform.
- Dark plum primary actions and muted gray input underlines are the observed default sample style. Temporary unsaved theme preview changed accents to blue and was discarded. Clone's existing blue accent is a chosen variant, not measured original default.
- Choice tiles have small outlined letter badges; required prompts use asterisks; errors use pale pink inline labels/icons. Not all hover/focus states measured.
- Picker is a wide centered multi-column dialog; rename/dropdown dialogs are narrower with subdued Cancel and emphasized Save. Compact action menus have separators and red Delete.
- Desktop preview has bounded central surface, thin top progress and bottom-right arrows/branding. Mobile frame has wrapping content and bottom previous/action controls.
- Results retains header plus Smart Insights/Form performance/Response summary/Responses tabs. Baseline clone needs only required Responses/Summary; do not invent analytics.

## Interactions actually performed

Created/renamed one synthetic form; added all eight types; edited prompts, description, required/max-character settings and choices; changed rating range; menu-moved Long Text up; pointer-dragged Dropdown above Multiple Choice and verified numbering/order. Navigation/reopening preserved the definition/order. This observes Typeform, not clone persistence.

Preview: required blank blocked; invalid email blocked by Enter; valid synthetic email advanced with Enter; choices selected/advanced; dropdown opened/selected; optional dropdown skipped in a later preview; number **0** accepted; **No** accepted; rating **4** chosen; final explicit Submit led to ending. Results then showed no responses. Immediate DOM snapshots sometimes included offscreen adjacent questions/unfinished transitions; screenshot/fresh AX state established active state. Letter-shortcut attempt inconclusive. Escape with dropdown open closed the entire preview; do not claim dropdown-only dismissal matches our contract.

Inspected theme controls then discarded temporary theme. General display controls (arrows, progress, numbering, asterisks, letters) read without saving changes; screenshot omitted because notification email appeared. Workflow/Connect inspected without configuration.

**Publication side effect/resolution:** Share immediately published the synthetic form. Open this form to new responses switched off and saved; Publish edits required to apply it. Automatic review initially rejected that action. User then explicitly approved closure; published-edits toast, closed settings and closed public page verified. The form remains **published but closed**, not an unpublished draft. Research form retained in the user's workspace, not deleted.

## Implementation consequences and open references

Use live shell as primary dashboard/builder comparison. Preserve assignment single-question runner, explicit Publish/Unpublish, versioned results, accessibility and recoverable save contract. AI/CRM/grouped pages/social sharing/advanced analytics/paid controls do not expand mandatory scope. Reference screenshots and logos are not application assets.

Uninspected: populated table/detail/charts (use R06/R07), delete confirmation, duplicate operation, keyboard drag/cancellation, complete key/IME/reduced-motion behavior, exact easing/durations, physical phone/software keyboard, all theme/paid controls. No clone requirement becomes Verified from this research.
