const HLD_CANVAS_HEADER = "flowchart TD\n";
const HLD_PLACEHOLDER =
  'placeholder["Answer questions to assemble the architecture"]';

export function initHldCanvas() {
  return `${HLD_CANVAS_HEADER}    ${HLD_PLACEHOLDER}\n`;
}

function appendLine(canvas, line) {
  const trimmed = line.trim();
  if (!trimmed || canvas.includes(trimmed)) return canvas;
  if (!canvas.endsWith("\n")) canvas += "\n";
  return `${canvas}${trimmed}\n`;
}

export function applyHldMutation(canvas, mutation) {
  if (!mutation?.trim()) return canvas;

  let nextCanvas =
    canvas === HLD_CANVAS_HEADER || canvas.includes(HLD_PLACEHOLDER)
      ? HLD_CANVAS_HEADER
      : canvas;

  for (const line of mutation.trim().split("\n")) {
    nextCanvas = appendLine(nextCanvas, line);
  }

  return nextCanvas;
}

export const HLD_METER_DEFAULTS = {
  availability: 55,
  latency: 220,
  cost: 35,
};

export function applyHealthImpact(meters, impact) {
  if (!impact) return meters;
  return {
    availability: clamp(meters.availability + (impact.availability ?? 0), 0, 100),
    latency: clamp(meters.latency + (impact.latency ?? 0), 20, 500),
    cost: clamp(meters.cost + (impact.cost ?? 0), 0, 100),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function metersHealthy(meters) {
  return meters.availability >= 85 && meters.latency <= 80 && meters.cost <= 60;
}
