'use client';

import { use, useMemo, useState } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { MepRankRow } from '@/components/leaderboard/MepRankRow';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';
import { CLUB_FULL_NAMES, CLUB_LOGOS, getClubColorMap } from '@/lib/clubStyles';
import Link from 'next/link';
import { CARD_CLASS, Card, ErrorState, LoadingState, Page, SegmentedControl, Stat, StatGrid } from '@/components/ui';
import { formatNumber, formatPercent, plural } from '@/lib/format';

// Derive a stable color map from the known club list
const ALL_SORTED_CLUBS = Object.keys(CLUB_FULL_NAMES).sort();
const STATIC_COLOR_MAP = getClubColorMap(ALL_SORTED_CLUBS);

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const club = decodeURIComponent(id);

  const { meps, loading, error } = useMeps({ club });
  const { meps: allMeps, sittings } = useMeps();
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const color = STATIC_COLOR_MAP[club] ?? '#3b82f6';
  const fullName = CLUB_FULL_NAMES[club] ?? club;
  const logoUrl = CLUB_LOGOS[club];

  const descSorted = useMemo(
    () =>
      [...meps]
        .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
        .sort((a, b) => b.attendanceRate - a.attendanceRate),
    [meps],
  );
  const sorted = sortDir === 'desc' ? descSorted : [...descSorted].reverse();

  // Ranks always follow highest-first order, whichever way the list is shown
  const rankMap = useMemo(() => {
    const map = new Map<number, number>();
    let rank = 1;
    for (let i = 0; i < descSorted.length; i++) {
      if (i > 0 && descSorted[i].attendanceRate !== descSorted[i - 1].attendanceRate) rank++;
      map.set(descSorted[i].id, rank);
    }
    return map;
  }, [descSorted]);

  const stats = useMemo(() => {
    const totalVoted = meps.reduce((s, m) => s + (m.totalVoted ?? 0), 0);
    const totalVotings = meps.reduce((s, m) => s + (m.totalVotings ?? 0), 0);
    const activeCount = meps.filter((m) => m.active).length;
    const attendanceRate = totalVotings > 0 ? totalVoted / totalVotings : null;
    return { totalVoted, totalVotings, activeCount, attendanceRate };
  }, [meps]);

  return (
    <Page>
      <Link href="/clubs" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 mb-6">
        ← Wszystkie kluby
      </Link>

      <section className={`${CARD_CLASS} relative overflow-hidden p-6 sm:p-8 mb-6`}>
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: color }} />
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center bg-slate-50 ring-1 ring-inset ring-slate-200/70">
            <img src={logoUrl ?? '/club-placeholder.svg'} alt="" className="w-12 h-12 object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Klub · {club}</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{fullName}</h1>
          </div>
        </div>

        {!loading && !error && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <StatGrid columns={4}>
              <Stat emphasis label="Średnia obecność" value={stats.attendanceRate !== null ? formatPercent(stats.attendanceRate) : '—'} />
              <Stat label="Aktywnych posłów" value={formatNumber(stats.activeCount)} />
              <Stat label="Głosów oddanych" value={formatNumber(stats.totalVoted)} />
              <Stat label="Głosowań łącznie" value={formatNumber(stats.totalVotings)} hint="suma po wszystkich posłach" />
            </StatGrid>
          </div>
        )}
      </section>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-6">
          <AttendanceChart meps={allMeps} sittings={sittings} initialVisible={[club]} />

          <Card
            padded={false}
            title="Posłowie klubu"
            description={`${sorted.length} ${plural(sorted.length, 'aktywny poseł', 'aktywnych posłów', 'aktywnych posłów')}, według obecności`}
            actions={
              <SegmentedControl
                label="Kolejność"
                value={sortDir}
                onChange={setSortDir}
                options={[
                  { value: 'desc', label: 'Najwyższa' },
                  { value: 'asc', label: 'Najniższa' },
                ]}
              />
            }
          >
            <div className="divide-y divide-slate-100">
              {sorted.map((mep) => (
                <MepRankRow
                  key={mep.id}
                  rank={rankMap.get(mep.id)!}
                  mep={mep}
                  highlight={mep.attendanceRate >= 0.8 ? 'top' : mep.attendanceRate < 0.5 ? 'bottom' : 'neutral'}
                />
              ))}
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
