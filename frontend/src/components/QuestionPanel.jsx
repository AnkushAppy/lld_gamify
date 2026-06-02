export default function QuestionPanel({
  currentLevel,
  currentQuestion,
  selected,
  onSelect,
  onSubmit,
  submitting,
  feedback,
  accent = "orange",
}) {
  const accentClasses =
    accent === "sky"
      ? {
          selected: "border-sky-500 bg-sky-950/40 text-sky-200",
          button: "from-sky-600 to-cyan-600",
          radio: "accent-sky-500",
          badge: "border-sky-800 bg-sky-950 text-sky-400",
        }
      : {
          selected: "border-orange-500 bg-orange-950/40 text-orange-200",
          button: "from-orange-600 to-amber-600",
          radio: "accent-orange-500",
          badge: "border-sky-800 bg-sky-950 text-sky-400",
        };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200">{currentLevel.title}</h3>
          <p className="text-xs italic text-slate-400">{currentLevel.description}</p>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-bold ${accentClasses.badge}`}
        >
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
              selected === choice
                ? accentClasses.selected
                : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900"
            }`}
          >
            <input
              type="radio"
              name="quiz_choice"
              value={choice}
              checked={selected === choice}
              onChange={(e) => onSelect(e.target.value)}
              className={`mr-3 h-4 w-4 ${accentClasses.radio}`}
            />
            <span className="text-sm font-medium">{choice}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!selected || submitting}
        className={`w-full rounded-lg bg-gradient-to-r ${accentClasses.button} py-3 text-sm font-bold tracking-wide shadow-md transition-all disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500`}
      >
        {submitting ? "Validating..." : "Check answer"}
      </button>

      {feedback && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            feedback.isCorrect
              ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
              : "border-rose-800 bg-rose-950/40 text-rose-300"
          }`}
        >
          <h4 className="mb-1 font-bold">{feedback.title}</h4>
          <p>{feedback.text}</p>
        </div>
      )}
    </div>
  );
}
