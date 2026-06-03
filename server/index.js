import cors from "cors";
import express from "express";
import {
  DISCIPLINES,
  discoverConfigPaths,
  findQuestion,
  listSystems,
  loadConfig,
  resolveDiscipline,
  sanitizeConfig,
} from "./lib/config.js";
import { answersMatch, validateAnswer } from "./lib/validation.js";

const app = express();
const PORT = Number(process.env.PORT) || 8001;
const corsOrigins = process.env.CORS_ORIGINS?.split(",") ?? ["*"];

app.use(express.json());
app.use(
  cors({
    origin: corsOrigins.includes("*") ? true : corsOrigins,
    credentials: true,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/systems", (req, res, next) => {
  try {
    const discipline = req.query.discipline ?? "lld";
    if (!DISCIPLINES.includes(discipline)) {
      return res.status(422).json({ detail: "Invalid discipline." });
    }
    res.json(listSystems(discipline));
  } catch (error) {
    next(error);
  }
});

app.get("/api/game/start/:systemId", (req, res, next) => {
  try {
    const config = loadConfig(req.params.systemId);
    res.json(sanitizeConfig(config));
  } catch (error) {
    next(error);
  }
});

app.get("/api/game/start", (_req, res, next) => {
  try {
    const discovered = discoverConfigPaths();
    if (discovered.size === 0) {
      return res.status(404).json({ detail: "No quiz configs found." });
    }
    const firstId = [...discovered.keys()].sort()[0];
    const config = loadConfig(firstId);
    res.json(sanitizeConfig(config));
  } catch (error) {
    next(error);
  }
});

app.get("/api/config/:systemId", (req, res, next) => {
  try {
    res.json(loadConfig(req.params.systemId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/game/validate", (req, res, next) => {
  try {
    const { system_id, level_index, question_id, selected_answer } = req.body ?? {};

    if (!system_id || !level_index || !question_id || selected_answer == null) {
      return res.status(422).json({ detail: "Missing required validation fields." });
    }

    const config = loadConfig(system_id);
    const question = findQuestion(config, level_index, question_id);
    const isCorrect = answersMatch(question, selected_answer);

    res.json(
      validateAnswer(config, resolveDiscipline, question, isCorrect),
    );
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const status = error.status ?? 500;
  res.status(status).json({
    detail: error.detail ?? error.message ?? "Internal server error.",
  });
});

const server = app.listen(PORT, () => {
  console.log("\n🚀 Architecture Speedrun API (Node.js) running");
  console.log(`👉 http://127.0.0.1:${PORT}/api/health`);
  console.log("👉 Start frontend: npm run dev:web\n");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use. Pick another port, e.g. PORT=8002 npm run dev:api\n`,
    );
    process.exit(1);
  }
  throw error;
});
