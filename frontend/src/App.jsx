import { useEffect, useMemo, useState } from "react";
import { startGame, validateAnswer } from "./api.js";
import { applyMutation } from "./canvasEngine.js";
import ChoiceTiles from "./components/ChoiceTiles.jsx";
import DiagramCanvas from "./components/DiagramCanvas.jsx";
import FeedbackCard from "./components/FeedbackCard.jsx";
import ProgressBar from "./components/ProgressBar.jsx";

const SCORE_PER_QUESTION = 10;

function createInitialState(config) {
  return {
    levelIdx: 1,
    questionIdx: 0,
    score: 0,
    canvas: config.initial_canvas,
    answeredCount: 0,
    gameOver: false,
    selected: null,
    result: null,
    feedback: null,
    submitting: false,
  };
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    startGame()
      .then((data) => {
        setConfig(data);
        setState(createInitialState(data));
      })
      .catch(() => setError("Failed to load game config. Is the API running on port 8000?"));
  }, []);

  const currentLevel = useMemo(() => {
    if (!config || !state || state.gameOver) return null;
    return config.levels[state.levelIdx - 1] ?? null;
  }, [config, state]);

  const currentQuestion = currentLevel?.questions[state.questionIdx] ?? null;

  async function handleSubmit() {
    if (!state || !currentQuestion || !state.selected || state.submitting) return;

    setState((prev) => ({ ...prev, submitting: true, result: null }));

    try {
      const response = await validateAnswer(
        state.levelIdx,
        currentQuestion.question_id,
        state.selected,
      );

      if (response.is_correct) {
        const nextCanvas = applyMutation(state.canvas, response.uml_mutation);
        const levels = config.levels;
        const questionsInLevel = currentLevel.questions.length;
        let nextLevelIdx = state.levelIdx;
        let nextQuestionIdx = state.questionIdx + 1;
        let nextFeedback = {
          type: "success",
          title: "✅ Architectural Validation Passed!",
          body: [
            `Insight: ${response.explanation}`,
            "The blueprint grows! Check the visualization canvas.",
          ],
        };
        let gameOver = false;

        if (nextQuestionIdx >= questionsInLevel) {
          nextLevelIdx += 1;
          nextQuestionIdx = 0;
          nextFeedback = {
            type: "level",
            title: "🚀 Level Complete!",
            body: [
              response.explanation,
              "Preparing next architectural subsystem...",
            ],
          };
          if (nextLevelIdx > levels.length) {
            gameOver = true;
          }
        }

        setState((prev) => ({
          ...prev,
          canvas: nextCanvas,
          score: prev.score + SCORE_PER_QUESTION,
          answeredCount: prev.answeredCount + 1,
          levelIdx: nextLevelIdx,
          questionIdx: nextQuestionIdx,
          gameOver,
          selected: null,
          result: "correct",
          feedback: nextFeedback,
          submitting: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          result: "incorrect",
          feedback: {
            type: "error",
            title: "⚠️ Design Tradeoff Violation Found",
            body: [
              `Skill Constraint Broken: ${response.skill_tag}`,
              `Why this fails: ${response.explanation}`,
              "Re-evaluate your coupling boundaries and submit an alternative path.",
            ],
          },
          submitting: false,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        submitting: false,
        feedback: {
          type: "error",
          title: "Network Error",
          body: ["Could not reach validation API."],
        },
      }));
    }
  }

  function handleRestart() {
    if (!config) return;
    setState(createInitialState(config));
  }

  if (error) {
    return <div className="app-shell error-shell">{error}</div>;
  }

  if (!config || !state) {
    return <div className="app-shell loading-shell">Loading blueprint engine...</div>;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">LLD Speedrun Gamifier</p>
          <h1>{config.system_title}</h1>
        </div>
        <div className="score-badge">⚡ {state.score} pts</div>
      </header>

      <div className="game-grid">
        <section className="canvas-column">
          <h2>Live Blueprint Assembly Canvas</h2>
          <DiagramCanvas source={state.canvas} />
        </section>

        <section className="quiz-column">
          {state.gameOver ? (
            <div className="game-complete">
              <h2>🏆 Architectural Blueprint Fully Assembled!</h2>
              <p>Final score: {state.score} points</p>
              <button type="button" onClick={handleRestart}>
                Restart Run
              </button>
            </div>
          ) : (
            <>
              <ProgressBar
                currentLevel={state.levelIdx}
                totalLevels={config.total_levels}
                answered={state.answeredCount}
                totalQuestions={config.total_questions}
              />

              <div className="level-card">
                <h2>{currentLevel.title}</h2>
                <p>{currentLevel.description}</p>
              </div>

              <span className="skill-badge">🎯 {currentQuestion.skill_tag}</span>
              <p className="question-text">{currentQuestion.text}</p>

              <ChoiceTiles
                choices={currentQuestion.choices}
                selected={state.selected}
                result={state.result}
                disabled={state.submitting}
                onSelect={(choice) =>
                  setState((prev) => ({ ...prev, selected: choice, result: null }))
                }
              />

              <div className="action-row">
                <button
                  type="button"
                  className="primary-btn"
                  disabled={!state.selected || state.submitting}
                  onClick={handleSubmit}
                >
                  {state.submitting ? "Validating..." : "Submit Evaluation"}
                </button>
                <button type="button" className="secondary-btn" onClick={handleRestart}>
                  Restart Run
                </button>
              </div>

              <FeedbackCard feedback={state.feedback} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
