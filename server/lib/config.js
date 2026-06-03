import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initialCanvasFor } from "./canvas.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DISCIPLINES = ["lld", "hld", "clean_code"];
export const CONTENT_DIR = process.env.CONTENT_DIR
  ? path.resolve(process.env.CONTENT_DIR)
  : path.resolve(__dirname, "../../content");

const configCache = new Map();

function isDirectory(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

export function configDiscipline(config, configPath = null) {
  if ("discipline" in config) {
    const discipline = config.discipline;
    if (DISCIPLINES.includes(discipline)) {
      return discipline;
    }
  }

  if (configPath) {
    const parentParent = path.basename(path.dirname(path.dirname(configPath)));
    if (DISCIPLINES.includes(parentParent)) {
      return parentParent;
    }
  }

  return "lld";
}

export function resolveDiscipline(config) {
  return configDiscipline(config, config._config_path ?? null);
}

export function discoverConfigPaths() {
  const discovered = new Map();
  if (!isDirectory(CONTENT_DIR)) {
    return discovered;
  }

  for (const discipline of DISCIPLINES) {
    const disciplineDir = path.join(CONTENT_DIR, discipline);
    if (!isDirectory(disciplineDir)) {
      continue;
    }

    for (const entry of fs.readdirSync(disciplineDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const configPath = path.join(
        disciplineDir,
        entry.name,
        "quiz_config.json",
      );
      if (fs.existsSync(configPath)) {
        discovered.set(entry.name, configPath);
      }
    }
  }

  for (const entry of fs.readdirSync(CONTENT_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || DISCIPLINES.includes(entry.name)) {
      continue;
    }
    const configPath = path.join(CONTENT_DIR, entry.name, "quiz_config.json");
    if (fs.existsSync(configPath)) {
      discovered.set(entry.name, configPath);
    }
  }

  return discovered;
}

export function loadConfig(systemId) {
  if (configCache.has(systemId)) {
    const cached = configCache.get(systemId);
    if (cached._config_path) {
      cached.discipline = configDiscipline(cached, cached._config_path);
    }
    return cached;
  }

  const discovered = discoverConfigPaths();
  const configPath = discovered.get(systemId);
  if (!configPath) {
    const error = new Error(`System '${systemId}' not found.`);
    error.status = 404;
    throw error;
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  config._config_path = configPath;
  config.discipline = configDiscipline(config, configPath);
  configCache.set(systemId, config);
  return config;
}

export function loadTracksManifest(discipline) {
  const manifestPath = path.join(CONTENT_DIR, discipline, "tracks.json");
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  const payload = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return payload.tracks ?? [];
}

export function findQuestion(config, levelIndex, questionId) {
  const levels = config.levels;
  if (levelIndex < 1 || levelIndex > levels.length) {
    const error = new Error("Invalid level index.");
    error.status = 400;
    throw error;
  }

  const targetLevel = levels[levelIndex - 1];
  for (const question of targetLevel.questions) {
    if (question.question_id === questionId) {
      return question;
    }
  }

  const error = new Error("Question not found.");
  error.status = 404;
  throw error;
}

function sanitizeQuestion(question) {
  return {
    question_id: question.question_id,
    skill_tag: question.skill_tag,
    type: question.type ?? "radio",
    text: question.text,
    choices: question.choices,
  };
}

export function sanitizeConfig(config) {
  const discipline = config.discipline ?? "lld";
  const totalQuestions = config.levels.reduce(
    (sum, level) => sum + level.questions.length,
    0,
  );

  const payload = {
    system_id: config.system_id,
    system_title: config.system_title,
    discipline,
    canvas_type:
      config.canvas_type ??
      (discipline === "hld" ? "flowchart" : "classDiagram"),
    initial_canvas: initialCanvasFor(config),
    total_levels: config.levels.length,
    total_questions: totalQuestions,
    levels: config.levels.map((level) => ({
      level_index: level.level_index,
      title: level.title,
      description: level.description ?? "",
      ...(level.initial_canvas
        ? { initial_canvas: level.initial_canvas }
        : {}),
      questions: level.questions.map(sanitizeQuestion),
    })),
  };

  if (discipline === "hld" && config.chaos_scenario) {
    payload.chaos_scenario = config.chaos_scenario;
  }

  return payload;
}

export function listSystems(discipline) {
  const discovered = discoverConfigPaths();
  const manifest = loadTracksManifest(discipline);

  if (manifest.length > 0) {
    return {
      discipline,
      tracks: manifest.map((track) => ({
        system_id: track.system_id,
        discipline,
        icon: track.icon ?? "📦",
        title: track.title ?? track.system_id,
        tagline: track.tagline ?? "",
        available:
          discovered.has(track.system_id) && track.available !== false,
      })),
    };
  }

  const tracks = [];
  for (const [systemId, configPath] of discovered.entries()) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const configDisciplineValue = configDiscipline(config, configPath);
    if (configDisciplineValue !== discipline) {
      continue;
    }

    const firstLevel = config.levels?.[0] ?? {};
    tracks.push({
      system_id: systemId,
      discipline,
      icon: "📦",
      title: config.system_title ?? systemId,
      tagline: firstLevel.description ?? "",
      available: true,
    });
  }

  return { discipline, tracks };
}
