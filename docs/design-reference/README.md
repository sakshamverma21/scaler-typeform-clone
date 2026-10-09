# Typeform screenshot capture index

Linked from [DESIGN_REFERENCE.md](../../DESIGN_REFERENCE.md). This folder is for actual, privacy-reviewed Typeform UI reference screenshots and their observation notes, not application assets or generated mockups.

**2026-10-09 status: no screenshots captured.** The user authorized signed-in Chrome inspection and supplied the exact workspace tab. Both browser and native computer-use initialization failed before access with a kernel-assets path error. Reset/retry did not resolve it. Authorization is already present; tool availability is the missing prerequisite. Do not infer UI details from these pending entries.

## Pending captures

| ID | Screen/state to inspect | Requirements | Status |
|---|---|---|---|
| C01 | Workspace overview, list/grid, form menu | M10–M13, M28 | Pending |
| C02 | Create/rename dialogs and delete confirmation, without completing destructive actions | M01, M11, M13, M29 | Pending |
| C03 | Builder overview: header, question list, canvas, settings, endings | M02–M09, M28 | Pending |
| C04 | Question picker, eight required types, permitted placeholder destinations | M06, M31, P01–P04 | Pending |
| C05 | Each required type's canvas/settings; required toggle, description and option editor | M03, M06–M08 | Pending |
| C06 | Reorder affordances and observed pointer/keyboard interaction, only in a user-approved disposable form | M04 | Pending |
| C07 | Preview desktop/mobile, input/validation/back navigation | M09, M17–M21 | Pending |
| C08 | Share/publish settings and link affordances, without publishing/unpublishing a real form | M14–M15 | Pending |
| C09 | Responses table/detail and summary using empty or explicitly synthetic data only | M24–M26 | Pending |
| C10 | Respondent controls, progress, transition sequence, keyboard hints and default ending in nonpersisting preview | M17–M22 | Pending |

## Capture procedure

1. Use the already authorized Typeform tab. Inspect relevant controls; do not alter billing, account settings, integrations, or real forms/responses. Obtain a disposable sample context before mutations. Do not click every account button indiscriminately.
2. Record actual viewport and screen state. Prefer matching 1440×900 and 390×844 comparisons when the supported browser tools permit those viewports; never label an unmeasured viewport as exact.
3. Before saving, check the image for account email/name, private workspace/form content, respondent answers, tokens and other sensitive data. Capture a clean sample context or omit the image. Do not commit private account identifiers. Preview must not send a real submission.
4. Save each actual image here with a descriptive name such as `c03-builder-desktop.png`. Add its Markdown link only after the file exists and has been visually inspected. If privacy requires cropping/redaction, record it; do not treat modified areas as design evidence.
5. For each capture record date, public reference/source surface (no private account URL), measured viewport, form/sample state, observed layout/interactions, limitations, and the related requirement IDs. Distinguish measured values from proposed approximations.
6. Observe motion, keyboard ownership, focus, hover and drag separately; a static screenshot cannot verify those behaviors. Never claim an interaction was inspected unless it was actually performed safely.
7. Update C01–C10 and DESIGN_REFERENCE.md with evidence. If a destination is inaccessible, keep it Pending with the reason and retain its official help reference.

Reference images guide our own implementation. They are not copied Typeform product assets shipped in the application, and they do not establish endorsement or permission to reuse proprietary fonts/code.
