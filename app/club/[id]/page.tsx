'use client';

import { use, useMemo, useState } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { MepRankRow } from '@/components/leaderboard/MepRankRow';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';
import { CLUB_FULL_NAMES, CLUB_LOGOS, getClubColorMap } from '@/lib/clubStyles';
import { NavBar } from '@/components/layout/NavBar';

// Derive a stable color map from the known club list
const ALL_SORTED_CLUBS = Object.keys(CLUB_FULL_NAMES).sort();
const STATIC_COLOR_MAP = getClubColorMap(ALL_SORTED_CLUBS);

export default function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const club = decodeURIComponent(id);

  const { meps, loading, error } = useMeps({ club });
  const { meps: allMeps } = useMeps();
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const color = STATIC_COLOR_MAP[club] ?? '#3b82f6';
  const fullName = CLUB_FULL_NAMES[club] ?? club;
  const logoUrl = CLUB_LOGOS[club];

  const sorted = useMemo(() =>
    [...meps]
      .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
      .sort((a, b) =>
        sortDir === 'desc'
          ? b.attendanceRate - a.attendanceRate
          : a.attendanceRate - b.attendanceRate
      ),
    [meps, sortDir]
  );

  const rankMap = useMemo(() => {
    const map = new Map<number, number>();
    let rank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].attendanceRate !== sorted[i - 1].attendanceRate) rank++;
      map.set(sorted[i].id, rank);
    }
    return map;
  }, [sorted]);

  const stats = useMemo(() => {
    const totalVoted = meps.reduce((s, m) => s + (m.totalVoted ?? 0), 0);
    const totalVotings = meps.reduce((s, m) => s + (m.totalVotings ?? 0), 0);
    const activeCount = meps.filter((m) => m.active).length;
    const attendanceRate = totalVotings > 0 ? totalVoted / totalVotings : null;
    return { totalVoted, totalVotings, activeCount, attendanceRate };
  }, [meps]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/clubs" maxWidth="max-w-4xl" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Club header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex items-center gap-5">
          <img
            src={logoUrl ?? '/club-placeholder.svg'}
            alt={club}
            className="w-16 h-16 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{club}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
          </div>
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
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-2xl font-bold" style={{ color }}>
                  {stats.attendanceRate !== null
                    ? `${(stats.attendanceRate * 100).toFixed(1)}%`
                    : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Średnia obecność</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-2xl font-bold text-gray-800">{stats.activeCount}</p>
                <p className="text-xs text-gray-500 mt-1">Aktywnych posłów</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalVoted.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Głosowań oddanych</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.totalVotings.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Głosowań łącznie</p>
              </div>
            </div>

            <div className="mb-6">
              <AttendanceChart meps={allMeps} initialVisible={[club]} />
            </div>

            {/* Ranked member list */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {sorted.length} {sorted.length === 1 ? 'poseł' : 'posłów'} wg frekwencji
                </span>
                <button
                  onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {sortDir === 'desc' ? '↓ Malejąco' : '↑ Rosnąco'}
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {sorted.map((mep) => (
                  <MepRankRow
                    key={mep.id}
                    rank={rankMap.get(mep.id)!}
                    mep={mep}
                    highlight={
                      mep.attendanceRate >= 0.8 ? 'top'
                      : mep.attendanceRate < 0.5 ? 'bottom'
                      : 'neutral'
                    }
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
