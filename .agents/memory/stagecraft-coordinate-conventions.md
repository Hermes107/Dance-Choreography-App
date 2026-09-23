---
name: Stagecraft coordinate conventions
description: Durable coordinate and interaction conventions for the choreography planner.
---

Stagecraft stage positions use pixel coordinates in the project’s stage space, not normalized fractions.

**Why:** A normalized seed value was rendered at the stage corner because the canvas and API otherwise expected pixel coordinates.

**How to apply:** Keep API positions, grid snapping, SVG paths, and pointer conversion in the same pixel coordinate system; convert to percentages only at render time.