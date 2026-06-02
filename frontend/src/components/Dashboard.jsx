export default function Dashboard({ tracks, onSelect, loading, error }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading architecture tracks...
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

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans text-slate-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-4xl font-black text-transparent">
          🕹️ LLD SPEEDRUN ARCHITECT
        </h1>
        <p className="mb-8 text-slate-400">
          Choose a system design track to begin your 15-minute assembly.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {tracks.map((track) => (
            <div
              key={track.system_id}
              className={`rounded-xl border p-6 shadow-xl transition-all ${
                track.available
                  ? "border-slate-800 bg-slate-900 hover:border-orange-500"
                  : "border-slate-800/60 bg-slate-900/50 opacity-70"
              }`}
            >
              <h3 className="mb-2 text-xl font-bold">
                {track.icon} {track.title}
              </h3>
              <p className="mb-6 text-sm text-slate-400">{track.tagline}</p>
              <button
                type="button"
                disabled={!track.available}
                onClick={() => onSelect(track.system_id)}
                className="w-full rounded-lg bg-orange-600 py-2.5 font-bold text-white transition-all hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
              >
                {track.available ? "Launch Speedrun Engine" : "Coming Soon"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
