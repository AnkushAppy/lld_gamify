import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.canvas_engine import init_canvas

CONTENT_DIR = Path(os.environ.get("CONTENT_DIR", "content"))
TRACKS_MANIFEST = CONTENT_DIR / "tracks.json"

app = FastAPI(
    title="LLD Speedrun Gamifier API",
    description="REST API for Blueprint Assembly game validation.",
    version="3.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_config_cache: dict[str, dict[str, Any]] = {}


class AnswerSubmission(BaseModel):
    system_id: str
    level_index: int
    question_id: str
    selected_answer: str


class ValidationResult(BaseModel):
    is_correct: bool
    explanation: str
    uml_mutation: str
    skill_tag: str


def _discover_config_paths() -> dict[str, Path]:
    discovered: dict[str, Path] = {}
    if not CONTENT_DIR.exists():
        return discovered

    for folder in CONTENT_DIR.iterdir():
        if not folder.is_dir():
            continue
        config_path = folder / "quiz_config.json"
        if config_path.exists():
            discovered[folder.name] = config_path
    return discovered


def _load_config(system_id: str) -> dict[str, Any]:
    if system_id in _config_cache:
        return _config_cache[system_id]

    config_paths = _discover_config_paths()
    config_path = config_paths.get(system_id)
    if not config_path:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found.")

    with config_path.open(encoding="utf-8") as f:
        config = json.load(f)

    _config_cache[system_id] = config
    return config


def _load_tracks_manifest() -> list[dict[str, Any]]:
    if not TRACKS_MANIFEST.exists():
        return []

    with TRACKS_MANIFEST.open(encoding="utf-8") as f:
        payload = json.load(f)

    return payload.get("tracks", [])


def _find_question(config: dict[str, Any], level_index: int, question_id: str) -> dict[str, Any]:
    levels = config["levels"]
    if level_index < 1 or level_index > len(levels):
        raise HTTPException(status_code=400, detail="Invalid level index.")

    target_level = levels[level_index - 1]
    for question in target_level["questions"]:
        if question["question_id"] == question_id:
            return question

    raise HTTPException(status_code=404, detail="Question not found.")


def _sanitize_question(question: dict[str, Any]) -> dict[str, Any]:
    return {
        "question_id": question["question_id"],
        "skill_tag": question["skill_tag"],
        "type": question["type"],
        "text": question["text"],
        "choices": question["choices"],
    }


def _sanitize_config(config: dict[str, Any]) -> dict[str, Any]:
    total_questions = sum(len(level["questions"]) for level in config["levels"])
    return {
        "system_id": config["system_id"],
        "system_title": config["system_title"],
        "initial_canvas": init_canvas(),
        "total_levels": len(config["levels"]),
        "total_questions": total_questions,
        "levels": [
            {
                "level_index": level["level_index"],
                "title": level["title"],
                "description": level.get("description", ""),
                "questions": [_sanitize_question(q) for q in level["questions"]],
            }
            for level in config["levels"]
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/systems")
def list_systems():
    """Return dashboard track cards; available only when quiz config exists."""
    discovered = _discover_config_paths()
    manifest = _load_tracks_manifest()

    if manifest:
        tracks = []
        for track in manifest:
            system_id = track["system_id"]
            has_config = system_id in discovered
            tracks.append(
                {
                    "system_id": system_id,
                    "icon": track.get("icon", "📦"),
                    "title": track.get("title", system_id),
                    "tagline": track.get("tagline", ""),
                    "available": has_config and track.get("available", True),
                }
            )
        return {"tracks": tracks}

    tracks = []
    for system_id, path in discovered.items():
        with path.open(encoding="utf-8") as f:
            config = json.load(f)
        first_level = config["levels"][0] if config.get("levels") else {}
        tracks.append(
            {
                "system_id": system_id,
                "icon": "📦",
                "title": config.get("system_title", system_id),
                "tagline": first_level.get("description", ""),
                "available": True,
            }
        )
    return {"tracks": tracks}


@app.get("/api/game/start/{system_id}")
def start_game(system_id: str):
    """Return quiz structure for a system without answers or mutations."""
    config = _load_config(system_id)
    return _sanitize_config(config)


@app.get("/api/game/start")
def start_default_game():
    """Backward-compatible default: first available system."""
    discovered = _discover_config_paths()
    if not discovered:
        raise HTTPException(status_code=404, detail="No quiz configs found.")
    first_id = sorted(discovered.keys())[0]
    return start_game(first_id)


@app.get("/api/config/{system_id}")
def get_config(system_id: str):
    """Full config for authoring/debug only."""
    return _load_config(system_id)


@app.post("/api/game/validate", response_model=ValidationResult)
def validate_answer(submission: AnswerSubmission):
    config = _load_config(submission.system_id)
    question = _find_question(config, submission.level_index, submission.question_id)
    is_correct = submission.selected_answer == question["correct_answer"]

    return ValidationResult(
        is_correct=is_correct,
        explanation=question["explanation"],
        uml_mutation=question["uml_mutation"] if is_correct else "",
        skill_tag=question["skill_tag"],
    )
