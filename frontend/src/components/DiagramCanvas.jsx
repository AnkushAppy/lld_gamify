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

export default function DiagramCanvas({ source }) {
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
          containerRef.current.innerHTML = `<pre class="diagram-error">${error.message}</pre>`;
        }
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [source, renderId]);

  return (
    <div className="diagram-panel">
      <div ref={containerRef} className="diagram-render" />
      <details className="source-panel" open>
        <summary>Mermaid Source</summary>
        <textarea readOnly value={source} rows={10} />
      </details>
    </div>
  );
}
