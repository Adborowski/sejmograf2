'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CARD_CLASS, EmptyState, ErrorState, Label, LoadingState, Page, PageHeader, SearchInput } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';
import { VotingDetail } from '@/components/votes/VotingDetail';
import { getVotingIndex } from '@/lib/firebase/firestore';
import { searchVotings, VotingIndex } from '@/lib/votings';

// ?q=search words, ?v=sitting/num — both kept in the URL so results can be shared
function VotingsSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [index, setIndex] = useState<VotingIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(params.get('q') ?? '');

  const selected = useMemo(() => {
    const match = params.get('v')?.match(/^(\d+)\/(\d+)$/);
    return match ? { sitting: Number(match[1]), num: Number(match[2]) } : null;
  }, [params]);

  useEffect(() => {
    getVotingIndex().then(setIndex).catch((e) => setError(e.message));
  }, []);

  const [limit, setLimit] = useState(20);
  const results = useMemo(() => (index ? searchVotings(index, query, { limit: limit + 1 }) : []), [index, query, limit]);
  const hasMore = results.length > limit;
  const visible = hasMore ? results.slice(0, limit) : results;

  const updateUrl = (next: { q?: string; v?: string | null }) => {
    const sp = new URLSearchParams(params.toString());
    for (const name of ['q', 'v'] as const) {
      const value = next[name];
      if (value === undefined) continue;
      if (value) sp.set(name, value);
      else sp.delete(name);
    }
    router.replace(`/glosowania${sp.toString() ? `?${sp}` : ''}`, { scroll: false });
  };

  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Głosowania"
        title="Jak głosował Sejm?"
        description="Przeszukaj wszystkie głosowania X kadencji i zobacz, jak głosowały kluby i poszczególni posłowie."
      />

      <div className={`${CARD_CLASS} p-4 sm:p-5 mb-6`}>
        <Label htmlFor="voting-search">Czego dotyczyło głosowanie?</Label>
        <SearchInput
          id="voting-search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLimit(20); updateUrl({ q: e.target.value }); }}
          placeholder="np. ochrona zwierząt, przerywanie ciąży, podatek, druk nr 1234"
        />
        {index && (
          <p className="text-xs text-slate-400 mt-2">
            {query.trim()
              ? `${hasMore ? `Ponad ${limit}` : visible.length} pasujących głosowań, najnowsze najpierw`
              : `${formatNumber(index.rows.length)} głosowań w kadencji — najnowsze:`}
          </p>
        )}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : !index ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <ul className={`${CARD_CLASS} lg:col-span-2 divide-y divide-slate-100 overflow-hidden`}>
            {visible.length === 0 && <li className="p-6 text-sm text-slate-500">Brak głosowań pasujących do zapytania.</li>}
            {visible.map((r) => {
              const key = `${r.sitting}/${r.num}`;
              const isSelected = selected && selected.sitting === r.sitting && selected.num === r.num;
              const cast = r.yes + r.no + r.abstain;
              return (
                <li key={key}>
                  <button
                    onClick={() => updateUrl({ v: key })}
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                      isSelected ? 'bg-blue-50/70 border-blue-600' : 'border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs text-slate-500">{formatDate(r.date)} · posiedzenie {r.sitting}, nr {r.num}</p>
                    <p className="text-sm text-slate-900 mt-0.5 line-clamp-2">{r.topic || r.title}</p>
                    {r.topic && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{r.title}</p>}
                    {!r.onList && cast > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        {/* Split of votes cast: za / przeciw / wstrzymało się */}
                        <span className="flex h-1.5 w-28 gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
                          <span className="bg-emerald-500" style={{ width: `${(r.yes / cast) * 100}%` }} />
                          <span className="bg-rose-500" style={{ width: `${(r.no / cast) * 100}%` }} />
                          <span className="bg-amber-400" style={{ width: `${(r.abstain / cast) * 100}%` }} />
                        </span>
                        <span className="text-[11px] text-slate-500 tabular">
                          za {r.yes} · przeciw {r.no} · wstrz. {r.abstain}
                        </span>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
            {hasMore && (
              <li>
                <button onClick={() => setLimit((l) => l + 20)} className="w-full px-4 py-3 text-sm font-medium text-blue-700 hover:bg-slate-50">
                  Pokaż więcej
                </button>
              </li>
            )}
          </ul>
          <div className="lg:col-span-3 lg:sticky lg:top-20">
            {selected ? (
              <VotingDetail sitting={selected.sitting} num={selected.num} />
            ) : (
              <EmptyState inCard title="Wybierz głosowanie z listy" description="Zobaczysz wynik, rozkład głosów w klubach i głos każdego posła." />
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

export default function VotingsPage() {
  return (
    <Suspense fallback={null}>
      <VotingsSearch />
    </Suspense>
  );
}
