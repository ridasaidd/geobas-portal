# FOA RUN — GeoBas V3 Aurora Atlas Reference Implementation

You are executing a **reference-driven implementation benchmark**.

## Primary instruction
Implement the GeoBas redesign by following **`DESIGN-REFERENCE.png`** as the primary visual source of truth.

Do not treat this as an open-ended redesign. Do not fall back to the current baseline layout. Do not reinterpret the brief into a generic hero/cards page. Use the reference image as the design anchor.

## Files to read first
1. `FOA-RUN.md` (this file)
2. `AURORA-ATLAS-V3-PACKET.md`
3. `ACCEPTANCE.md`
4. `VERIFY-AND-GATE.md`
5. `DESIGN-REFERENCE.png`

## Repository / branch execution contract
- Work only on the supplied V3 retry branch/worktree.
- Do not inspect prior V1/V2 design branches.
- Do not merge or push.
- Preserve current application capabilities and security protections.

## What to implement
Match the visual language and composition of `DESIGN-REFERENCE.png` as closely as practical in a working `geobas-portal.html`.

This includes, where feasible:
- a dark, premium civic-atlas atmosphere
- gold / amber illumination and coherent color system
- elegant serif + sans typography pairing
- a strong globe-centered or spatial centerpiece
- left-side navigation / system-style framing
- supportive information/status panels
- premium regions view and premium country dossier view
- meaningful motion, subtle ambient animation, and polished transitions
- `prefers-reduced-motion` fallback

## Deliverables
- updated `geobas-portal.html`
- `DESIGN-THESIS.md`
- `review-screenshots/01-home.png`
- `review-screenshots/02-region.png`
- `review-screenshots/03-country.png`
- optional `review-screenshots/04-editor.png`

## Decomposition guidance
Suggested internal sequence:
1. Read the packet and inspect the reference image.
2. Inspect the baseline `geobas-portal.html` and identify the minimum set of preserved functional systems: nav, i18n/RTL, CKEditor, persistence, import/export, security.
3. Implement the **home/hero system** first, grounded in the reference image.
4. Implement the **regions view** so it clearly belongs to the same visual world.
5. Implement the **country dossier view** so it does not collapse back into ordinary cards.
6. Integrate motion/ambient effects and reduced-motion behavior.
7. Run regression/syntax/browser checks.
8. Produce screenshots.
9. Verify against `ACCEPTANCE.md` and `VERIFY-AND-GATE.md`.
10. Only then report terminal completion.

## Terminal protocol requirement
You **must** end with a proper terminal action:
- `kanban_complete` on success, or
- `kanban_block` with a precise reason on failure.

A clean process exit without a terminal Kanban call counts as failure.
