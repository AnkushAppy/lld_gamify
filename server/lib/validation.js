export const DEFAULT_COUPLING_IMPACT = { coupling: 12 };
export const DEFAULT_HEALTH_IMPACT = {
  availability: 8,
  latency: -15,
  cost: 5,
};

export function normalizeSelected(selected) {
  if (Array.isArray(selected)) {
    return selected;
  }
  return selected ? [selected] : [];
}

export function answersMatch(question, selected) {
  const qType = question.type ?? "radio";
  const correct = question.correct_answer;
  const selectedList = normalizeSelected(selected);

  if (qType === "checkbox") {
    if (!Array.isArray(correct)) {
      return false;
    }
    const selectedSet = new Set(selectedList);
    const correctSet = new Set(correct);
    if (selectedSet.size !== correctSet.size) {
      return false;
    }
    for (const answer of correctSet) {
      if (!selectedSet.has(answer)) {
        return false;
      }
    }
    return true;
  }

  const expected =
    Array.isArray(correct) && correct.length === 1 ? correct[0] : correct;
  if (typeof expected !== "string") {
    return false;
  }
  return selectedList.length === 1 && selectedList[0] === expected;
}

export function validateAnswer(config, resolveDiscipline, question, isCorrect) {
  let healthImpact = null;
  let couplingImpact = null;

  if (isCorrect) {
    const discipline = resolveDiscipline(config);
    if (discipline === "hld") {
      healthImpact = question.health_impact ?? DEFAULT_HEALTH_IMPACT;
    } else if (discipline === "clean_code") {
      couplingImpact = question.coupling_impact ?? DEFAULT_COUPLING_IMPACT;
    }
  }

  return {
    is_correct: isCorrect,
    explanation: question.explanation,
    uml_mutation: isCorrect ? question.uml_mutation : "",
    skill_tag: question.skill_tag,
    health_impact: healthImpact,
    coupling_impact: couplingImpact,
  };
}
