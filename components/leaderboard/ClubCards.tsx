'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getClubColorMap, CLUB_FULL_NAMES } from '@/lib/clubStyles';
import { Card } from '@/components/ui';
import { formatNumber, formatPercent, plural } from '@/lib/format';

interface ClubStat {
  club: string;
  color: string;
  activeMemberCount: number;
  totalVoted: number;
  totalVotings: number;
  attendanceRate: number;
}

export function ClubCards({ meps }: { meps: any[] }) {
  const clubs = useMemo((): ClubStat[] => {
    const map = new Map<string, { totalVoted: number; totalVotings: number; members: Set<number> }>();

    for (const mep of meps) {
      if (!mep.club || !mep.totalVotings || mep.totalVotings === 0) continue;
      if (!map.has(mep.club)) {
        map.set(mep.club, { totalVoted: 0, totalVotings: 0, members: new Set() });
      }
      const c = map.get(mep.club)!;
      c.totalVoted += mep.totalVoted ?? 0;
      c.totalVotings += mep.totalVotings ?? 0;
      c.members.add(mep.id);
    }

    // Assign colors in alphabetical order — same as AttendanceChart
    const sortedClubNames = Array.from(map.keys()).sort();
    const colorMap = getClubColorMap(sortedClubNames);

    return sortedClubNames
      .map((club) => {
        const d = map.get(club)!;
        return {
          club,
          color: colorMap[club],
          activeMemberCount: d.members.size,
          totalVoted: d.totalVoted,
          totalVotings: d.totalVotings,
          attendanceRate: d.totalVoted / d.totalVotings,
        };
      })
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [meps]);

  if (clubs.length === 0) return null;

  return (
    <Card
      title="Obecność wg klubu"
      description="Średnia ważona dla całej kadencji, łącznie z posłami, którzy już nie zasiadają w Sejmie (liczy się okres ich mandatu)."
      actions={<Link href="/clubs" className="text-sm font-medium text-blue-700 hover:text-blue-800">Wszystkie kluby →</Link>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clubs.map(({ club, color, activeMemberCount, totalVoted, totalVotings, attendanceRate }) => (
          <Link
            key={club}
            href={`/club/${encodeURIComponent(club)}`}
            className="group block rounded-xl px-4 py-3 ring-1 ring-inset ring-slate-200 hover:ring-slate-300 hover:bg-slate-50/60 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="font-medium text-slate-900 text-sm truncate group-hover:text-blue-700">
                  {CLUB_FULL_NAMES[club] ?? club}
                </span>
              </div>
              <span className="text-base font-semibold tabular ml-2 flex-shrink-0 text-slate-900">
                {formatPercent(attendanceRate)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
              <div className="h-1.5 rounded-full" style={{ width: `${attendanceRate * 100}%`, backgroundColor: color }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 tabular">
              <span>{activeMemberCount} {plural(activeMemberCount, 'poseł', 'posłów', 'posłów')}</span>
              <span>{formatNumber(totalVoted)} / {formatNumber(totalVotings)}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
