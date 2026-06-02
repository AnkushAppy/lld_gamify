import json
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.canvas_engine import init_canvas

CONFIG_PATH = os.environ.get(
    "QUIZ_CONFIG_PATH",
    "content/parking_lot_blueprint/quiz_config.json",
)

if not os.path.exists(CONFIG_PATH):
    raise FileNotFoundError(f"Configuration missing at {CONFIG_PATH}")

with open(CONFIG_PATH, encoding="utf-8") as f:
    game_data: dict[str, Any] = json.load(f)

app = FastAPI(
    title="LLD Speedrun Gamifier API",
    description="REST API for Blueprint Assembly game validation.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnswerSubmission(BaseModel):
    level_index: int
    question_id: str
    selected_answer: str


class ValidationResult(BaseModel):
    is_correct: bool
    explanation: str
    uml_mutation: str
    skill_tag: str


def _find_question(level_index: int, question_id: str) -> dict[str, Any]:
    levels = game_data["levels"]
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


def _sanitize_config() -> dict[str, Any]:
    total_questions = sum(len(level["questions"]) for level in game_data["levels"])
    return {
        "system_id": game_data["system_id"],
        "system_title": game_data["system_title"],
        "initial_canvas": init_canvas(),
        "total_levels": len(game_data["levels"]),
        "total_questions": total_questions,
        "levels": [
            {
                "level_index": level["level_index"],
                "title": level["title"],
                "description": level.get("description", ""),
                "questions": [_sanitize_question(q) for q in level["questions"]],
            }
            for level in game_data["levels"]
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/game/start")
def start_game():
    """Return quiz structure without answers or mutations."""
    return _sanitize_config()


@app.get("/api/config")
def get_config():
    """Full config for authoring/debug only."""
    return game_data


@app.post("/api/game/validate", response_model=ValidationResult)
def validate_answer(submission: AnswerSubmission):
    question = _find_question(submission.level_index, submission.question_id)
    is_correct = submission.selected_answer == question["correct_answer"]

    return ValidationResult(
        is_correct=is_correct,
        explanation=question["explanation"],
        uml_mutation=question["uml_mutation"] if is_correct else "",
        skill_tag=question["skill_tag"],
    )
