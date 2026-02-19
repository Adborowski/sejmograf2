'use client';

import { useMemo } from 'react';
import { getClubColorMap, CLUB_FULL_NAMES } from '@/lib/clubStyles';

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
    <div className="bg-white rounded-lg shadow-md p-5 mb-6">
      <h3 className="font-semibold text-gray-900">Obecność wg klubu</h3>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">
        Średnia ważona dla całej X kadencji · uwzględnia posłów nieaktywnych (statystyki obejmują wyłącznie okres aktywnego mandatu)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clubs.map(({ club, color, activeMemberCount, totalVoted, totalVotings, attendanceRate }) => {
          const pct = (attendanceRate * 100).toFixed(1);
          return (
            <div
              key={club}
              className="border rounded-lg px-4 py-3"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-gray-900 text-sm truncate">{CLUB_FULL_NAMES[club] ?? club}</span>
                </div>
                <span className="text-base font-bold tabular-nums ml-2 flex-shrink-0" style={{ color }}>
                  {pct}%
                </span>
              </div>

              {/* Attendance bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${attendanceRate * 100}%`, backgroundColor: color }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{activeMemberCount} {activeMemberCount === 1 ? 'poseł' : 'posłów'}</span>
                <span>{totalVoted.toLocaleString()} / {totalVotings.toLocaleString()} głosowań</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
