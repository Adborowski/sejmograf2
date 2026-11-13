'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMeps } from '@/hooks/useMeps';
import { getVotingIndex } from '@/lib/firebase/firestore';
import type { VotingIndex } from '@/lib/votings';
import {
  adjacentSittings,
  clubAttendance,
  dissentShare,
  latestSittingNumber,
  margin,
  overallAttendance,
  RankedVoting,
  sittingHighlights,
  sittingVotings,
  summarizeSitting,
} from '@/lib/sitting';
import { formatDate, formatDateRange, formatNumber, formatPercent, formatPointsDelta, plural } from '@/lib/format';
import {
  Badge,
  ButtonLink,
  Card,
  ClubBadge,
  EmptyState,
  ErrorState,
  LoadingState,
  Page,
  PageHeader,
  Stat,
  StatGrid,
} from '@/components/ui';
import { VoteSplit } from '@/components/votes/VoteSplit';

const deltaTone = (delta: number) =>
  Math.abs(delta) < 0.0005 ? 'text-slate-400' : delta > 0 ? 'text-emerald-700' : 'text-rose-700';

function VotingList({
  items,
  sitting,
  figure,
  empty,
}: {
  items: RankedVoting[];
  sitting: number;
  /** The number this list is ranked by, shown on the right of each row */
  figure: (item: RankedVoting) => ReactNode;
  empty: string;
}) {
  if (items.length === 0) return <p className="px-5 sm:px-6 py-5 text-sm text-slate-500">{empty}</p>;
  return (
    <ol className="divide-y divide-slate-100">
      {items.map(({ voting: v, others }) => (
        <li key={v.num}>
          <Link
            href={`/glosowania?v=${sitting}/${v.num}`}
            className="flex items-start gap-4 px-5 sm:px-6 py-3 hover:bg-slate-50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">
                nr {v.num} · {formatDate(v.date)}
                {others > 0 && ` · +${others} ${plural(others, 'inne głosowanie', 'inne głosowania', 'innych głosowań')} w tym punkcie`}
              </p>
              <p className="text-sm text-slate-900 mt-0.5 line-clamp-2">{v.topic || v.title}</p>
              {v.topic && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{v.title}</p>}
              <VoteSplit yes={v.yes} no={v.no} abstain={v.abstain} className="mt-2" />
            </div>
            <div className="flex-shrink-0 text-right">{figure({ voting: v, others })}</div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Figure({ value, label }: { value: ReactNode; label: string }) {
  return (
    <>
      <p className="text-sm font-semibold text-slate-900 tabular">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </>
  );
}

/** One sitting's summary. Without `sitting` it shows the latest one. */
export function SittingView({ sitting: requested }: { sitting?: number }) {
  const { sittings, loading: listLoading, error: listError } = useMeps();
  const [index, setIndex] = useState<VotingIndex | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  useEffect(() => {
    getVotingIndex().then(setIndex).catch((e) => setIndexError(e.message));
  }, []);

  const latest = useMemo(() => {
    const fromIndex = index ? latestSittingNumber(index) : null;
    const fromList = sittings.length ? Math.max(...sittings.map((s) => s.sitting)) : null;
    return fromIndex === null ? fromList : fromList === null ? fromIndex : Math.max(fromIndex, fromList);
  }, [index, sittings]);
  const sitting = requested ?? latest;

  const data = useMemo(() => {
    if (!index || sitting === null) return null;
    const entries = sittingVotings(index, sitting);
    return {
      entries,
      summary: summarizeSitting(sitting, entries),
      highlights: sittingHighlights(entries),
      attendance: overallAttendance(sittings, sitting),
      clubs: clubAttendance(sittings, sitting),
      adjacent: adjacentSittings(sittings, sitting),
      totals: sittings.find((s) => s.sitting === sitting) ?? null,
    };
  }, [index, sittings, sitting]);

  const error = listError || indexError;
  if (error) return <Page><ErrorState message={error} /></Page>;
  if (listLoading || !data || sitting === null) return <Page><LoadingState /></Page>;

  const { summary, highlights, attendance, clubs, adjacent, totals } = data;

  if (summary.votings === 0 && !totals) {
    return (
      <Page>
        <EmptyState
          title={`Brak danych o posiedzeniu nr ${sitting}`}
          description="Nie znaleźliśmy głosowań z tego posiedzenia."
        />
        {latest !== null && (
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/posiedzenie" variant="secondary">Ostatnie posiedzenie →</ButtonLink>
          </div>
        )}
      </Page>
    );
  }

  const dates = summary.firstDate && summary.lastDate
    ? formatDateRange(summary.firstDate, summary.lastDate)
    : totals ? formatDate(totals.date) : null;

  return (
    <Page>
      <PageHeader
        eyebrow={sitting === latest ? 'Ostatnie posiedzenie Sejmu' : 'Posiedzenie Sejmu'}
        title={`Posiedzenie nr ${sitting}`}
        description={[dates, 'X kadencja'].filter(Boolean).join(' · ')}
        actions={
          <>
            {adjacent.previous !== null && (
              <ButtonLink href={`/posiedzenie/${adjacent.previous}`} variant="secondary" size="sm">← nr {adjacent.previous}</ButtonLink>
            )}
            {adjacent.next !== null && (
              <ButtonLink href={`/posiedzenie/${adjacent.next}`} variant="secondary" size="sm">nr {adjacent.next} →</ButtonLink>
            )}
          </>
        }
      />

      <Card className="mb-6">
        <StatGrid columns={4}>
          <Stat
            label="Obecność na głosowaniach"
            emphasis
            value={attendance.rate !== null ? formatPercent(attendance.rate) : '—'}
            hint={
              attendance.rate !== null && attendance.termRate !== null ? (
                <>
                  <span className={deltaTone(attendance.rate - attendance.termRate)}>
                    {formatPointsDelta(attendance.rate - attendance.termRate)}
                  </span>{' '}
                  wobec średniej kadencji ({formatPercent(attendance.termRate)})
                </>
              ) : undefined
            }
          />
          <Stat
            label="Głosowań"
            value={formatNumber(summary.votings)}
            hint={
              summary.onList > 0
                ? `w tym ${summary.onList} ${plural(summary.onList, 'wybór', 'wybory', 'wyborów')} imiennych`
                : summary.days.length > 0
                  ? `w ${summary.days.length} ${plural(summary.days.length, 'dzień', 'dni', 'dni')}`
                  : undefined
            }
          />
          <Stat
            label="Średnio oddanych głosów"
            value={summary.averageCast !== null ? formatNumber(Math.round(summary.averageCast)) : '—'}
            hint="na głosowanie, z 460 mandatów"
          />
          <Stat
            label="Remisy"
            value={formatNumber(summary.ties)}
            hint="tyle samo głosów za i przeciw"
          />
        </StatGrid>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card
            padded={false}
            title="Najbardziej wyrównane głosowania"
            description="Najmniejsza różnica między głosami za i przeciw. Po jednym głosowaniu z każdego punktu obrad."
          >
            <VotingList
              items={highlights.closest}
              sitting={sitting}
              empty="Brak głosowań z wynikiem za/przeciw."
              figure={({ voting }) =>
                margin(voting) === 0 ? (
                  <Badge tone="amber">remis</Badge>
                ) : (
                  <Figure value={formatNumber(margin(voting))} label={plural(margin(voting), 'głos różnicy', 'głosy różnicy', 'głosów różnicy')} />
                )
              }
            />
          </Card>

          <Card
            padded={false}
            title="Niemal jednogłośnie"
            description="Głosowania, w których co najwyżej 10% głosów było po stronie przegranej."
          >
            <VotingList
              items={highlights.consensus}
              sitting={sitting}
              empty="Na tym posiedzeniu nie było niemal jednogłośnych głosowań."
              figure={({ voting }) => <Figure value={formatPercent(1 - dissentShare(voting), 0)} label="po jednej stronie" />}
            />
          </Card>

          <Card padded={false} title="Najwięcej wstrzymujących się">
            <VotingList
              items={highlights.abstentions}
              sitting={sitting}
              empty="Nikt nie wstrzymał się od głosu."
              figure={({ voting }) => <Figure value={formatNumber(voting.abstain)} label="wstrzymało się" />}
            />
          </Card>
        </div>

        <Card
          padded={false}
          title="Obecność klubów"
          description="Na tym posiedzeniu, w porównaniu ze średnią klubu w kadencji. Według obecnej przynależności."
        >
          {clubs.length === 0 ? (
            <p className="px-5 sm:px-6 py-5 text-sm text-slate-500">Brak danych o obecności.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {clubs.map((c) => (
                <li key={c.club} className="px-5 sm:px-6 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/club/${encodeURIComponent(c.club)}`} className="hover:opacity-80">
                      <ClubBadge club={c.club} />
                    </Link>
                    <span className="text-sm font-semibold text-slate-900 tabular">
                      {c.rate !== null ? formatPercent(c.rate) : '—'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-blue-600" style={{ width: `${(c.rate ?? 0) * 100}%` }} />
                    </span>
                    {c.delta !== null && (
                      <span className={`text-[11px] tabular w-16 text-right ${deltaTone(c.delta)}`}>{formatPointsDelta(c.delta)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Wyniki to liczby oddanych głosów. Nie oznaczamy, czy wniosek przeszedł — niektóre głosowania wymagają
        bezwzględnej lub kwalifikowanej większości.
      </p>
    </Page>
  );
}
