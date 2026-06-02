import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export async function startGame() {
  const { data } = await api.get("/game/start");
  return data;
}

export async function validateAnswer(levelIndex, questionId, selectedAnswer) {
  const { data } = await api.post("/game/validate", {
    level_index: levelIndex,
    question_id: questionId,
    selected_answer: selectedAnswer,
  });
  return data;
}
