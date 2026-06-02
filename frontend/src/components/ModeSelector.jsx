const DISCIPLINE_META = {
  lld: {
    title: "Low-Level Design",
    subtitle: "Classes, patterns, and maintainable object models.",
    accent: "from-orange-400 to-amber-500",
    borderHover: "hover:border-orange-500/70",
    cta: "Explore LLD tracks",
    icon: "🧩",
  },
  hld: {
    title: "High-Level Design",
    subtitle: "Scalability, availability, and distributed infrastructure.",
    accent: "from-sky-400 to-cyan-500",
    borderHover: "hover:border-sky-500/70",
    cta: "Explore HLD tracks",
    icon: "☁️",
  },
};

function DisciplineCard({ discipline, onSelect }) {
  const meta = DISCIPLINE_META[discipline];

  return (
    <button
      type="button"
      onClick={() => onSelect(discipline)}
      className={`group flex h-full w-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-8 text-left shadow-xl transition-all hover:-translate-y-0.5 ${meta.borderHover} focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
    >
      <div className="mb-4 text-4xl">{meta.icon}</div>
      <h2
        className={`mb-2 bg-gradient-to-r ${meta.accent} bg-clip-text text-2xl font-black text-transparent`}
      >
        {meta.title}
      </h2>
      <p className="mb-8 flex-1 text-sm leading-relaxed text-slate-400">
        {meta.subtitle}
      </p>
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
          discipline === "lld" ? "text-orange-400 group-hover:text-orange-300" : "text-sky-400 group-hover:text-sky-300"
        }`}
      >
        {meta.cta}
        <svg
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </span>
    </button>
  );
}

export default function ModeSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-4xl font-black text-transparent">
            Architecture Speedrun
          </h1>
          <p className="mx-auto max-w-lg text-slate-400">
            Choose your discipline. LLD builds class diagrams; HLD assembles
            infrastructure flowcharts under live health constraints.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <DisciplineCard discipline="lld" onSelect={onSelect} />
          <DisciplineCard discipline="hld" onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
