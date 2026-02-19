'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLeaderboardMovers, MoverEntry } from '@/hooks/useLeaderboardMovers';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';

function MoverRow({ entry, direction }: { entry: MoverEntry; direction: 'up' | 'down' }) {
  const photoUrl = getMepPhotoDirectURL(entry.mepId);
  const isUp = direction === 'up';
  const changeAbs = Math.abs(entry.rankChange);

  return (
    <Link
      href={`/mep/${entry.mepId}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {/* Rank change badge */}
      <div
        className={`w-12 flex-shrink-0 flex items-center justify-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-bold tabular-nums ${
          isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}
      >
        <span>{isUp ? '▲' : '▼'}</span>
        <span>{changeAbs}</span>
      </div>

      {/* Photo */}
      <div className="relative w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
        <Image src={photoUrl} alt={entry.fullName} fill className="object-cover" sizes="36px" />
      </div>

      {/* Name + club */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{entry.fullName}</p>
        <p className="text-xs text-gray-400 truncate">{entry.club}</p>
      </div>

      {/* Attendance rate */}
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {entry.currentAttendancePct}%
        </p>
        <p className="text-xs text-gray-400">#{entry.rank} ← #{entry.previousRank}</p>
      </div>
    </Link>
  );
}

export function BiggestMovers() {
  const { movers, loading, error } = useLeaderboardMovers();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !movers || (movers.risers.length === 0 && movers.fallers.length === 0)) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-xl font-bold text-gray-900">Największe zmiany</h2>
        <span className="text-sm text-gray-400">
          Sitting #{movers.previousSitting} → #{movers.latestSitting} ({movers.latestDate})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risers */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-green-50 flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">▲</span>
            <h3 className="font-semibold text-green-800">Największe wzrosty</h3>
            <span className="ml-auto text-xs text-green-600">największy wzrost pozycji</span>
          </div>
          <div className="divide-y divide-gray-50">
            {movers.risers.map((entry) => (
              <MoverRow key={entry.mepId} entry={entry} direction="up" />
            ))}
          </div>
        </div>

        {/* Fallers */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-red-50 flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">▼</span>
            <h3 className="font-semibold text-red-800">Największe spadki</h3>
            <span className="ml-auto text-xs text-red-500">największy spadek pozycji</span>
          </div>
          <div className="divide-y divide-gray-50">
            {movers.fallers.map((entry) => (
              <MoverRow key={entry.mepId} entry={entry} direction="down" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
