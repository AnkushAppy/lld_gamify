import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";

let mermaidReady = false;

function ensureMermaid() {
  if (!mermaidReady) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    });
    mermaidReady = true;
  }
}

export default function DiagramCanvas({ source, variant = "lld" }) {
  const isHld = variant === "hld";
  const containerRef = useRef(null);
  const renderId = useId().replace(/:/g, "");

  useEffect(() => {
    ensureMermaid();
    let cancelled = false;

    async function renderDiagram() {
      if (!containerRef.current || !source?.trim()) return;
      try {
        const { svg } = await mermaid.render(
          `diagram-${renderId}-${Date.now()}`,
          source,
        );
        if (!cancelled) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (!cancelled) {
          containerRef.current.innerHTML = `<pre class="text-rose-300 text-sm whitespace-pre-wrap">${error.message}</pre>`;
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [source, renderId]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className={`min-h-[360px] w-full flex items-center justify-center overflow-x-auto rounded-xl border p-6 ${
          isHld
            ? "border-sky-900/40 bg-slate-950/80"
            : "border-slate-800 bg-slate-950"
        }`}
      />
      <details className="rounded-lg border border-slate-800 bg-slate-950 p-3">
        <summary className="cursor-pointer text-sm text-slate-400">
          Mermaid Source (copy to mermaid.live)
        </summary>
        <textarea
          readOnly
          value={source}
          rows={8}
          className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-300"
        />
      </details>
    </div>
  );
}
