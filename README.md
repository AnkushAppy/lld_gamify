# Architecture Speedrun

An interactive browser game for **Low-Level Design (LLD)** and **High-Level Design (HLD)** practice. Answer architecture questions and watch a live diagram assemble piece by piece — class diagrams for LLD, infrastructure flowcharts for HLD.

Each track takes about 10–15 minutes and trains a different muscle: object modeling and design patterns in LLD, scalability and distributed systems thinking in HLD.

## Features

### Two disciplines, one engine

| | **LLD** | **HLD** |
|---|---------|---------|
| Canvas | Mermaid `classDiagram` | Mermaid `flowchart TD` |
| Focus | Classes, interfaces, GoF patterns | Load balancers, caches, queues, databases |
| Progress | Score (points per correct answer) | Live health meters (availability, latency, cost) |
| Victory | Validated class diagram | Chaos simulation stress test |

Pick a discipline on the home screen, then choose a system track.

### Question types

- **Radio** — single correct answer (classic LLD and HLD questions)
- **Checkbox** — multiple correct answers; exact set match required (common in HLD where resilience needs several components)

### HLD-specific UX

- **Health meters** update as you place infrastructure components
- **Chaos simulation** runs when you finish a track — simulates traffic spikes and shows whether your architecture survives

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

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, Mermaid.js |
| Backend | FastAPI (stateless validation) |
| Content | JSON quiz configs per track |

## Project structure

```
lld_gamify/
├── app.py                   # Uvicorn entry point
├── backend/
│   ├── main.py              # REST API + discipline-aware discovery
│   ├── canvas_engine.py     # LLD classDiagram mutation merging
│   └── hld_canvas_engine.py # HLD flowchart mutations
├── frontend/src/
│   ├── components/
│   │   ├── ModeSelector.jsx # LLD vs HLD fork
│   │   ├── LldGameScreen.jsx
│   │   └── HldGameScreen.jsx
│   └── canvasEngine.js      # Client-side LLD mutations
├── content/
│   ├── lld/                 # LLD tracks + tracks.json
│   └── hld/                 # HLD tracks + tracks.json
├── docs/                    # PRD, schema, architecture
└── scripts/                 # Content authoring utilities
```

## Quick start

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

API docs: http://127.0.0.1:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Game UI: http://127.0.0.1:5173/

Vite proxies `/api` to the backend on port 8000.

## API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/systems?discipline=lld\|hld` | Track list for a discipline |
| `GET` | `/api/game/start/{system_id}` | Quiz structure (no answers or mutations) |
| `POST` | `/api/game/validate` | Validate answer; returns `health_impact` for HLD |
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

1. Create `content/lld/<system_id>/quiz_config.json` or `content/hld/<system_id>/quiz_config.json`
2. Register the track in the matching `tracks.json`
3. Restart the backend (config is cached on first load)

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

For checkbox questions, set `"type": "checkbox"` and use an array for `correct_answer`. HLD questions may include `"health_impact": { "availability": 10, "latency": -20, "cost": 5 }`.

## Documentation

See [docs/](docs/) for the PRD, architecture notes, quiz config schema, and UML → quiz authoring pipeline.
