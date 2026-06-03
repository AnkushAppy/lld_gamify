import {
  appendLines,
  applyMutationMode,
  normalizeCanvas,
} from "./mutationEngine.js";

const CANVAS_HEADER = "classDiagram\n";
const PLACEHOLDER_NOTE = 'note "Start"';

export function initCanvas() {
  return `${CANVAS_HEADER}note "Start"\n`;
}

function normalizeEmptyClass(mutation) {
  return mutation.replace(/class\s+(\w+)\s*\{\s*\}/g, "class $1");
}

function extractClassBlock(text) {
  const blockMatch = text.match(/^class\s+(\w+)\s*\{/);
  if (!blockMatch) {
    const bareMatch = text.match(/^class\s+(\w+)\s*(?:\n|$)/);
    if (!bareMatch) return null;
    const end = bareMatch[0].length;
    return {
      name: bareMatch[1],
      block: text.slice(0, end).trimEnd() + "\n",
      remainder: text.slice(end).trimStart(),
    };
  }

  const name = blockMatch[1];
  let depth = 0;
  for (let i = blockMatch.index; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        let block = text.slice(blockMatch.index, i + 1);
        if (!block.endsWith("\n")) block += "\n";
        return { name, block, remainder: text.slice(i + 1).trimStart() };
      }
    }
  }
  return null;
}

function replaceOrAppendClass(canvas, className, classBlock) {
  const pattern = new RegExp(
    `class\\s+${className}\\s*(?:\\{[\\s\\S]*?\\})?\\n?`,
  );
  if (pattern.test(canvas)) {
    return canvas.replace(pattern, classBlock);
  }
  return canvas + classBlock;
}

function applyIncremental(canvas, mutation) {
  let nextCanvas =
    canvas === CANVAS_HEADER || canvas.includes(PLACEHOLDER_NOTE)
      ? CANVAS_HEADER
      : canvas;

  let remaining = normalizeEmptyClass(mutation.trim());
  if (!remaining.endsWith("\n")) remaining += "\n";

  while (remaining.trim()) {
    const classPart = extractClassBlock(remaining);
    if (classPart) {
      nextCanvas = replaceOrAppendClass(
        nextCanvas,
        classPart.name,
        classPart.block,
      );
      remaining = classPart.remainder;
      continue;
    }

    const newlineIndex = remaining.indexOf("\n");
    const line =
      newlineIndex === -1 ? remaining : remaining.slice(0, newlineIndex);
    remaining = newlineIndex === -1 ? "" : remaining.slice(newlineIndex + 1);
    if (line.trim()) {
      nextCanvas = appendLines(nextCanvas, line);
    }
  }

  return nextCanvas;
}

export function applyMutation(canvas, mutation) {
  if (!mutation?.trim()) return canvas;

  const { canvas: staged, mode } = applyMutationMode(canvas, mutation);
  if (mode === "snapshot") return normalizeCanvas(mutation);
  if (mode === "style") return staged;

  return applyIncremental(canvas, mutation);
}
