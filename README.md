# Aurora Atlas V3 Packet

This directory contains a complete Git-branch packet for a reference-driven GeoBas V3 retry.

## Contents
- `DESIGN-REFERENCE.png` — authoritative visual target
- `FOA-RUN.md` — main file FOA should execute from
- `AURORA-ATLAS-V3-PACKET.md` — design/task brief
- `ACCEPTANCE.md` — acceptance rubric
- `VERIFY-AND-GATE.md` — mechanical completion gates

## Intended use
Place these files on a fresh V3 retry branch alongside the baseline `geobas-portal.html`, then instruct FOA:

> Git pull / fetch the branch, read `FOA-RUN.md`, inspect `DESIGN-REFERENCE.png`, and execute the implementation according to the packet.
