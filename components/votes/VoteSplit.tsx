// Compact split of votes cast: za / przeciw / wstrzymało się, as a thin bar plus counts
export function VoteSplit({ yes, no, abstain, className = '' }: { yes: number; no: number; abstain: number; className?: string }) {
  const cast = yes + no + abstain;
  if (cast === 0) return null;
  return (
    // Wraps the counts under the bar on narrow screens instead of squeezing them
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      <span className="flex h-1.5 w-28 flex-shrink-0 gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
        <span className="bg-emerald-500" style={{ width: `${(yes / cast) * 100}%` }} />
        <span className="bg-rose-500" style={{ width: `${(no / cast) * 100}%` }} />
        <span className="bg-amber-400" style={{ width: `${(abstain / cast) * 100}%` }} />
      </span>
      <span className="text-[11px] text-slate-500 tabular whitespace-nowrap">
        za {yes} · przeciw {no} · wstrz. {abstain}
      </span>
    </div>
  );
}
