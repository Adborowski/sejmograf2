'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { CLUB_FULL_NAMES, CLUB_LOGOS, getClubColorMap } from '@/lib/clubStyles';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';
import { CARD_CLASS, ErrorState, LoadingState, Page, PageHeader } from '@/components/ui';
import { formatNumber, formatPercent, plural } from '@/lib/format';
import { ClubAgreementMatrix } from '@/components/votes/ClubAgreementMatrix';

const ALL_SORTED_CLUBS = Object.keys(CLUB_FULL_NAMES).sort();
const STATIC_COLOR_MAP = getClubColorMap(ALL_SORTED_CLUBS);

export default function ClubBrowserPage() {
  const { meps, sittings, loading, error } = useMeps();

  const clubs = useMemo(() => {
    const map = new Map<string, { totalVoted: number; totalVotings: number; active: number; total: number }>();

    for (const mep of meps) {
      if (!mep.club) continue;
      if (!map.has(mep.club)) map.set(mep.club, { totalVoted: 0, totalVotings: 0, active: 0, total: 0 });
      const c = map.get(mep.club)!;
      c.totalVoted += mep.totalVoted ?? 0;
      c.totalVotings += mep.totalVotings ?? 0;
      c.total += 1;
      if (mep.active) c.active += 1;
    }

    return Array.from(map.entries())
      .map(([club, d]) => ({
        club,
        color: STATIC_COLOR_MAP[club] ?? '#3b82f6',
        fullName: CLUB_FULL_NAMES[club] ?? club,
        logoUrl: CLUB_LOGOS[club],
        activeMemberCount: d.active,
        totalMemberCount: d.total,
        totalVoted: d.totalVoted,
        totalVotings: d.totalVotings,
        attendanceRate: d.totalVotings > 0 ? d.totalVoted / d.totalVotings : null,
      }))
      .sort((a, b) => (b.attendanceRate ?? 0) - (a.attendanceRate ?? 0));
  }, [meps]);

  return (
    <Page>
      <PageHeader
        eyebrow="Kluby"
        title="Kluby parlamentarne"
        description="Frekwencja, skład i to, z kim kluby głosują. Wybierz klub, aby zobaczyć jego posłów."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map(({ club, color, fullName, logoUrl, activeMemberCount, totalVoted, totalVotings, attendanceRate }) => (
              <Link
                key={club}
                href={`/club/${encodeURIComponent(club)}`}
                className={`${CARD_CLASS} group relative overflow-hidden p-5 hover:-translate-y-0.5 hover:shadow-md transition-all`}
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: color }} />
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-50 ring-1 ring-inset ring-slate-200/70">
                    <img src={logoUrl ?? '/club-placeholder.svg'} alt="" className="w-9 h-9 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-400 tracking-wide">{club}</p>
                    <h2 className="font-semibold text-slate-900 leading-snug group-hover:text-blue-700">{fullName}</h2>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Średnia obecność</span>
                  <span className="text-xl font-semibold tabular text-slate-900">
                    {attendanceRate !== null ? formatPercent(attendanceRate) : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${(attendanceRate ?? 0) * 100}%`, backgroundColor: color }} />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 tabular">
                  <span>{activeMemberCount} {plural(activeMemberCount, 'aktywny poseł', 'aktywnych posłów', 'aktywnych posłów')}</span>
                  <span>{formatNumber(totalVoted)} / {formatNumber(totalVotings)}</span>
                </div>
              </Link>
            ))}
          </div>

          <ClubAgreementMatrix />

          <AttendanceChart meps={meps} sittings={sittings} />
        </div>
      )}
    </Page>
  );
}
