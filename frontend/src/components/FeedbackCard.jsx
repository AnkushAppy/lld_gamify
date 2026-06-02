export default function FeedbackCard({ feedback }) {
  if (!feedback) {
    return (
      <p className="feedback-placeholder">
        Select an architectural design option to kick off the speedrun assembly.
      </p>
    );
  }

  const className =
    feedback.type === "success"
      ? "feedback-card success"
      : feedback.type === "level"
        ? "feedback-card level"
        : "feedback-card error";

  return (
    <div className={className}>
      <h3>{feedback.title}</h3>
      {feedback.body.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}
