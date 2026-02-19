'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMeps } from '@/hooks/useMeps';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { AttendanceChart } from '@/components/leaderboard/AttendanceChart';
import { ClubCards } from '@/components/leaderboard/ClubCards';
import { BiggestMovers } from '@/components/dashboard/BiggestMovers';

const LEADERBOARD_SIZE = 20;

function AttendanceBar({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const color =
    rate >= 0.8 ? 'bg-green-500' : rate >= 0.5 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor =
    rate >= 0.8 ? 'text-green-700' : rate >= 0.5 ? 'text-yellow-700' : 'text-red-700';
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 bg-gray-200 rounded-full h-2 flex-shrink-0">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${rate * 100}%` }} />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-14 text-right ${textColor}`}>
        {pct}%
      </span>
    </div>
  );
}

function RankRow({
  rank,
  mep,
  highlight,
}: {
  rank: number;
  mep: any;
  highlight: 'top' | 'bottom';
}) {
  const photoUrl = getMepPhotoDirectURL(mep.id);
  const rate: number | null = mep.attendanceRate ?? null;
  const attended: number | null = mep.totalVoted ?? null;
  const total: number | null = mep.totalVotings ?? null;

  return (
    <Link
      href={`/mep/${mep.id}`}
      className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
    >
      <span
        className={`w-8 text-right text-sm font-bold tabular-nums flex-shrink-0 ${
          highlight === 'top' ? 'text-green-600' : 'text-red-500'
        }`}
      >
        {rank}
      </span>
      <div className="relative w-10 h-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
        <Image src={photoUrl} alt={mep.fullName} fill className="object-cover" sizes="40px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">{mep.fullName}</p>
        <p className="text-xs text-gray-500 truncate">{mep.club}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        {rate !== null ? (
          <AttendanceBar rate={rate} />
        ) : (
          <span className="text-sm text-gray-400">Brak danych</span>
        )}
        {attended !== null && total !== null && (
          <p className="text-xs text-gray-400 tabular-nums mt-0.5">
            {attended.toLocaleString()}/{total.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const { meps, loading, error } = useMeps();

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
            <Link
              href="/search"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
            >
              Szukaj posłów
            </Link>
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
        </div>

        {/* Biggest movers — loads independently */}
        <BiggestMovers />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Ranking Obecności</h2>
          <p className="text-sm text-gray-500 mt-1">Dla posiedzeń wielodniowych jako data referencyjna przyjmowany jest ostatni dzień.</p>
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
            <AttendanceChart meps={meps} />
            <ClubCards meps={meps} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-green-50">
                  <h3 className="font-semibold text-green-800">Najlepsza obecność</h3>
                  <p className="text-xs text-green-600 mt-0.5">Top {LEADERBOARD_SIZE} aktywnych posłów</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {top.map((mep) => (
                    <RankRow key={mep.id} rank={rankMap.get(mep.id)!} mep={mep} highlight="top" />
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
                    <RankRow
                      key={mep.id}
                      rank={rankMap.get(mep.id)!}
                      mep={mep}
                      highlight="bottom"
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
