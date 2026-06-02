export default function ProgressBar({ currentLevel, totalLevels, answered, totalQuestions }) {
  const levelPct = totalLevels ? Math.round((currentLevel / totalLevels) * 100) : 0;
  const questionPct = totalQuestions
    ? Math.round((answered / totalQuestions) * 100)
    : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-row">
        <span>Level {Math.min(currentLevel, totalLevels)}/{totalLevels}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${levelPct}%` }} />
        </div>
      </div>
      <div className="progress-row">
        <span>{answered}/{totalQuestions} questions</span>
        <div className="progress-track secondary">
          <div className="progress-fill" style={{ width: `${questionPct}%` }} />
        </div>
      </div>
    </div>
  );
}
