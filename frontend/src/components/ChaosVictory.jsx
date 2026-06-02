import { useEffect, useState } from "react";

export default function ChaosVictory({ scenario, metersHealthy, onQuit }) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [phase, setPhase] = useState("simulating");

  useEffect(() => {
    if (phase !== "simulating" || !scenario?.steps?.length) return undefined;

    const timers = scenario.steps.map((_, index) =>
      window.setTimeout(() => setVisibleSteps(index + 1), 800 + index * 900),
    );

    const doneTimer = window.setTimeout(
      () => setPhase("complete"),
      800 + scenario.steps.length * 900 + 400,
    );

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [phase, scenario]);

  const badge = scenario?.success_badge ?? "Master Infrastructure Architect";

  return (
    <div className="space-y-4 rounded-xl border border-sky-800/60 bg-gradient-to-b from-sky-950/40 to-slate-900 p-8 text-center">
      {phase === "simulating" && (
        <>
          <p className="animate-pulse text-sm font-bold uppercase tracking-widest text-cyan-400">
            ⚡ {scenario?.title ?? "Running chaos simulation..."}
          </p>
          <div className="mx-auto max-w-md space-y-2 text-left">
            {scenario?.steps?.map((step, index) => (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2 text-sm transition-all duration-500 ${
                  index < visibleSteps
                    ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-300 opacity-100"
                    : "border-slate-800 bg-slate-950/50 text-slate-600 opacity-40"
                }`}
              >
                <span>{index < visibleSteps ? "✓" : "·"}</span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === "complete" && (
        <>
          <h3 className="text-2xl font-black text-cyan-300">
            {metersHealthy ? "🏅" : "⚠️"} Chaos Simulation Complete
          </h3>
          <p className="mx-auto max-w-md text-sm text-slate-400">
            {metersHealthy
              ? `Your architecture survived the spike. Badge earned: ${badge}.`
              : "The system stayed up, but latency or cost exceeded targets. Review trade-offs and retry."}
          </p>
          <button
            type="button"
            onClick={onQuit}
            className="mt-2 rounded-lg bg-sky-600 px-6 py-2 text-xs font-bold text-white transition-all hover:bg-sky-500"
          >
            Return to dashboard
          </button>
        </>
      )}
    </div>
  );
}
