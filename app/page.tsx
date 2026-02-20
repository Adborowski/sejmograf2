'use client';

import Link from 'next/link';
import { useMeps } from '@/hooks/useMeps';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';
import { ClubCards } from '@/components/leaderboard/ClubCards';
import { MepRankRow } from '@/components/leaderboard/MepRankRow';
import { BiggestMovers } from '@/components/dashboard/BiggestMovers';
import { RecentReviews } from '@/components/dashboard/RecentReviews';
import { useLatestSittingDate } from '@/hooks/useLatestSittingDate';

const LEADERBOARD_SIZE = 20;

export default function LeaderboardPage() {
  const { meps, loading, error } = useMeps();
  const { sitting, date } = useLatestSittingDate();

  const activeSorted = [...meps]
    .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  const top = activeSorted.slice(0, LEADERBOARD_SIZE);
  const bottom = activeSorted.slice(-LEADERBOARD_SIZE).reverse();

  // Dense ranking: ties share the same rank; next distinct value increments by 1.
  const rankMap = new Map<number, number>();
  let currentRank = 1;
  for (let i = 0; i < activeSorted.length; i++) {
    if (i > 0 && activeSorted[i].attendanceRate !== activeSorted[i - 1].attendanceRate) {
      currentRank++;
    }
    rankMap.set(activeSorted[i].id, currentRank);
  }

  const mepNameMap = new Map(meps.map((m: any) => [m.id, m.fullName as string]));
  const getMepName = (id: number) => mepNameMap.get(id) ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div>
              <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
              <p className="text-xs text-gray-500">Monitor Polskiego Sejmu</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                Pełny ranking
              </Link>
              <Link
                href="/clubs"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                Przeglądaj kluby
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                Szukaj posłów
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="bg-blue-600 text-white rounded-xl shadow-lg px-8 py-7 mb-8">
          <h2 className="text-2xl font-bold mb-2">Czy Twój poseł chodzi na głosowania?</h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-2xl">
            Sejmograf śledzi obecność wszystkich posłów na głosowaniach sejmowych. Sprawdź, kto pojawia się regularnie, a kto opuszcza posiedzenia — i wyraź swoją opinię.
          </p>
          {date && sitting && (
            <p className="mt-4 text-xs text-blue-200">
              Dane aktualne do posiedzenia nr {sitting} ({date})
            </p>
          )}
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
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ranking Obecności</h2>
              <p className="text-sm text-gray-500 mt-1">Dla posiedzeń wielodniowych jako data referencyjna przyjmowany jest ostatni dzień.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-green-50">
                  <h3 className="font-semibold text-green-800">Najlepsza obecność</h3>
                  <p className="text-xs text-green-600 mt-0.5">Top {LEADERBOARD_SIZE} aktywnych posłów</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {top.map((mep) => (
                    <MepRankRow key={mep.id} rank={rankMap.get(mep.id)!} mep={mep} highlight="top" />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-red-50">
                  <h3 className="font-semibold text-red-800">Najgorsza obecność</h3>
                  <p className="text-xs text-red-500 mt-0.5">Ostatnie {LEADERBOARD_SIZE} aktywnych posłów</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {bottom.map((mep) => (
                    <MepRankRow
                      key={mep.id}
                      rank={rankMap.get(mep.id)!}
                      mep={mep}
                      highlight="bottom"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-8">
              <Link
                href="/leaderboard"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                Zobacz pełny ranking →
              </Link>
            </div>

            <ClubCards meps={meps} />

            <div className="flex justify-center mt-2 mb-8">
              <Link
                href="/clubs"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                Przeglądaj kluby →
              </Link>
            </div>

            <AttendanceChart meps={meps} />
          </>
        )}

        {/* Load independently */}
        <BiggestMovers />
        <RecentReviews getMepName={getMepName} />
      </main>
    </div>
  );
}
