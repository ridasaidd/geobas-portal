# Verification and Completion Gate

Before reporting success, verify all of the following:

## 1. Material change gate
Run a diff against the starting baseline.
Examples:
- `git diff --stat <starting-sha> -- geobas-portal.html`
- `git diff --numstat <starting-sha> -- geobas-portal.html`
- hash comparison if needed

If the file is unchanged or effectively baseline-equivalent, **do not complete**.

## 2. Reference fidelity gate
Confirm, in your final summary, which elements from `DESIGN-REFERENCE.png` were implemented, such as:
- palette
- typography
- globe/spatial centerpiece
- navigation frame
- information panels
- regions treatment
- country dossier treatment
- motion/reduced-motion behavior

## 3. Runtime / syntax / regression gate
At minimum:
- syntax/integrity checks
- regression tests
- browser smoke checks sufficient to show the design actually renders

## 4. Screenshot gate
Produce:
- `review-screenshots/01-home.png`
- `review-screenshots/02-region.png`
- `review-screenshots/03-country.png`
- optional `04-editor.png`

These must come from the changed implementation.

## 5. Final terminal action
Only after all gates pass:
- call `kanban_complete` with summary and artifact list

If blocked for any reason:
- call `kanban_block` with the exact reason and missing gate(s)
