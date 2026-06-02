import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function fetchSystems(discipline = "lld") {
  const { data } = await api.get("/systems", { params: { discipline } });
  return data.tracks;
}

export async function startGame(systemId) {
  const { data } = await api.get(`/game/start/${systemId}`);
  return data;
}

export async function validateAnswer(
  systemId,
  levelIndex,
  questionId,
  selectedAnswer,
) {
  const { data } = await api.post("/game/validate", {
    system_id: systemId,
    level_index: levelIndex,
    question_id: questionId,
    selected_answer: selectedAnswer,
  });
  return data;
}
