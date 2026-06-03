const DISCIPLINE_META = {
  lld: {
    title: "Low-Level Design",
    subtitle: "Classes, patterns, and maintainable object models.",
    accent: "from-orange-400 to-amber-500",
    borderHover: "hover:border-orange-500/70",
    cta: "Explore LLD tracks",
    ctaColor: "text-orange-400 group-hover:text-orange-300",
    icon: "🧩",
    ring: "focus-visible:ring-orange-500",
  },
  hld: {
    title: "High-Level Design",
    subtitle: "Scalability, availability, and distributed infrastructure.",
    accent: "from-sky-400 to-cyan-500",
    borderHover: "hover:border-sky-500/70",
    cta: "Explore HLD tracks",
    ctaColor: "text-sky-400 group-hover:text-sky-300",
    icon: "☁️",
    ring: "focus-visible:ring-sky-500",
  },
  clean_code: {
    title: "Clean Code",
    subtitle: "SOLID, KISS, YAGNI, and polymorphism through live refactoring.",
    accent: "from-violet-400 to-purple-500",
    borderHover: "hover:border-violet-500/70",
    cta: "Explore Clean Code tracks",
    ctaColor: "text-violet-400 group-hover:text-violet-300",
    icon: "✨",
    ring: "focus-visible:ring-violet-500",
  },
};

function DisciplineCard({ discipline, onSelect }) {
  const meta = DISCIPLINE_META[discipline];

  return (
    <button
      type="button"
      onClick={() => onSelect(discipline)}
      className={`group flex h-full w-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-8 text-left shadow-xl transition-all hover:-translate-y-0.5 ${meta.borderHover} focus:outline-none focus-visible:ring-2 ${meta.ring}`}
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
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta.ctaColor}`}
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
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-orange-400 via-cyan-400 to-violet-400 bg-clip-text text-4xl font-black text-transparent">
            Architecture Speedrun
          </h1>
          <p className="mx-auto max-w-xl text-slate-400">
            Choose your discipline. Build class diagrams, infrastructure
            flowcharts, or refactor tangled code into clean abstractions.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DisciplineCard discipline="lld" onSelect={onSelect} />
          <DisciplineCard discipline="hld" onSelect={onSelect} />
          <DisciplineCard discipline="clean_code" onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
