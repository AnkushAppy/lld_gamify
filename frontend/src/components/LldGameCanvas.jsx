import DiagramCanvas from "./DiagramCanvas.jsx";

export default function LldGameCanvas({ source }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-center border-b border-slate-800 pb-3">
        <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-slate-300">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live Class Diagram
        </h3>
        <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-orange-400">
          classDiagram
        </span>
      </div>
      <DiagramCanvas source={source} variant="lld" />
    </div>
  );
}
