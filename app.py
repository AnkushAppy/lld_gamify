import json
import os
from typing import Any

import gradio as gr
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from canvas_engine import apply_mutation, init_canvas

CONFIG_PATH = os.environ.get(
    "QUIZ_CONFIG_PATH",
    "content/parking_lot_blueprint/quiz_config.json",
)

if not os.path.exists(CONFIG_PATH):
    raise FileNotFoundError(f"Critical error: Configuration data missing at {CONFIG_PATH}")

with open(CONFIG_PATH, encoding="utf-8") as f:
    game_data = json.load(f)

app = FastAPI(
    title="LLD Speedrun Gamifier Core API",
    description="Backend simulation engine handling architectural evaluations and UML state transformations.",
    version="2.0.0",
)

CUSTOM_CSS = """
.correct-card {
    background-color: #ecfdf5;
    border-left: 5px solid #10b981;
    padding: 15px;
    border-radius: 6px;
    margin-top: 10px;
}
.incorrect-card {
    background-color: #fef2f2;
    border-left: 5px solid #ef4444;
    padding: 15px;
    border-radius: 6px;
    margin-top: 10px;
}
.level-complete-card {
    background-color: #eff6ff;
    border-left: 5px solid #3b82f6;
    padding: 12px 15px;
    border-radius: 6px;
    margin-top: 10px;
}
.skill-badge {
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 6px 14px;
    border-radius: 12px;
    font-weight: bold;
    display: inline-block;
    font-size: 0.9em;
    border: 1px solid #7dd3fc;
    margin: 8px 0 12px 0;
}
.score-badge {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 1.15em;
    text-align: center;
    min-width: 120px;
    box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
}
.canvas-column, .quiz-column {
    min-height: 72vh;
}
.canvas-column {
    position: sticky;
    top: 12px;
    align-self: flex-start;
}
.quiz-radio fieldset {
    gap: 8px !important;
}
.quiz-radio label {
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    padding: 10px 14px !important;
    margin: 0 !important;
    transition: border-color 0.15s, background 0.15s;
}
.quiz-radio label:hover {
    border-color: #f97316 !important;
    background: #fff7ed !important;
}
.quiz-radio input:checked + span {
    font-weight: 600;
}
.feedback-placeholder {
    color: #6b7280;
    font-style: italic;
    padding: 8px 0;
}
"""


class AnswerSubmission(BaseModel):
    level_index: int
    question_id: str
    selected_answer: str


class ValidationResult(BaseModel):
    is_correct: bool
    explanation: str
    updated_canvas: str
    level_complete: bool
    game_complete: bool


def format_canvas(canvas: str) -> str:
    return f"```mermaid\n{canvas}\n```"


def canvas_outputs(state: dict[str, Any]) -> tuple[str, str]:
    return format_canvas(state["canvas"]), state["canvas"]


def format_score(score: int) -> str:
    return f'<div class="score-badge">⚡ {score} pts</div>'


def format_skill_badge(skill_tag: str) -> str:
    return f'<div class="skill-badge">🎯 Target Skill: {skill_tag}</div>'


def initial_feedback() -> str:
    return '<p class="feedback-placeholder">Select an architectural design option to kick off the speedrun assembly.</p>'


@app.get("/api/config", summary="Fetch active game setup arrays")
def get_config():
    return game_data


@app.post("/api/validate", response_model=ValidationResult, summary="Process architectural option validations")
def validate_answer(submission: AnswerSubmission):
    levels = game_data["levels"]
    if submission.level_index - 1 >= len(levels):
        raise HTTPException(status_code=400, detail="Invalid level index context bounds.")

    target_level = levels[submission.level_index - 1]
    target_question = None

    for q in target_level["questions"]:
        if q["question_id"] == submission.question_id:
            target_question = q
            break

    if not target_question:
        raise HTTPException(status_code=404, detail="Requested target question hash context not located.")

    is_correct = submission.selected_answer == target_question["correct_answer"]

    return ValidationResult(
        is_correct=is_correct,
        explanation=target_question["explanation"],
        updated_canvas=target_question["uml_mutation"] if is_correct else "",
        level_complete=False,
        game_complete=False,
    )


def init_game_state() -> dict[str, Any]:
    return {
        "level_idx": 1,
        "question_idx": 0,
        "score": 0,
        "canvas": init_canvas(),
        "feedback_history": initial_feedback(),
        "game_over": False,
    }


def render_ui_components(state: dict[str, Any]):
    levels = game_data["levels"]

    if state["game_over"] or state["level_idx"] > len(levels):
        return (
            "## 🏆 Architectural Blueprint Fully Assembled!",
            "<div class='skill-badge'>🎯 Complete</div>",
            gr.update(choices=[], value=None, visible=False),
            gr.update(visible=False),
            (
                f"<div class='correct-card'>🎉 <b>Spectacular run!</b> Your final LLD score is "
                f"<b>{state['score']} points</b>. You have effectively internalized the system's "
                f"structural rules!</div>"
            ),
            format_score(state["score"]),
        )

    current_level_data = levels[state["level_idx"] - 1]
    current_q_data = current_level_data["questions"][state["question_idx"]]

    level_header = f"## 🧭 {current_level_data['title']}\n*{current_level_data['description']}*"
    skill_html = format_skill_badge(current_q_data["skill_tag"])
    question_label = current_q_data["text"]

    return (
        level_header,
        skill_html,
        gr.update(
            choices=current_q_data["choices"],
            value=None,
            label=question_label,
            visible=True,
        ),
        gr.update(visible=True),
        state["feedback_history"],
        format_score(state["score"]),
    )


def handle_submission(user_choice, state: dict[str, Any]):
    if not user_choice:
        return state, *canvas_outputs(state), *render_ui_components(state)

    levels = game_data["levels"]
    current_level_data = levels[state["level_idx"] - 1]
    questions = current_level_data["questions"]
    current_q_data = questions[state["question_idx"]]

    if user_choice == current_q_data["correct_answer"]:
        state["score"] += 10
        state["canvas"] = apply_mutation(state["canvas"], current_q_data["uml_mutation"])

        feedback = f"""
        <div class="correct-card">
            <h3>✅ Architectural Validation Passed! (+10 pts)</h3>
            <p><b>Insight:</b> {current_q_data['explanation']}</p>
            <p>🌱 <i>The code engine has successfully compiled this structural block onto your canvas!</i></p>
        </div>
        """
        state["feedback_history"] = feedback

        state["question_idx"] += 1
        if state["question_idx"] >= len(questions):
            state["level_idx"] += 1
            state["question_idx"] = 0
            state["feedback_history"] += (
                '<div class="level-complete-card">'
                "🚀 <b>LEVEL COMPLETE!</b> Preparing next architectural subsystem..."
                "</div>"
            )

            if state["level_idx"] > len(levels):
                state["game_over"] = True
    else:
        feedback = f"""
        <div class="incorrect-card">
            <h3>⚠️ Design Tradeoff Violation Found</h3>
            <p><b>Skill Constraint Broken:</b> {current_q_data['skill_tag']}</p>
            <p><b>Why this fails:</b> {current_q_data['explanation']}</p>
            <p>💡 <i>Re-evaluate your coupling boundaries and submit an alternative path!</i></p>
        </div>
        """
        state["feedback_history"] = feedback

    return state, *canvas_outputs(state), *render_ui_components(state)


def restart_game_handler():
    fresh_state = init_game_state()
    return fresh_state, *canvas_outputs(fresh_state), *render_ui_components(fresh_state)


def load_ui(state: dict[str, Any]):
    return *render_ui_components(state), state["canvas"]


with gr.Blocks(title=game_data["system_title"]) as demo:
    gr.HTML(f"<style>{CUSTOM_CSS}</style>", container=False)
    session_state = gr.State(value=init_game_state())

    with gr.Row():
        with gr.Column(scale=4):
            gr.Markdown(f"# 🕹️ {game_data['system_title']}")
        with gr.Column(scale=1, min_width=140):
            ui_score = gr.HTML(value=format_score(0))

    gr.Markdown(
        "⚡ **Learn a system's structure from scratch in 10-15 minutes.** "
        "Evaluate architectural tradeoffs, master micro-skills, and watch your diagram "
        "assemble in real time."
    )

    with gr.Row(equal_height=True):
        with gr.Column(scale=3, elem_classes="canvas-column"):
            gr.Markdown("### 🖼️ Live Blueprint Assembly Canvas")
            diagram_display = gr.Markdown(format_canvas(init_canvas()))
            with gr.Accordion("📋 Mermaid Source (copy to mermaid.live)", open=True):
                ui_mermaid_source = gr.Code(
                    value=init_canvas(),
                    label="Raw Mermaid script",
                    language=None,
                    lines=10,
                    interactive=False,
                )

        with gr.Column(scale=2, elem_classes="quiz-column"):
            gr.Markdown("### 🧠 Architectural Tradeoff Matrix")
            ui_level_header = gr.Markdown()
            ui_skill_tag = gr.HTML()
            ui_quiz_input = gr.Radio(
                choices=[],
                label="Loading evaluation modules...",
                interactive=True,
                elem_classes="quiz-radio",
            )

            with gr.Row():
                submit_btn = gr.Button("Submit Evaluation", variant="primary", scale=2)
                reset_btn = gr.Button("Restart Run", variant="secondary", scale=1)

            ui_feedback_pane = gr.HTML(value=initial_feedback())

    quiz_outputs = [
        ui_level_header,
        ui_skill_tag,
        ui_quiz_input,
        submit_btn,
        ui_feedback_pane,
        ui_score,
    ]
    canvas_output_components = [diagram_display, ui_mermaid_source]

    demo.load(
        fn=load_ui,
        inputs=[session_state],
        outputs=[*quiz_outputs, ui_mermaid_source],
    )

    submit_btn.click(
        fn=handle_submission,
        inputs=[ui_quiz_input, session_state],
        outputs=[session_state, *canvas_output_components, *quiz_outputs],
    )

    reset_btn.click(
        fn=restart_game_handler,
        inputs=[],
        outputs=[session_state, *canvas_output_components, *quiz_outputs],
    )

app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    print("\n🚀 Starting Unified Game Pipeline Framework Engine Server...")
    print(f"👉 Using quiz config: {CONFIG_PATH}")
    print("👉 Programmatic API Docs available at: http://127.0.0.1:8000/docs")
    print("👉 Interactive Gamified UI running at: http://127.0.0.1:8000/\n")
    uvicorn.run(app, host="127.0.0.1", port=8000)
