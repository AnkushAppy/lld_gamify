# LLD Speedrun Gamifier (Blueprint Assembly Edition)

An interactive, browser-based pedagogical tool that teaches low-level system design in 10–15 minutes. Instead of studying static architecture documents, players **construct a UML diagram from a blank canvas**—each correct answer injects classes, attributes, visibility modifiers, and relationships into a live-updating Mermaid diagram.

## Goals

- **Constructive learning:** Shift users from passive observer to active architect; the UML diagram is the reward for passing a question.
- **Skill-driven progression:** Every question isolates and assesses a distinct LLD competency (Encapsulation, State Modeling, Multiplicity, etc.).
- **Zero asset dependency:** No pre-cropped images—diagrams are generated dynamically via Mermaid.js from accumulated session state.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | [Gradio](https://gradio.app/) (`gr.Markdown` for live Mermaid rendering) |
| Backend API | [FastAPI](https://fastapi.tiangolo.com/) (session state, validation, canvas mutations) |
| Diagram rendering | [Mermaid.js](https://mermaid.js.org/) (text-to-diagram in the browser) |
| Data validation | Pydantic + JSON config files |

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements and Blueprint Assembly journey |
| [Architecture](docs/architecture.md) | Canvas accumulator, mutation engine, and API design |
| [Content Structure](docs/content-structure.md) | Folder layout for LLD system packs |
| [Quiz Config Schema](docs/quiz-config-schema.md) | JSON schema with `uml_mutation` and `skill_tag` |
| [UML → Quiz Pipeline](docs/uml-to-quiz-pipeline.md) | LLM prompt and script to reverse-engineer UML into JSON |

## Planned Project Structure

```
lld_gamify/
├── docs/                    # Documentation
├── scripts/                 # Content authoring utilities
│   └── generate_skeleton_config.py
├── backend/                 # FastAPI engine (upcoming)
├── frontend/                # Gradio UI (upcoming)
└── content/                 # LLD system packs (upcoming)
    └── parking_lot/
        └── quiz_config.json # Questions + uml_mutation instructions
```

## Blueprint Assembly Journey

```
Start Game
    │
    ▼
Question 1: Define Entity  ──(correct)──> Canvas adds: class ParkingTicket
    │
    ▼
Question 2: Access Control ──(correct)──> Canvas adds: - LocalDateTime issuedAt
    │
    ▼
Level Complete             ──(final)───> Fully rendered system model
```

## Out of Scope (MVP)

- Backward deletions (no rolling back past correct answers)
- Manual Mermaid or code editing by the user
- User authentication or persistent accounts
- Leaderboards

See [PRD §7](docs/PRD.md#7-scope-boundaries-out-of-scope-for-mvp) for full scope boundaries.

## Status

**Phase 1 — Documentation.** Implementation has not started yet.
