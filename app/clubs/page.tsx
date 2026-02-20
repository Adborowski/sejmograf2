'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { CLUB_FULL_NAMES, CLUB_LOGOS, getClubColorMap } from '@/lib/clubStyles';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';

const ALL_SORTED_CLUBS = Object.keys(CLUB_FULL_NAMES).sort();
const STATIC_COLOR_MAP = getClubColorMap(ALL_SORTED_CLUBS);

export default function ClubBrowserPage() {
  const { meps, loading, error } = useMeps();

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
            >
              ← Wróć
            </Link>
            <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Kluby parlamentarne</h2>
          <p className="text-sm text-gray-500 mt-1">
            Wybierz klub, aby zobaczyć szczegółowe statystyki i listę posłów.
          </p>
        </div>

        <div className="mb-8">
          <AttendanceChart meps={meps} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map(({ club, color, fullName, logoUrl, activeMemberCount, totalVoted, totalVotings, attendanceRate }) => {
              const pct = attendanceRate !== null ? (attendanceRate * 100).toFixed(1) : null;
              return (
                <Link
                  key={club}
                  href={`/club/${encodeURIComponent(club)}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Colored top bar */}
                  <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      {logoUrl ? (
                        <img src={logoUrl} alt={club} className="w-12 h-12 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden" style={{ backgroundColor: `${color}15` }}>
                          <img src="/club-placeholder.svg" alt="" className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{club}</p>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">{fullName}</h3>
                      </div>
                    </div>

                    {/* Attendance rate + bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Średnia obecność</span>
                        <span className="text-base font-bold tabular-nums" style={{ color }}>
                          {pct !== null ? `${pct}%` : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(attendanceRate ?? 0) * 100}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{activeMemberCount} aktywnych posłów</span>
                      <span>{totalVoted.toLocaleString()} / {totalVotings.toLocaleString()} głosowań</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
