"""Unified canvas mutation: snapshot overwrite, style append, or incremental merge."""

from __future__ import annotations

import re

SNAPSHOT_HEADER_PREFIXES = (
    "classdiagram",
    "flowchart",
    "graph",
)

STYLE_LINE_PATTERN = re.compile(
    r"^(style\s|classdef\s|class\s+\w+\s+\w+|linkstyle\s|click\s)",
    re.IGNORECASE,
)


def normalize_canvas(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return ""
    return stripped + ("\n" if not stripped.endswith("\n") else "")


def is_snapshot_mutation(mutation: str) -> bool:
    """Solution 1: mutation is a full diagram replacement."""
    lines = [line.strip() for line in mutation.strip().splitlines() if line.strip()]
    if not lines:
        return False
    first = lines[0].lower()
    return any(first.startswith(prefix) for prefix in SNAPSHOT_HEADER_PREFIXES)


def is_style_mutation(mutation: str) -> bool:
    """Solution 3: append-only style/class overrides for existing nodes."""
    lines = [line.strip() for line in mutation.strip().splitlines() if line.strip()]
    if not lines:
        return False
    return all(STYLE_LINE_PATTERN.match(line) for line in lines)


def append_lines(canvas: str, mutation: str) -> str:
    result = canvas
    for line in mutation.strip().splitlines():
        stripped = line.strip()
        if not stripped or stripped in result:
            continue
        if result and not result.endswith("\n"):
            result += "\n"
        result += stripped + "\n"
    return result


def apply_mutation_mode(canvas: str, mutation: str) -> tuple[str, str]:
    """
    Apply mutation and return (new_canvas, mode).
    mode is one of: snapshot, style, incremental.
    """
    if not mutation or not mutation.strip():
        return canvas, "incremental"

    if is_snapshot_mutation(mutation):
        return normalize_canvas(mutation), "snapshot"

    if is_style_mutation(mutation):
        return append_lines(canvas, mutation), "style"

    return canvas, "incremental"
