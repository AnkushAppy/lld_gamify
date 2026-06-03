import { couplingLabel } from "../cleanCodeEngine.js";

export default function CouplingMeter({ score, delta = 0 }) {
  const label = couplingLabel(score);
  const color =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="rounded-lg border border-violet-900/40 bg-slate-950/60 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
          Decoupling Score
        </span>
        <div className="flex items-baseline gap-2">
          {delta > 0 ? (
            <span className="font-mono text-xs font-bold text-emerald-400">
              +{delta}
            </span>
          ) : null}
          <span className="font-mono text-sm font-bold text-slate-200">
            {score}/100
          </span>
        </div>
      </div>
      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
