"""Apply uml_mutation strings to the session canvas with Mermaid 11-safe merging."""

from __future__ import annotations

import re

CANVAS_HEADER = "classDiagram\n"
CANVAS_PLACEHOLDER = 'classDiagram\nnote "Answer questions to assemble the blueprint"\n'
PLACEHOLDER_NOTE = 'note "Answer questions to assemble the blueprint"'


def init_canvas() -> str:
    return CANVAS_PLACEHOLDER


def _normalize_empty_class(mutation: str) -> str:
    """Mermaid rejects empty braces — use bare class declaration instead."""
    return re.sub(
        r"class\s+(\w+)\s*\{\s*\}",
        r"class \1",
        mutation,
    )


def _extract_class_block(text: str) -> tuple[str, str, str] | None:
    """Return (class_name, full_block, remainder) if text starts with a class block."""
    match = re.match(r"class\s+(\w+)\s*\{", text)
    if not match:
        bare = re.match(r"class\s+(\w+)\s*(?:\n|$)", text)
        if not bare:
            return None
        name = bare.group(1)
        end = bare.end()
        block = text[:end].rstrip() + "\n"
        return name, block, text[end:].lstrip()

    name = match.group(1)
    depth = 0
    i = match.start()
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                block = text[match.start() : i + 1]
                if not block.endswith("\n"):
                    block += "\n"
                return name, block, text[i + 1 :].lstrip()
        i += 1
    return None


def _replace_or_append_class(canvas: str, class_name: str, class_block: str) -> str:
    pattern = rf"class\s+{re.escape(class_name)}\s*(?:\{{[\s\S]*?\}})?\n?"
    if re.search(pattern, canvas):
        return re.sub(pattern, class_block, canvas, count=1)
    return canvas + class_block


def _append_line(canvas: str, line: str) -> str:
    line = line.strip()
    if not line or line in canvas:
        return canvas
    return canvas + line + "\n"


def apply_mutation(canvas: str, mutation: str) -> str:
    """Merge a uml_mutation into the canvas (replace classes, append relationships)."""
    if not mutation or not mutation.strip():
        return canvas

    if canvas == CANVAS_HEADER or PLACEHOLDER_NOTE in canvas:
        canvas = CANVAS_HEADER

    remaining = _normalize_empty_class(mutation.strip())
    if not remaining.endswith("\n"):
        remaining += "\n"

    while remaining.strip():
        class_part = _extract_class_block(remaining)
        if class_part:
            name, block, remaining = class_part
            canvas = _replace_or_append_class(canvas, name, block)
            continue

        line, _, rest = remaining.partition("\n")
        line = line.strip()
        remaining = rest
        if line:
            canvas = _append_line(canvas, line)

    return canvas
