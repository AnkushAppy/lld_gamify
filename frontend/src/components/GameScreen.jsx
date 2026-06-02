import { useMemo, useState } from "react";
import { validateAnswer } from "../api.js";
import { applyMutation } from "../canvasEngine.js";
import DiagramCanvas from "./DiagramCanvas.jsx";

const SCORE_PER_QUESTION = 10;

function createInitialState(config) {
  return {
    levelIdx: 1,
    questionIdx: 0,
    score: 0,
    canvas: config.initial_canvas,
    answeredCount: 0,
    gameOver: false,
    selected: "",
    feedback: null,
    submitting: false,
  };
}

export default function GameScreen({ systemId, config, onQuit }) {
  const [state, setState] = useState(createInitialState(config));

  const currentLevel = useMemo(() => {
    if (state.gameOver) return null;
    return config.levels[state.levelIdx - 1] ?? null;
  }, [config, state]);

  const currentQuestion = currentLevel?.questions[state.questionIdx] ?? null;

  async function handleSubmit() {
    if (!currentQuestion || !state.selected || state.submitting) return;

    setState((prev) => ({ ...prev, submitting: true, feedback: null }));

    try {
      const response = await validateAnswer(
        systemId,
        state.levelIdx,
        currentQuestion.question_id,
        state.selected,
      );

      if (response.is_correct) {
        const nextCanvas = applyMutation(state.canvas, response.uml_mutation);
        const questionsInLevel = currentLevel.questions.length;
        let nextLevelIdx = state.levelIdx;
        let nextQuestionIdx = state.questionIdx + 1;
        let feedback = {
          isCorrect: true,
          title: "✅ Evaluation Verification Passed!",
          text: response.explanation,
        };
        let gameOver = false;

        if (nextQuestionIdx >= questionsInLevel) {
          nextLevelIdx += 1;
          nextQuestionIdx = 0;
          feedback = {
            isCorrect: true,
            title: "🚀 Level Complete!",
            text: response.explanation,
          };
          if (nextLevelIdx > config.total_levels) {
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
          selected: "",
          feedback,
          submitting: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          feedback: {
            isCorrect: false,
            title: "⚠️ Design Conflict Detected",
            text: `${response.skill_tag}: ${response.explanation}`,
          },
          submitting: false,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        submitting: false,
        feedback: {
          isCorrect: false,
          title: "Network Error",
          text: "Could not reach validation API.",
        },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-md">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
              Active Architecture Session
            </span>
            <h2 className="text-xl font-extrabold">{config.system_title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Score</p>
              <p className="text-xl font-black text-amber-400">{state.score} PTS</p>
            </div>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Quit Run
            </button>
          </div>
        </div>

        {!state.gameOver && currentQuestion ? (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-200">{currentLevel.title}</h3>
                <p className="text-xs italic text-slate-400">{currentLevel.description}</p>
              </div>
              <span className="rounded-full border border-sky-800 bg-sky-950 px-2.5 py-1 text-xs font-bold text-sky-400">
                🎯 {currentQuestion.skill_tag}
              </span>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-base font-medium">{currentQuestion.text}</p>
            </div>

            <div className="space-y-2">
              {currentQuestion.choices.map((choice) => (
                <label
                  key={choice}
                  className={`flex cursor-pointer items-center rounded-lg border p-3.5 transition-all ${
                    state.selected === choice
                      ? "border-orange-500 bg-orange-950/40 text-orange-200"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="quiz_choice"
                    value={choice}
                    checked={state.selected === choice}
                    onChange={(e) =>
                      setState((prev) => ({ ...prev, selected: e.target.value }))
                    }
                    className="mr-3 h-4 w-4 accent-orange-500"
                  />
                  <span className="text-sm font-medium">{choice}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!state.selected || state.submitting}
              className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-sm font-bold tracking-wide shadow-md transition-all disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500"
            >
              {state.submitting ? "Validating..." : "Submit Design Evaluation"}
            </button>

            {state.feedback && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  state.feedback.isCorrect
                    ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                    : "border-rose-800 bg-rose-950/40 text-rose-300"
                }`}
              >
                <h4 className="mb-1 font-bold">{state.feedback.title}</h4>
                <p>{state.feedback.text}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-emerald-800 bg-emerald-950/30 p-8 text-center text-emerald-300">
            <h3 className="text-2xl font-black">🏆 Blueprint Assembly Fully Validated!</h3>
            <p className="mx-auto max-w-md text-sm text-emerald-400/80">
              Final score: {state.score} points. You parsed dependencies, built
              encapsulation patterns, and locked down structural integrity.
            </p>
            <button
              type="button"
              onClick={onQuit}
              className="mt-2 rounded-lg bg-emerald-600 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500"
            >
              Return to Control Panel
            </button>
          </div>
        )}

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="flex items-center border-b border-slate-800 pb-3">
            <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-slate-300">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live Compiled Diagram Output Frame
            </h3>
          </div>
          <DiagramCanvas source={state.canvas} />
        </div>
      </div>
    </div>
  );
}
