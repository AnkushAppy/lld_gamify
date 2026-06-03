import DiagramCanvas from "./DiagramCanvas.jsx";

export default function CleanCodeGameCanvas({ source }) {
  return (
    <div className="space-y-4 rounded-xl border border-violet-900/40 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-center border-b border-violet-900/30 pb-3">
        <h3 className="flex items-center text-xs font-bold uppercase tracking-wide text-violet-300">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          Dependency & Abstraction Graph
        </h3>
        <span className="ml-auto rounded border border-violet-800/60 bg-violet-950/50 px-2 py-0.5 font-mono text-[10px] text-violet-400">
          classDiagram
        </span>
      </div>
      <DiagramCanvas source={source} variant="clean_code" />
    </div>
  );
}
