#!/usr/bin/env python3
"""
Scaffold a quiz_config.json skeleton from a raw Mermaid class diagram.

Each non-empty line (after classDiagram) becomes a placeholder question
with the uml_mutation pre-filled. Fill in skill_tag, text, choices,
and explanations manually or via the LLM prompt in docs/uml-to-quiz-pipeline.md.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


DEMO_MERMAID = [
    "classDiagram",
    "class ParkingTicket {",
    "    -String ticketId",
    "}",
    "class TicketStatus {",
    "    <<enumeration>>",
    "    ACTIVE",
    "    EXPIRED",
    "}",
    "ParkingTicket --> TicketStatus",
]


def parse_mermaid_lines(raw_lines: list[str]) -> list[str]:
    """Split Mermaid input into mutation chunks (one per class block or relationship)."""
    chunks: list[str] = []
    buffer: list[str] = []
    brace_depth = 0

    for line in raw_lines:
        stripped = line.strip()
        if stripped in ("classDiagram", ""):
            continue

        buffer.append(line)
        brace_depth += line.count("{") - line.count("}")

        # Complete class block or standalone relationship/enum line
        if brace_depth == 0 and buffer:
            chunk = "\n".join(buffer)
            if not chunk.endswith("\n"):
                chunk += "\n"
            chunks.append(chunk)
            buffer = []

    if buffer:
        chunk = "\n".join(buffer)
        if not chunk.endswith("\n"):
            chunk += "\n"
        chunks.append(chunk)

    return chunks


def generate_skeleton_config(system_id: str, title: str, mermaid_lines: list[str]) -> dict:
    """
    Scaffold a raw skeleton JSON where you or an LLM can fill in
    questions around the actual mutations.
    """
    config: dict = {
        "system_id": system_id,
        "system_title": title,
        "levels": [],
    }

    current_level: dict = {
        "level_index": 1,
        "title": "Level 1: Initialization",
        "questions": [],
    }

    q_counter = 1
    for chunk in parse_mermaid_lines(mermaid_lines):
        preview = chunk.strip().split("\n")[0][:60]
        question = {
            "question_id": f"l1_q{q_counter}",
            "skill_tag": "Pending Extraction",
            "type": "radio",
            "text": f"Placeholder question for injecting: {preview}",
            "choices": ["Correct Option", "Wrong Option A", "Wrong Option B"],
            "correct_answer": "Correct Option",
            "explanation": "Add context here.",
            "uml_mutation": chunk,
        }
        current_level["questions"].append(question)
        q_counter += 1

    config["levels"].append(current_level)
    return config


def load_mermaid_file(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate quiz_config.json skeleton from Mermaid class diagram lines."
    )
    parser.add_argument("--system-id", required=True, help="system_id for the config")
    parser.add_argument("--title", required=True, help="Human-readable system title")
    parser.add_argument("--input", type=Path, help="Path to .mmd or Mermaid text file")
    parser.add_argument("--output", type=Path, help="Write JSON to this path (default: stdout)")
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Use built-in ParkingTicket example instead of --input",
    )
    args = parser.parse_args()

    if args.demo:
        lines = DEMO_MERMAID
    elif args.input:
        if not args.input.exists():
            print(f"Error: file not found: {args.input}", file=sys.stderr)
            return 1
        lines = load_mermaid_file(args.input)
    else:
        print("Error: provide --input or --demo", file=sys.stderr)
        return 1

    config = generate_skeleton_config(args.system_id, args.title, lines)
    output = json.dumps(config, indent=2) + "\n"

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(output, encoding="utf-8")
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        print(output, end="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
