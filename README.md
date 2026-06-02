# LLD Speedrun Gamifier (Blueprint Assembly Edition)

An interactive, browser-based pedagogical tool that teaches low-level system design in 10–15 minutes. Players construct a UML diagram from a blank canvas—each correct answer injects classes, attributes, and relationships into a live-updating Mermaid diagram.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Mermaid.js (client-side rendering) |
| Backend API | FastAPI (stateless validation) |
| Data | JSON quiz configs under `content/` |

## Project Structure

```
lld_gamify/
├── backend/                 # FastAPI REST API
├── frontend/                # React game UI
├── content/                 # Quiz system packs
├── docs/                    # PRD, schema, architecture
└── scripts/                 # Content authoring utilities
```

## Quick Start

### 1. Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Game UI: http://127.0.0.1:5173/

The Vite dev server proxies `/api` requests to the FastAPI backend on port 8000.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/game/start` | Quiz structure (no answers/mutations) |
| `POST` | `/api/game/validate` | Validate answer, return explanation + mutation |
| `GET` | `/api/config` | Full config (authoring/debug) |

## Configuration

Game content: `content/parking_lot_blueprint/quiz_config.json`

Override with:

```bash
export QUIZ_CONFIG_PATH=content/your_system/quiz_config.json
```

## Documentation

See [docs/](docs/) for PRD, architecture, schema, and UML → quiz pipeline.
