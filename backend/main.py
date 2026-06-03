import json
import os
from pathlib import Path
from typing import Any, Literal, Union

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.canvas_engine import init_canvas
from backend.hld_canvas_engine import init_hld_canvas

CONTENT_DIR = Path(os.environ.get("CONTENT_DIR", "content"))
DISCIPLINES = ("lld", "hld", "clean_code")
DEFAULT_COUPLING_IMPACT = {"coupling": 12}
DEFAULT_HEALTH_IMPACT = {"availability": 8, "latency": -15, "cost": 5}

app = FastAPI(
    title="LLD/HLD Speedrun Gamifier API",
    description="REST API for Blueprint Assembly game validation.",
    version="4.0.0",
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
    selected_answer: Union[str, list[str]]


class ValidationResult(BaseModel):
    is_correct: bool
    explanation: str
    uml_mutation: str
    skill_tag: str
    health_impact: dict[str, int] | None = None
    coupling_impact: dict[str, int] | None = None


def _discover_config_paths() -> dict[str, Path]:
    discovered: dict[str, Path] = {}
    if not CONTENT_DIR.exists():
        return discovered

    for discipline in DISCIPLINES:
        discipline_dir = CONTENT_DIR / discipline
        if not discipline_dir.is_dir():
            continue
        for folder in discipline_dir.iterdir():
            if not folder.is_dir():
                continue
            config_path = folder / "quiz_config.json"
            if config_path.exists():
                discovered[folder.name] = config_path

    # Legacy flat layout: content/<system_id>/quiz_config.json
    for folder in CONTENT_DIR.iterdir():
        if not folder.is_dir() or folder.name in DISCIPLINES:
            continue
        config_path = folder / "quiz_config.json"
        if config_path.exists():
            discovered[folder.name] = config_path

    return discovered


def _config_discipline(config: dict[str, Any], config_path: Path | None = None) -> str:
    if "discipline" in config:
        discipline = config["discipline"]
        if discipline in DISCIPLINES:
            return discipline
    if config_path and config_path.parent.parent.name in DISCIPLINES:
        return config_path.parent.parent.name
    return "lld"


def _resolve_discipline(config: dict[str, Any]) -> str:
    path = config.get("_config_path")
    config_path = Path(path) if path else None
    return _config_discipline(config, config_path)


def _load_config(system_id: str) -> dict[str, Any]:
    if system_id in _config_cache:
        cached = _config_cache[system_id]
        path = cached.get("_config_path")
        if path:
            cached["discipline"] = _config_discipline(cached, Path(path))
        return cached

    config_paths = _discover_config_paths()
    config_path = config_paths.get(system_id)
    if not config_path:
        raise HTTPException(status_code=404, detail=f"System '{system_id}' not found.")

    with config_path.open(encoding="utf-8") as f:
        config = json.load(f)

    config["_config_path"] = str(config_path)
    config["discipline"] = _config_discipline(config, config_path)

    _config_cache[system_id] = config
    return config


def _load_tracks_manifest(discipline: str) -> list[dict[str, Any]]:
    manifest_path = CONTENT_DIR / discipline / "tracks.json"
    if not manifest_path.exists():
        return []

    with manifest_path.open(encoding="utf-8") as f:
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
        "type": question.get("type", "radio"),
        "text": question["text"],
        "choices": question["choices"],
    }


def _normalize_selected(selected: str | list[str]) -> list[str]:
    if isinstance(selected, list):
        return selected
    return [selected] if selected else []


def _answers_match(question: dict[str, Any], selected: str | list[str]) -> bool:
    q_type = question.get("type", "radio")
    correct = question["correct_answer"]
    selected_list = _normalize_selected(selected)

    if q_type == "checkbox":
        if not isinstance(correct, list):
            return False
        return set(selected_list) == set(correct)

    expected = correct[0] if isinstance(correct, list) and len(correct) == 1 else correct
    if not isinstance(expected, str):
        return False
    return len(selected_list) == 1 and selected_list[0] == expected


def _initial_canvas_for(config: dict[str, Any]) -> str:
    if config.get("initial_canvas"):
        return config["initial_canvas"]

    levels = config.get("levels", [])
    if levels and levels[0].get("initial_canvas"):
        return levels[0]["initial_canvas"]

    if config.get("discipline") == "hld":
        return init_hld_canvas()
    return init_canvas()


def _sanitize_config(config: dict[str, Any]) -> dict[str, Any]:
    discipline = config.get("discipline", "lld")
    total_questions = sum(len(level["questions"]) for level in config["levels"])
    payload: dict[str, Any] = {
        "system_id": config["system_id"],
        "system_title": config["system_title"],
        "discipline": discipline,
        "canvas_type": config.get("canvas_type", "flowchart" if discipline == "hld" else "classDiagram"),
        "initial_canvas": _initial_canvas_for(config),
        "total_levels": len(config["levels"]),
        "total_questions": total_questions,
        "levels": [
            {
                "level_index": level["level_index"],
                "title": level["title"],
                "description": level.get("description", ""),
                **(
                    {"initial_canvas": level["initial_canvas"]}
                    if level.get("initial_canvas")
                    else {}
                ),
                "questions": [_sanitize_question(q) for q in level["questions"]],
            }
            for level in config["levels"]
        ],
    }
    if discipline == "hld" and config.get("chaos_scenario"):
        payload["chaos_scenario"] = config["chaos_scenario"]
    return payload


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/systems")
def list_systems(discipline: Literal["lld", "hld", "clean_code"] = Query("lld")):
    """Return dashboard track cards for a discipline."""
    discovered = _discover_config_paths()
    manifest = _load_tracks_manifest(discipline)

    if manifest:
        tracks = []
        for track in manifest:
            system_id = track["system_id"]
            has_config = system_id in discovered
            tracks.append(
                {
                    "system_id": system_id,
                    "discipline": discipline,
                    "icon": track.get("icon", "📦"),
                    "title": track.get("title", system_id),
                    "tagline": track.get("tagline", ""),
                    "available": has_config and track.get("available", True),
                }
            )
        return {"discipline": discipline, "tracks": tracks}

    tracks = []
    for system_id, path in discovered.items():
        with path.open(encoding="utf-8") as f:
            config = json.load(f)
        config_discipline = _config_discipline(config, path)
        if config_discipline != discipline:
            continue
        first_level = config["levels"][0] if config.get("levels") else {}
        tracks.append(
            {
                "system_id": system_id,
                "discipline": discipline,
                "icon": "📦",
                "title": config.get("system_title", system_id),
                "tagline": first_level.get("description", ""),
                "available": True,
            }
        )
    return {"discipline": discipline, "tracks": tracks}


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
    is_correct = _answers_match(question, submission.selected_answer)
    health_impact = None
    coupling_impact = None

    if is_correct:
        discipline = _resolve_discipline(config)
        if discipline == "hld":
            health_impact = question.get("health_impact") or DEFAULT_HEALTH_IMPACT
        elif discipline == "clean_code":
            coupling_impact = question.get("coupling_impact") or DEFAULT_COUPLING_IMPACT

    return ValidationResult(
        is_correct=is_correct,
        explanation=question["explanation"],
        uml_mutation=question["uml_mutation"] if is_correct else "",
        skill_tag=question["skill_tag"],
        health_impact=health_impact,
        coupling_impact=coupling_impact,
    )
