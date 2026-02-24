'use client';

import { useState } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { MepRankRow } from '@/components/leaderboard/MepRankRow';
import { NavBar } from '@/components/layout/NavBar';

export default function FullLeaderboardPage() {
  const { meps, loading, error } = useMeps();
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const activeSorted = [...meps]
    .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
    .sort((a, b) =>
      sortDir === 'desc'
        ? b.attendanceRate - a.attendanceRate
        : a.attendanceRate - b.attendanceRate
    );

  // Dense ranking (always based on desc order for consistent rank numbers)
  const descSorted = [...activeSorted].sort((a, b) => b.attendanceRate - a.attendanceRate);
  const rankMap = new Map<number, number>();
  let currentRank = 1;
  for (let i = 0; i < descSorted.length; i++) {
    if (i > 0 && descSorted[i].attendanceRate !== descSorted[i - 1].attendanceRate) {
      currentRank++;
    }
    rankMap.set(descSorted[i].id, currentRank);
  }

  const total = activeSorted.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" maxWidth="max-w-4xl" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pełny ranking obecności</h2>
          <p className="text-sm text-gray-500 mt-1">
            Wszyscy aktywni posłowie według łącznej frekwencji na głosowaniach.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Ładowanie...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">{total} aktywnych posłów</span>
              <button
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {sortDir === 'desc' ? '↓ Malejąco' : '↑ Rosnąco'}
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {activeSorted.map((mep) => {
                const rank = rankMap.get(mep.id)!;
                const highlight =
                  rank <= 20 ? 'top' : rank > total - 20 ? 'bottom' : 'neutral';
                return (
                  <MepRankRow key={mep.id} rank={rank} mep={mep} highlight={highlight} />
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
