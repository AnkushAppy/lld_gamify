"""Append flowchart mutations for HLD architecture diagrams."""

from __future__ import annotations

HLD_CANVAS_HEADER = "flowchart TD\n"
HLD_PLACEHOLDER = 'flowchart TD\n    placeholder["Answer questions to assemble the architecture"]\n'
PLACEHOLDER_NODE = 'placeholder["Answer questions to assemble the architecture"]'


def init_hld_canvas() -> str:
    return HLD_PLACEHOLDER


def apply_hld_mutation(canvas: str, mutation: str) -> str:
    if not mutation or not mutation.strip():
        return canvas

    if canvas == HLD_CANVAS_HEADER or PLACEHOLDER_NODE in canvas:
        canvas = HLD_CANVAS_HEADER

    for line in mutation.strip().splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped in canvas:
            continue
        if not canvas.endswith("\n"):
            canvas += "\n"
        canvas += stripped + "\n"

    return canvas
