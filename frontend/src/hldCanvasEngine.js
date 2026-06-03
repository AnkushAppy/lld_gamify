import { appendLines, applyMutationMode, normalizeCanvas } from "./mutationEngine.js";

const HLD_CANVAS_HEADER = "flowchart TD\n";
const HLD_PLACEHOLDER =
  'placeholder["Start"]';

export function initHldCanvas() {
  return `${HLD_CANVAS_HEADER}    ${HLD_PLACEHOLDER}\n`;
}

function applyIncremental(canvas, mutation) {
  let nextCanvas =
    canvas === HLD_CANVAS_HEADER || canvas.includes(HLD_PLACEHOLDER)
      ? HLD_CANVAS_HEADER
      : canvas;

  return appendLines(nextCanvas, mutation);
}

export function applyHldMutation(canvas, mutation) {
  if (!mutation?.trim()) return canvas;

  const { canvas: staged, mode } = applyMutationMode(canvas, mutation);
  if (mode === "snapshot") return normalizeCanvas(mutation);
  if (mode === "style") return staged;

  return applyIncremental(canvas, mutation);
}

export const HLD_METER_DEFAULTS = {
  availability: 55,
  latency: 220,
  cost: 35,
};

export const DEFAULT_HEALTH_IMPACT = {
  availability: 8,
  latency: -15,
  cost: 5,
};

export function resolveHealthImpact(apiImpact) {
  if (apiImpact && Object.keys(apiImpact).length > 0) {
    return apiImpact;
  }
  return DEFAULT_HEALTH_IMPACT;
}

export function applyHealthImpact(meters, impact) {
  if (!impact) {
    return { ...meters };
  }
  return {
    availability: clamp(
      (meters.availability ?? 0) + (impact.availability ?? 0),
      0,
      100,
    ),
    latency: clamp((meters.latency ?? 0) + (impact.latency ?? 0), 20, 500),
    cost: clamp((meters.cost ?? 0) + (impact.cost ?? 0), 0, 100),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function metersHealthy(meters) {
  return meters.availability >= 85 && meters.latency <= 80 && meters.cost <= 60;
}
