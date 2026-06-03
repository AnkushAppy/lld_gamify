const SNAPSHOT_HEADER_PREFIXES = ["classdiagram", "flowchart", "graph"];

const STYLE_LINE_PATTERN =
  /^(style\s|classdef\s|class\s+\w+\s+\w+|linkstyle\s|click\s)/i;

export function normalizeCanvas(text) {
  const stripped = text?.trim() ?? "";
  if (!stripped) return "";
  return stripped.endsWith("\n") ? stripped : `${stripped}\n`;
}

export function isSnapshotMutation(mutation) {
  const lines = mutation
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return false;
  const first = lines[0].toLowerCase();
  return SNAPSHOT_HEADER_PREFIXES.some((prefix) => first.startsWith(prefix));
}

export function isStyleMutation(mutation) {
  const lines = mutation
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return false;
  return lines.every((line) => STYLE_LINE_PATTERN.test(line));
}

export function appendLines(canvas, mutation) {
  let result = canvas;
  for (const line of mutation.trim().split("\n")) {
    const stripped = line.trim();
    if (!stripped || result.includes(stripped)) continue;
    if (result && !result.endsWith("\n")) result += "\n";
    result += `${stripped}\n`;
  }
  return result;
}

export function applyMutationMode(canvas, mutation) {
  if (!mutation?.trim()) {
    return { canvas, mode: "incremental" };
  }

  if (isSnapshotMutation(mutation)) {
    return { canvas: normalizeCanvas(mutation), mode: "snapshot" };
  }

  if (isStyleMutation(mutation)) {
    return { canvas: appendLines(canvas, mutation), mode: "style" };
  }

  return { canvas, mode: "incremental" };
}

export function resolveLevelCanvas(config, levelIndex) {
  const level = config.levels?.[levelIndex - 1];
  if (level?.initial_canvas) return level.initial_canvas;
  return config.initial_canvas;
}
