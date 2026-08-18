# GeoBas V3 — Aurora Atlas Reference Packet

## Mission
Create a **flagship V3 GeoBas experience** that colleagues can open and say:

> “I did not expect AI to produce this.”

This must be government-credible, highly usable, and visually exceptional.

## Design source of truth
`DESIGN-REFERENCE.png` is the primary source of truth for art direction and layout ambition.

The target is not pixel-perfect cloning, but it **must** preserve the essential design language and composition:
- cinematic dark atlas atmosphere
- amber/gold lighting and accents
- disciplined, premium typography
- a spatial centerpiece (globe or equivalent)
- strong overall harmony
- rich but legible information architecture
- functional regions and country views that feel part of the same system

## Do not regress into
- the unchanged baseline
- a standard top-nav + hero + cards site
- generic glassmorphism / crypto aesthetics
- military/surveillance UI
- any design that feels like a safe simplification of the reference

## Functional requirements to preserve
Preserve the existing GeoBas capabilities:
- region / country / content navigation
- Swedish / English / Spanish / Arabic
- Arabic RTL
- CKEditor workflow
- existing persistence behavior for now
- import/export flow
- existing security / sanitization protections

Do not redesign persistence in this run.

## Visual / interaction requirements
### Home
- must create immediate “woah” factor
- should feel like a civic information instrument, not a brochure
- use a spatial centerpiece and supportive panels / navigation
- should feel alive even at rest

### Regions
- must belong to the same visual world
- must not reduce to plain generic cards unless elevated enough to feel authored
- should communicate geographic grouping and orientation

### Country
- must feel like a premium dossier / atlas page
- should not degrade into ordinary stacked cards
- should preserve readability and trust
- should include source / support information elegantly

### Motion
Where feasible implement:
- slow ambient motion
- subtle rotation / route-light activity
- light feedback on interaction
- smooth transitions
- `prefers-reduced-motion` support

### Tone / safety
- dignified
- non-sexual
- non-violent
- non-shocking
- no dark patterns
- no inaccessible spectacle

## Benchmark framing
This is a **reference implementation benchmark**.
The question is no longer “can you invent from prose?”
The question is:

> Can you implement a strong AI-generated design reference faithfully as a working government-appropriate GeoBas concept?
