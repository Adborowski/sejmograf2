'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getVotingDetail, VotingDetail as Detail } from '@/lib/sejmApi';
import { normalize } from '@/lib/votings';
import { API_VOTE_CODES, VoteBadge } from './VoteBadge';
import { Badge, CARD_CLASS, ErrorState, Label, LoadingState, SearchInput, SectionLabel, Stat } from '@/components/ui';
import { formatDate } from '@/lib/format';

const COLUMNS = [
  { vote: 'YES', label: 'Za', className: 'text-emerald-700' },
  { vote: 'NO', label: 'Przeciw', className: 'text-rose-700' },
  { vote: 'ABSTAIN', label: 'Wstrzym.', className: 'text-amber-700' },
  { vote: 'ABSENT', label: 'Nieob.', className: 'text-slate-500' },
] as const;

export function VotingDetail({ sitting, num }: { sitting: number; num: number }) {
  const key = `${sitting}/${num}`;
  // Results are keyed by voting, so switching votings shows the spinner until the new one loads
  const [loaded, setLoaded] = useState<{ key: string; detail?: Detail; error?: string } | null>(null);
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    getVotingDetail(sitting, num)
      .then((detail) => { if (!cancelled) setLoaded({ key, detail }); })
      .catch((e) => { if (!cancelled) setLoaded({ key, error: e.message }); });
    return () => { cancelled = true; };
  }, [key, sitting, num]);

  const current = loaded?.key === key ? loaded : null;
  const detail = current?.detail ?? null;
  const error = current?.error ?? null;

  // Per-club tallies, largest club first
  const clubs = useMemo(() => {
    if (!detail) return [];
    const byClub = new Map<string, Record<string, number>>();
    for (const v of detail.votes) {
      const c = byClub.get(v.club) ?? {};
      c[v.vote] = (c[v.vote] ?? 0) + 1;
      byClub.set(v.club, c);
    }
    return [...byClub.entries()]
      .map(([club, counts]) => ({ club, counts, total: Object.values(counts).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [detail]);

  const filteredVotes = useMemo(() => {
    if (!detail) return [];
    const q = normalize(nameFilter.trim());
    return detail.votes
      .filter((v) => !q || normalize(`${v.name} ${v.club}`).includes(q))
      .sort((a, b) => a.club.localeCompare(b.club, 'pl') || a.name.localeCompare(b.name, 'pl'));
  }, [detail, nameFilter]);

  if (error) return <ErrorState title="Nie udało się pobrać głosowania z API Sejmu" message={error} />;
  if (!detail) {
    return (
      <div className={CARD_CLASS}>
        <LoadingState compact />
      </div>
    );
  }

  return (
    <div className={`${CARD_CLASS} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {detail.passed !== null && <Badge tone={detail.passed ? 'green' : 'solid'}>{detail.passed ? 'Przyjęto' : 'Nie przyjęto'}</Badge>}
        <span className="text-xs text-slate-500">
          Posiedzenie {detail.sitting}, głosowanie nr {detail.num} · {formatDate(detail.date)}, {detail.date.slice(11, 16)}
        </span>
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{detail.topic || detail.title}</h2>
      {detail.topic && <p className="text-sm text-slate-500 mt-1">{detail.title}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 rounded-xl bg-slate-50 p-4">
        <Stat label="Za" value={<span className="text-emerald-700">{detail.yes}</span>} />
        <Stat label="Przeciw" value={<span className="text-rose-700">{detail.no}</span>} />
        <Stat label="Wstrzymało się" value={<span className="text-amber-700">{detail.abstain}</span>} />
        <Stat label="Nie głosowało" value={<span className="text-slate-500">{detail.notParticipating}</span>} />
      </div>
      <a href={detail.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-medium text-blue-700 hover:text-blue-800">
        Oficjalny wynik (PDF) ↗
      </a>

      <div className="mt-6">
        <SectionLabel>Kluby</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-2 pr-3 text-left font-medium">Klub</th>
                <th className="py-2 px-3 text-left font-medium w-32"><span className="sr-only">Rozkład</span></th>
                {COLUMNS.map((c) => (
                  <th key={c.vote} className="py-2 pl-3 text-right font-medium">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular">
              {clubs.map(({ club, counts, total }) => (
                <tr key={club}>
                  <td className="py-2 pr-3 font-medium text-slate-900 whitespace-nowrap">{club}</td>
                  <td className="py-2 px-3">
                    <span className="flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <span className="bg-emerald-500" style={{ width: `${((counts.YES ?? 0) / total) * 100}%` }} />
                      <span className="bg-rose-500" style={{ width: `${((counts.NO ?? 0) / total) * 100}%` }} />
                      <span className="bg-amber-400" style={{ width: `${((counts.ABSTAIN ?? 0) / total) * 100}%` }} />
                    </span>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.vote} className={`py-2 pl-3 text-right ${counts[c.vote] ? c.className : 'text-slate-300'}`}>
                      {counts[c.vote] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="mp-filter">Jak głosowali posłowie</Label>
        <SearchInput
          id="mp-filter"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          placeholder="Wpisz nazwisko lub klub…"
        />
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 max-h-96 overflow-y-auto">
          {filteredVotes.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100">
              <Link href={`/mep/${v.id}`} className="text-sm text-slate-800 hover:text-blue-700 hover:underline truncate">
                {v.name} <span className="text-slate-400">({v.club})</span>
              </Link>
              <VoteBadge code={API_VOTE_CODES[v.vote] ?? '?'} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
