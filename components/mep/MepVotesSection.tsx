'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getVotingIndex } from '@/lib/firebase/firestore';
import { searchVotings, seatedPositions, voteAt, VotingIndex } from '@/lib/votings';
import { VoteBadge } from '@/components/votes/VoteBadge';
import { Mep } from '@/types/mep';
import { Card, Label, LoadingState, SearchInput, SectionLabel } from '@/components/ui';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';

export function MepVotesSection({ mep }: { mep: Mep }) {
  const [index, setIndex] = useState<VotingIndex | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const history = mep.voteHistory;

  useEffect(() => {
    if (!history?.votes) return;
    getVotingIndex().then(setIndex).catch(() => setError(true));
  }, [history?.votes]);

  // The index and the vote string are written by the same pipeline step; if a
  // page load catches them mid-update, positions could be misaligned — show nothing rather than wrong votes
  const aligned = index && history && index.indexId === history.indexId;

  const positions = useMemo(() => (history ? seatedPositions(history.votes) : []), [history]);
  const results = useMemo(
    () => (aligned ? searchVotings(index, query, { limit: 8, positions }) : []),
    [aligned, index, query, positions],
  );

  // Docs written before the votes step existed have no `voteHistory` field
  if (!history?.votes || positions.length === 0) return null;

  return (
    <Card
      id="glosowania"
      title="Jak głosował(a)?"
      description="Zgodność z liniami klubów i wyszukiwarka wszystkich głosowań z czasu mandatu."
    >
      {mep.clubAgreement && mep.clubAgreement.length > 0 && (
        <div className="mb-6">
          <SectionLabel>Zgodność z liniami klubów</SectionLabel>
          <ul className="space-y-1.5">
            {mep.clubAgreement.map((c) => {
              const own = c.club === mep.club;
              return (
                <li
                  key={c.club}
                  className="flex items-center gap-3 text-sm"
                  title={`${c.club}: zgodnie w ${formatPercent(c.agree, 0)} z ${formatNumber(c.n)} głosowań`}
                >
                  <span className={`w-28 flex-shrink-0 truncate ${own ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{c.club}</span>
                  <span className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <span className={`block h-full rounded-full ${own ? 'bg-blue-600' : 'bg-slate-400'}`} style={{ width: `${c.agree * 100}%` }} />
                  </span>
                  <span className={`w-11 text-right tabular ${own ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>{formatPercent(c.agree, 0)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Label htmlFor="mep-vote-search">Wyszukaj głosowanie</Label>
      <SearchInput
        id="mep-vote-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="np. ochrona zwierząt, podatek, druk nr 1234"
      />

      {error ? (
        <p className="text-sm text-slate-500 mt-3">Nie udało się wczytać listy głosowań.</p>
      ) : !index ? (
        <LoadingState compact />
      ) : !aligned ? (
        <p className="text-sm text-slate-500 mt-3">Dane głosowań właśnie się aktualizują — spróbuj ponownie za kilka minut.</p>
      ) : (
        <div className="mt-4">
          <SectionLabel>{query.trim() ? 'Pasujące głosowania' : 'Ostatnie głosowania'}</SectionLabel>
          {results.length === 0 ? (
            <p className="text-sm text-slate-500 py-3">Brak pasujących głosowań.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {results.map((r) => (
                <li key={r.position} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">{formatDate(r.date)} · posiedzenie {r.sitting}, nr {r.num}</p>
                    <Link
                      href={`/glosowania?v=${r.sitting}/${r.num}`}
                      className="text-sm text-slate-800 hover:text-blue-700 hover:underline line-clamp-2"
                    >
                      {r.topic || r.title}
                    </Link>
                    {r.topic && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{r.title}</p>}
                  </div>
                  <VoteBadge code={voteAt(history.votes, r.position)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
