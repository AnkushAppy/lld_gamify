export const LLD_PLACEHOLDER = 'classDiagram\nnote "Start"\n';
export const HLD_PLACEHOLDER = 'flowchart TD\n    placeholder["Start"]\n';

export function initCanvas() {
  return LLD_PLACEHOLDER;
}

export function initHldCanvas() {
  return HLD_PLACEHOLDER;
}

export function initialCanvasFor(config) {
  if (config.initial_canvas) {
    return config.initial_canvas;
  }

  const levels = config.levels ?? [];
  if (levels[0]?.initial_canvas) {
    return levels[0].initial_canvas;
  }

  if (config.discipline === "hld") {
    return initHldCanvas();
  }

  return initCanvas();
}
