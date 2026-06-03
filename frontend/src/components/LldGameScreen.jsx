import { useMemo, useState } from "react";
import { formatSelectedForApi, hasSelection, toggleChoice } from "../answerUtils.js";
import { validateAnswer } from "../api.js";
import { applyMutation } from "../canvasEngine.js";
import { resolveLevelCanvas } from "../mutationEngine.js";
import LldGameCanvas from "./LldGameCanvas.jsx";
import QuestionPanel from "./QuestionPanel.jsx";

const SCORE_PER_QUESTION = 10;

function createInitialState(config) {
  return {
    levelIdx: 1,
    questionIdx: 0,
    score: 0,
    canvas: resolveLevelCanvas(config, 1),
    gameOver: false,
    selectedChoices: [],
    feedback: null,
    submitting: false,
  };
}

export default function LldGameScreen({ systemId, config, onQuit }) {
  const [state, setState] = useState(createInitialState(config));

  const currentLevel = useMemo(() => {
    if (state.gameOver) return null;
    return config.levels[state.levelIdx - 1] ?? null;
  }, [config, state]);

  const currentQuestion = currentLevel?.questions[state.questionIdx] ?? null;

  function handleToggleChoice(choice) {
    if (!currentQuestion) return;
    setState((prev) => ({
      ...prev,
      selectedChoices: toggleChoice(
        prev.selectedChoices,
        choice,
        currentQuestion.type,
      ),
      feedback: null,
    }));
  }

  async function handleSubmit() {
    if (!currentQuestion || !hasSelection(state.selectedChoices) || state.submitting) {
      return;
    }

    setState((prev) => ({ ...prev, submitting: true, feedback: null }));

    try {
      const response = await validateAnswer(
        systemId,
        state.levelIdx,
        currentQuestion.question_id,
        formatSelectedForApi(state.selectedChoices, currentQuestion.type),
      );

      if (response.is_correct) {
        let nextCanvas = applyMutation(state.canvas, response.uml_mutation);
        const questionsInLevel = currentLevel.questions.length;
        let nextLevelIdx = state.levelIdx;
        let nextQuestionIdx = state.questionIdx + 1;
        let feedback = {
          isCorrect: true,
          title: "Correct",
          text: response.explanation,
        };
        let gameOver = false;

        if (nextQuestionIdx >= questionsInLevel) {
          nextLevelIdx += 1;
          nextQuestionIdx = 0;
          feedback = {
            isCorrect: true,
            title: "Level complete",
            text: response.explanation,
          };
          if (nextLevelIdx > config.total_levels) {
            gameOver = true;
          } else if (config.levels[nextLevelIdx - 1]?.initial_canvas) {
            nextCanvas = config.levels[nextLevelIdx - 1].initial_canvas;
          }
        }

        setState((prev) => ({
          ...prev,
          canvas: nextCanvas,
          score: prev.score + SCORE_PER_QUESTION,
          levelIdx: nextLevelIdx,
          questionIdx: nextQuestionIdx,
          gameOver,
          selectedChoices: [],
          feedback,
          submitting: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          feedback: {
            isCorrect: false,
            title: "Design conflict",
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
          title: "Network error",
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
              LLD Session
            </span>
            <h2 className="text-xl font-extrabold">{config.system_title}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-xl font-black text-amber-400">{state.score} pts</p>
            </div>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Quit
            </button>
          </div>
        </div>

        {!state.gameOver && currentQuestion ? (
          <QuestionPanel
            currentLevel={currentLevel}
            currentQuestion={currentQuestion}
            selectedChoices={state.selectedChoices}
            onToggleChoice={handleToggleChoice}
            onSubmit={handleSubmit}
            submitting={state.submitting}
            feedback={state.feedback}
            accent="orange"
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-emerald-800 bg-emerald-950/30 p-8 text-center text-emerald-300">
            <h3 className="text-2xl font-black">Blueprint validated</h3>
            <p className="mx-auto max-w-md text-sm text-emerald-400/80">
              Final score: {state.score} points. Class diagram assembly complete.
            </p>
            <button
              type="button"
              onClick={onQuit}
              className="mt-2 rounded-lg bg-emerald-600 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500"
            >
              Return to dashboard
            </button>
          </div>
        )}

        <LldGameCanvas source={state.canvas} />
      </div>
    </div>
  );
}
