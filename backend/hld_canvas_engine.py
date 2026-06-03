"""Apply flowchart mutations for HLD architecture diagrams."""

from __future__ import annotations

from backend.mutation_engine import apply_mutation_mode, append_lines

HLD_CANVAS_HEADER = "flowchart TD\n"
HLD_PLACEHOLDER = 'flowchart TD\n    placeholder["Start"]\n'
PLACEHOLDER_NODE = 'placeholder["Start"]'


def init_hld_canvas() -> str:
    return HLD_PLACEHOLDER


def _apply_incremental(canvas: str, mutation: str) -> str:
    if canvas == HLD_CANVAS_HEADER or PLACEHOLDER_NODE in canvas:
        canvas = HLD_CANVAS_HEADER
    return append_lines(canvas, mutation)


def apply_hld_mutation(canvas: str, mutation: str) -> str:
    if not mutation or not mutation.strip():
        return canvas

    next_canvas, mode = apply_mutation_mode(canvas, mutation)
    if mode in ("snapshot", "style"):
        return next_canvas

    return _apply_incremental(canvas, mutation)
