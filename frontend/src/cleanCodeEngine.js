export const COUPLING_DEFAULTS = { coupling: 22 };
export const DEFAULT_COUPLING_DELTA = 12;

export function resolveCouplingImpact(apiImpact) {
  if (apiImpact?.coupling != null) {
    return apiImpact;
  }
  return { coupling: DEFAULT_COUPLING_DELTA };
}

export function applyCouplingImpact(meters, impact) {
  if (!impact) {
    return { ...meters };
  }
  const current = meters?.coupling ?? COUPLING_DEFAULTS.coupling;
  return {
    coupling: clamp(current + (impact.coupling ?? 0), 0, 100),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function couplingLabel(score) {
  if (score >= 75) return "Highly Decoupled";
  if (score >= 50) return "Moderate Coupling";
  return "Dangerously Tangled";
}

export function couplingHealthy(score) {
  return score >= 75;
}
