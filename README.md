# Architecture Speedrun

An interactive browser game for **Low-Level Design (LLD)**, **High-Level Design (HLD)**, and **Clean Code** practice. Answer questions and watch a live diagram evolve — class diagrams for LLD and Clean Code, infrastructure flowcharts for HLD.

Each track takes about 10–15 minutes and trains a different muscle: object modeling in LLD, distributed systems in HLD, and refactoring principles (SOLID, KISS, YAGNI) in Clean Code.

## Features

### Three disciplines, one engine

| | **LLD** | **HLD** | **Clean Code** |
|---|---------|---------|----------------|
| Canvas | Mermaid `classDiagram` | Mermaid `flowchart TD` | Mermaid `classDiagram` (dependency graph) |
| Focus | Domain entities, GoF patterns | Load balancers, caches, queues | Coupling, SRP, OCP, KISS, YAGNI |
| Progress | Score (points per answer) | Health meters (HA, latency, cost) | Coupling meter (tangled → decoupled) |
| Victory | Validated class diagram | Chaos simulation stress test | Refactoring validated |

Pick a discipline on the home screen, then choose a system track.

### Question types

- **Radio** — single correct answer (classic LLD and HLD questions)
- **Checkbox** — multiple correct answers; exact set match required (common in HLD where resilience needs several components)

### HLD-specific UX

- **Health meters** update as you place infrastructure components
- **Chaos simulation** runs when you finish a track — simulates traffic spikes and shows whether your architecture survives

### Clean Code UX

- **Coupling meter** starts at "Dangerously Tangled" and improves as you extract classes and introduce interfaces
- **Snapshot refactors** replace the entire dependency graph each step — ideal for evolution-style tracks

### Blueprint Assembly

Correct answers append `uml_mutation` snippets to the canvas. The same JSON-driven engine powers both disciplines; only the diagram type and scoring model change.

## Available tracks

**LLD** (`content/lld/`)

| Track | Topics |
|-------|--------|
| Parking Lot | Encapsulation, composition, strategy |
| Coupon Service | Strategy, chain of responsibility, facade |
| Feature Flag | Composite, observer, facade |
| Splitwise | Expense splits, balance sheets, validation |
| Elevator Dispatcher | State, request queues, hardware wrappers |

**HLD** (`content/hld/`)

| Track | Topics |
|-------|--------|
| URL Shortener | CDN, caching, Kafka, sharding |
| Taxi Booking | WebSockets, geospatial indexing, surge pricing |
| Legacy Taxi → Cloud-Native | Monolith migration, async decoupling, DLQ |

**Clean Code** (`content/clean_code/`)

| Track | Topics |
|-------|--------|
| SOLID Mastery | SRP extraction, OCP polymorphism, KISS, YAGNI |
| Polymorphism & Abstraction | Conditionals, overloading, LSP, strategy factory & DI |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Mermaid.js |
| Backend | Node.js, Express (stateless validation) |
| Content | JSON quiz configs per track |

## Project structure

```
lld_gamify/
├── package.json             # Root scripts (dev API + frontend)
├── server/
│   ├── index.js             # Express REST API
│   └── lib/                 # Config discovery, validation
├── frontend/src/
│   ├── components/
│   │   ├── ModeSelector.jsx # LLD / HLD / Clean Code fork
│   │   ├── LldGameScreen.jsx
│   │   ├── HldGameScreen.jsx
│   │   └── CleanCodeGameScreen.jsx
│   └── canvasEngine.js      # Client-side LLD mutations
├── content/
│   ├── lld/
│   ├── hld/
│   └── clean_code/
├── docs/                    # PRD, schema, architecture
└── scripts/                 # Content authoring utilities
```

## Quick start

From the project root:

```bash
npm install
cd frontend && npm install && cd ..
npm run dev
```

This starts the **Node.js API** on port 8001 and the **Vite frontend** on port 5173.

Run them separately if you prefer:

```bash
npm run dev:api    # API only → http://127.0.0.1:8001
npm run dev:web    # UI only  → http://127.0.0.1:5173
```

Game UI: http://127.0.0.1:5173/ — Vite proxies `/api` to the backend on port 8001.

Port 8001 is the default because 8000 is often taken (e.g. by Docker). Override with `PORT=8002 npm run dev:api` and update the proxy in `frontend/vite.config.js` if needed.

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + Vite dev servers together |
| `npm run dev:api` | Express API only (port 8001) |
| `npm run dev:web` | Vite frontend only (port 5173) |
| `npm start` | Production API (`PORT` from env, default 8001) |
| `npm run build` | Build frontend to `frontend/dist/` |

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8001` | API listen port |
| `CONTENT_DIR` | `content/` | Quiz JSON root directory |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins |

Canvas mutations run in the browser; the API only serves track metadata and validates answers.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/systems?discipline=lld\|hld\|clean_code` | Track list for a discipline |
| `GET` | `/api/game/start/{system_id}` | Quiz structure (no answers or mutations) |
| `POST` | `/api/game/validate` | Validate answer; returns `health_impact` (HLD) or `coupling_impact` (Clean Code) |
| `GET` | `/api/config/{system_id}` | Full config (authoring/debug) |

Validation payload:

```json
{
  "system_id": "url_shortener_hld",
  "level_index": 1,
  "question_id": "l1_q2",
  "selected_answer": ["Geographically distributed CDN", "Edge caching layer at PoPs"]
}
```

For radio questions, `selected_answer` is a string.

## Adding a track

1. Create `content/lld/<system_id>/quiz_config.json`, `content/hld/...`, or `content/clean_code/...`
2. Register the track in the matching `tracks.json`
3. Restart the API server (config is cached on first load)

Minimal question shape:

```json
{
  "question_id": "l1_q1",
  "skill_tag": "High Availability",
  "type": "radio",
  "text": "...",
  "choices": ["A", "B", "C"],
  "correct_answer": "B",
  "explanation": "...",
  "uml_mutation": "class Foo\n"
}
```

For checkbox questions, set `"type": "checkbox"` and use an array for `correct_answer`. HLD questions may include `"health_impact": { "availability": 10, "latency": -20, "cost": 5 }`. Clean Code questions may include `"coupling_impact": { "coupling": 15 }`.

### Canvas mutation modes

The engine auto-detects three mutation styles:

| Mode | When | Behavior |
|------|------|----------|
| **Snapshot** | `uml_mutation` starts with `flowchart`, `graph`, or `classDiagram` | Replaces the entire canvas (evolution/refactor tracks) |
| **Style** | Mutation contains only `style`, `classDef`, or `class Node className` lines | Appends visual overrides to existing nodes (red = broken, green = fixed) |
| **Incremental** | Everything else | Appends nodes/edges (default for LLD assembly tracks) |

Levels may define `"initial_canvas"` to start each tier with a pre-built (often red-styled) legacy diagram. When advancing to the next level, the canvas resets to that level's `initial_canvas` if present.

## Documentation

See [docs/](docs/) for the PRD, architecture notes, quiz config schema, and UML → quiz authoring pipeline.
