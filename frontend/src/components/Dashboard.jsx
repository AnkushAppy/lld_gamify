const DISCIPLINE_COPY = {
  lld: {
    heading: "LLD Blueprint Assembly",
    description:
      "Pick a system design track. Answer questions to build the UML class diagram piece by piece.",
    accent: "text-orange-400 group-hover:text-orange-300",
    ring: "focus-visible:ring-orange-500",
    borderHover: "hover:border-orange-500/70 hover:shadow-orange-950/20",
  },
  hld: {
    heading: "HLD Infrastructure Assembly",
    description:
      "Pick a distributed systems track. Place components and watch availability, latency, and cost respond to your choices.",
    accent: "text-sky-400 group-hover:text-sky-300",
    ring: "focus-visible:ring-sky-500",
    borderHover: "hover:border-sky-500/70 hover:shadow-sky-950/20",
  },
};

function TrackCard({ track, discipline, onSelect }) {
  const copy = DISCIPLINE_COPY[discipline];

  if (!track.available) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 opacity-60">
        <div className="mb-3 text-3xl">{track.icon}</div>
        <h3 className="mb-2 text-lg font-bold text-slate-300">{track.title}</h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-500">{track.tagline}</p>
        <span className="inline-block rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-500">
          Coming soon
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(track.system_id)}
      className={`group flex h-full w-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-6 text-left shadow-xl transition-all hover:-translate-y-0.5 ${copy.borderHover} focus:outline-none focus-visible:ring-2 ${copy.ring}`}
    >
      <div className="mb-3 text-3xl">{track.icon}</div>
      <h3 className="mb-2 text-lg font-bold text-slate-100">{track.title}</h3>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-400">{track.tagline}</p>
      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${copy.accent}`}>
        Start track
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

export default function Dashboard({
  discipline,
  tracks,
  onSelect,
  onBack,
  loading,
  error,
}) {
  const copy = DISCIPLINE_COPY[discipline];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading tracks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-rose-300">
        {error}
      </div>
    );
  }

  const availableCount = tracks.filter((t) => t.available).length;

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans text-slate-100">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm text-slate-500 transition-colors hover:text-slate-300"
        >
          ← Back to disciplines
        </button>

        <header className="mb-10">
          <h1 className="mb-2 text-4xl font-black text-slate-100">{copy.heading}</h1>
          <p className="max-w-xl text-slate-400">{copy.description}</p>
          {availableCount > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {availableCount} track{availableCount === 1 ? "" : "s"} ready
            </p>
          )}
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.system_id}
              track={track}
              discipline={discipline}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
