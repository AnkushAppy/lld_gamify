export function toggleChoice(selectedChoices, choice, questionType) {
  if (questionType === "checkbox") {
    if (selectedChoices.includes(choice)) {
      return selectedChoices.filter((item) => item !== choice);
    }
    return [...selectedChoices, choice];
  }
  return [choice];
}

export function hasSelection(selectedChoices) {
  return selectedChoices.length > 0;
}

export function formatSelectedForApi(selectedChoices, questionType) {
  if (questionType === "checkbox") {
    return selectedChoices;
  }
  return selectedChoices[0] ?? "";
}
