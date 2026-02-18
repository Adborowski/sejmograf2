'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useMeps } from '@/hooks/useMeps';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';

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
      <div className="flex-shrink-0">
        {rate !== null ? (
          <AttendanceBar rate={rate} />
        ) : (
          <span className="text-sm text-gray-400">No data</span>
        )}
      </div>
    </Link>
  );
}

export default function LeaderboardPage() {
  const { meps, loading, error } = useMeps({ active: true });

  const sorted = [...meps]
    .filter((m) => m.attendanceRate !== null && m.attendanceRate !== undefined)
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  const top = sorted.slice(0, LEADERBOARD_SIZE);
  const bottom = sorted.slice(-LEADERBOARD_SIZE).reverse();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ← Back
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Leaderboard</h2>
            <p className="text-sm text-gray-500 mt-1">Active MEPs only — inactive members are excluded.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Best attendance */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-green-50">
                  <h3 className="font-semibold text-green-800">Best attendance</h3>
                  <p className="text-xs text-green-600 mt-0.5">Top {LEADERBOARD_SIZE} active MEPs</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {top.map((mep, i) => (
                    <RankRow key={mep.id} rank={i + 1} mep={mep} highlight="top" />
                  ))}
                </div>
              </div>

              {/* Worst attendance */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-red-50">
                  <h3 className="font-semibold text-red-800">Worst attendance</h3>
                  <p className="text-xs text-red-500 mt-0.5">Bottom {LEADERBOARD_SIZE} active MEPs</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {bottom.map((mep, i) => (
                    <RankRow
                      key={mep.id}
                      rank={sorted.length - i}
                      mep={mep}
                      highlight="bottom"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
