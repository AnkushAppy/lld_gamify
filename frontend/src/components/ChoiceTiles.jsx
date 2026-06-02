export default function ChoiceTiles({
  choices,
  selected,
  result,
  disabled,
  onSelect,
}) {
  return (
    <div className="choice-grid">
      {choices.map((choice) => {
        let className = "choice-tile";
        if (selected === choice) className += " selected";
        if (result === "correct" && selected === choice) className += " correct";
        if (result === "incorrect" && selected === choice) className += " incorrect";

        return (
          <button
            key={choice}
            type="button"
            className={className}
            disabled={disabled}
            onClick={() => onSelect(choice)}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
