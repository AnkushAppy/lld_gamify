import { useMemo, useState } from "react";
import { formatSelectedForApi, hasSelection, toggleChoice } from "../answerUtils.js";
import { validateAnswer } from "../api.js";
import { applyMutation } from "../canvasEngine.js";
import {
  COUPLING_DEFAULTS,
  applyCouplingImpact,
  couplingHealthy,
  couplingLabel,
  resolveCouplingImpact,
} from "../cleanCodeEngine.js";
import { resolveLevelCanvas } from "../mutationEngine.js";
import CleanCodeGameCanvas from "./CleanCodeGameCanvas.jsx";
import CouplingMeter from "./CouplingMeter.jsx";
import QuestionPanel from "./QuestionPanel.jsx";

function createInitialState(config) {
  return {
    levelIdx: 1,
    questionIdx: 0,
    canvas: resolveLevelCanvas(config, 1),
    coupling: { ...COUPLING_DEFAULTS },
    couplingDelta: 0,
    gameOver: false,
    selectedChoices: [],
    feedback: null,
    submitting: false,
  };
}

export default function CleanCodeGameScreen({ systemId, config, onQuit }) {
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

    const levelIdx = state.levelIdx;
    const questionId = currentQuestion.question_id;
    const selectedAnswer = formatSelectedForApi(
      state.selectedChoices,
      currentQuestion.type,
    );
    const questionsInLevel = currentLevel.questions.length;

    setState((prev) => ({ ...prev, submitting: true, feedback: null, couplingDelta: 0 }));

    try {
      const response = await validateAnswer(
        systemId,
        levelIdx,
        questionId,
        selectedAnswer,
      );

      if (response.is_correct) {
        setState((prev) => {
          const impact = resolveCouplingImpact(response.coupling_impact);
          const previousScore = prev.coupling.coupling;
          const nextCoupling = applyCouplingImpact(prev.coupling, impact);
          const couplingDelta = nextCoupling.coupling - previousScore;

          let nextCanvas = applyMutation(prev.canvas, response.uml_mutation);
          let nextLevelIdx = prev.levelIdx;
          let nextQuestionIdx = prev.questionIdx + 1;
          let feedback = {
            isCorrect: true,
            title: "Refactoring applied",
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

          return {
            ...prev,
            canvas: nextCanvas,
            coupling: nextCoupling,
            couplingDelta,
            levelIdx: nextLevelIdx,
            questionIdx: nextQuestionIdx,
            gameOver,
            selectedChoices: [],
            feedback,
            submitting: false,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          feedback: {
            isCorrect: false,
            title: "Code smell detected",
            text: `${response.skill_tag}: ${response.explanation}`,
          },
          submitting: false,
          couplingDelta: 0,
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        submitting: false,
        couplingDelta: 0,
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
        <div className="space-y-4 rounded-xl border border-violet-900/40 bg-slate-900 p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Clean Code Session
              </span>
              <h2 className="text-xl font-extrabold">{config.system_title}</h2>
            </div>
            <button
              type="button"
              onClick={onQuit}
              className="rounded-md bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
            >
              Quit
            </button>
          </div>
          <CouplingMeter score={state.coupling.coupling} delta={state.couplingDelta} />
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
            accent="violet"
          />
        ) : (
          <div className="space-y-3 rounded-xl border border-violet-800 bg-violet-950/30 p-8 text-center text-violet-200">
            <h3 className="text-2xl font-black">Refactoring validated</h3>
            <p className="mx-auto max-w-md text-sm text-violet-300/80">
              Final coupling score: {state.coupling.coupling}/100 —{" "}
              {couplingLabel(state.coupling.coupling)}.
              {couplingHealthy(state.coupling.coupling)
                ? " Your dependency graph is clean and extensible."
                : " Good progress — review remaining coupling hotspots."}
            </p>
            <button
              type="button"
              onClick={onQuit}
              className="mt-2 rounded-lg bg-violet-600 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-violet-500"
            >
              Return to dashboard
            </button>
          </div>
        )}

        <CleanCodeGameCanvas source={state.canvas} />
      </div>
    </div>
  );
}
