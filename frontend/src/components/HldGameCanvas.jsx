import DiagramCanvas from "./DiagramCanvas.jsx";

export default function HldGameCanvas({ source }) {
  return (
    <div className="space-y-4 rounded-xl border border-sky-900/50 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
      <div className="flex items-center border-b border-sky-900/40 pb-3">
        <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-sky-300">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
          Infrastructure Topology
        </h3>
        <span className="ml-auto rounded border border-sky-800/60 bg-sky-950/50 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
          flowchart TD
        </span>
      </div>
      <DiagramCanvas source={source} variant="hld" />
    </div>
  );
}
