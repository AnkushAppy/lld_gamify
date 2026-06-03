# Architecture

## Overview

Architecture Speedrun is a **unified JavaScript stack**: a React frontend and a Node.js/Express API. The API is stateless—it discovers quiz configs from `content/`, strips answers for game start, and validates submissions. Canvas mutations run entirely in the browser via `frontend/src/mutationEngine.js` and discipline-specific engines.

```
┌─────────────────────────────────────────────────────────┐
│              React + Vite (port 5173)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Mermaid      │  │ Question     │  │ Meters /      │  │
│  │ Canvas       │  │ Panel        │  │ Score         │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
│         Client-side mutation engine (snapshot/style/inc)  │
└───────────────────────────┬─────────────────────────────┘
                            │ /api (proxied in dev)
                            ▼
┌─────────────────────────────────────────────────────────┐
│           Express API (port 8001)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Track        │  │ Config       │  │ Answer        │  │
│  │ Discovery    │  │ Sanitizer    │  │ Validator     │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │ Reads
                            ▼
              ┌─────────────────────────────┐
              │  content/{lld,hld,clean_code}/ │
              │    <system_id>/quiz_config.json │
              └─────────────────────────────┘
```

## Components

### React Frontend

- **Game screens** per discipline: `LldGameScreen`, `HldGameScreen`, `CleanCodeGameScreen`.
- **Canvas state** held in React; each correct answer applies `uml_mutation` client-side.
- **Mutation modes:** snapshot (full diagram replace), style (append overrides), incremental (append/merge).
- **Scoring:** LLD uses points; HLD uses health meters; Clean Code uses decoupling score.

### Express API (`server/`)

- **`GET /api/systems`** — list tracks from `tracks.json` + filesystem discovery.
- **`GET /api/game/start/{system_id}`** — sanitized config (no answers or mutations exposed).
- **`POST /api/game/validate`** — compare selected answer; return explanation, mutation, and discipline-specific impacts.
- **`GET /api/config/{system_id}`** — full config for authoring/debug.

Config is cached in memory after first load; restart the API to pick up JSON edits.

## Canvas Mutations (Client)

Each session starts from `initial_canvas` on the config or level. On correct validation:

1. Frontend receives `uml_mutation` from the API response.
2. Mutation engine applies it to local canvas state.
3. Mermaid re-renders the diagram.

Incorrect answers do not change the canvas.

### Mutation Types

| Mode | When | Behavior |
|------|------|----------|
| **Snapshot** | Mutation starts with `classDiagram`, `flowchart`, or `graph` | Replace entire canvas |
| **Style** | Only `style`, `classDef`, or class styling lines | Append visual overrides |
| **Incremental** | Default | Append classes, edges, or merge class blocks |

## Disciplines

| Discipline | Canvas | Validate extras |
|------------|--------|-----------------|
| `lld` | `classDiagram` | Score only (frontend) |
| `hld` | `flowchart TD` | `health_impact` |
| `clean_code` | `classDiagram` | `coupling_impact` |

Discipline is read from `quiz_config.json` or inferred from the folder path (`content/clean_code/...`).

## Design Principles

1. **Constructive learning.** The diagram evolves with every correct answer.
2. **Data-driven first.** New tracks are JSON under `content/`—no API code changes.
3. **Stateless API.** No sessions; frontend owns game progress.
4. **Zero asset dependency.** Mermaid strings replace static UML images.

See [quiz-config-schema.md](quiz-config-schema.md) for the JSON contract.
