function MeterBar({ label, value, unit, good, warn, invert = false }) {
  const display = invert
    ? Math.max(0, Math.min(100, 100 - ((value - 20) / 480) * 100))
    : value;
  const color =
    good !== undefined && (invert ? value <= good : value >= good)
      ? "bg-emerald-500"
      : warn !== undefined && (invert ? value <= warn : value >= warn)
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-400">{label}</span>
        <span className="font-mono font-bold text-slate-200">
          {value}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${display}%` }}
        />
      </div>
    </div>
  );
}

export default function HealthMeters({ meters }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <MeterBar label="Availability (HA)" value={meters.availability} unit="%" good={85} warn={70} />
      <MeterBar label="Latency" value={meters.latency} unit="ms" good={80} warn={150} invert />
      <MeterBar label="Cost Index" value={meters.cost} unit="" good={40} warn={60} invert />
    </div>
  );
}
