import { useMemo, useState } from "react";
import { formatSelectedForApi, hasSelection, toggleChoice } from "../answerUtils.js";
import { validateAnswer } from "../api.js";
import {
  HLD_METER_DEFAULTS,
  applyHealthImpact,
  applyHldMutation,
  metersHealthy,
} from "../hldCanvasEngine.js";
import ChaosVictory from "./ChaosVictory.jsx";
import HealthMeters from "./HealthMeters.jsx";
import HldGameCanvas from "./HldGameCanvas.jsx";
import QuestionPanel from "./QuestionPanel.jsx";

function createInitialState(config) {
  return {
    levelIdx: 1,
    questionIdx: 0,
    canvas: config.initial_canvas,
    meters: { ...HLD_METER_DEFAULTS },
    gameOver: false,
    selectedChoices: [],
    feedback: null,
    submitting: false,
  };
}

export default function HldGameScreen({ systemId, config, onQuit }) {
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
        const nextCanvas = applyHldMutation(state.canvas, response.uml_mutation);
        const nextMeters = applyHealthImpact(state.meters, response.health_impact);
        const questionsInLevel = currentLevel.questions.length;
        let nextLevelIdx = state.levelIdx;
        let nextQuestionIdx = state.questionIdx + 1;
        let feedback = {
          isCorrect: true,
          title: "Component placed",
          text: response.explanation,
        };
        let gameOver = false;

        if (nextQuestionIdx >= questionsInLevel) {
          nextLevelIdx += 1;
          nextQuestionIdx = 0;
          feedback = {
            isCorrect: true,
            title: "Tier complete",
            text: response.explanation,
          };
          if (nextLevelIdx > config.total_levels) {
            gameOver = true;
          }
        }

        setState((prev) => ({
          ...prev,
          canvas: nextCanvas,
          meters: nextMeters,
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
            title: "Architecture risk detected",
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
        <div className="space-y-4 rounded-xl border border-sky-900/50 bg-slate-900 p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                HLD Session
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
          <HealthMeters meters={state.meters} />
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
            accent="sky"
          />
        ) : (
          <ChaosVictory
            scenario={config.chaos_scenario}
            metersHealthy={metersHealthy(state.meters)}
            onQuit={onQuit}
          />
        )}

        <HldGameCanvas source={state.canvas} />
      </div>
    </div>
  );
}
