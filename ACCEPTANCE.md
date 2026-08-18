# Acceptance Criteria — Aurora Atlas V3 Reference Implementation

## Automatic fail conditions
Any one of the following is an automatic fail:
1. `geobas-portal.html` is byte-identical to the starting baseline.
2. The resulting layout is materially baseline-equivalent despite superficial restyling.
3. The worker reports completion without a terminal Kanban call.
4. Required screenshots are missing without a concrete blocking reason.
5. The result obviously ignores `DESIGN-REFERENCE.png`.

## Must-pass requirements
- `geobas-portal.html` changed materially from baseline.
- Result visibly reflects the design language of `DESIGN-REFERENCE.png`.
- Home, regions, and country views all belong to one coherent system.
- Existing functionality remains intact enough to pass regression/smoke checks.
- Reduced-motion behavior exists.
- Government tone is preserved.

## Scoring rubric
### 1. Woah factor (20)
Does the first view feel impressive and memorable?

### 2. Fidelity to reference (20)
Does the implementation clearly track the reference image’s atmosphere, hierarchy, and composition?

### 3. Originality / product identity (15)
Does it feel like a distinctive product rather than a generic web page?

### 4. Coherence / art direction (15)
Do color, typography, layout, motion, and panels feel authored together?

### 5. Country experience quality (10)
Is the country view as carefully designed as the homepage?

### 6. Government usability (10)
Is it clear, legible, and credible for a government audience?

### 7. Technical execution (5)
Do checks pass and does the design behave like a functioning app?

### 8. Accessibility / reduced motion (5)
Does the app remain understandable with reduced motion?
