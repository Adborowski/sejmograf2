'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';

export function AttendanceBar({ rate }: { rate: number }) {
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

export function MepRankRow({
  rank,
  mep,
  highlight,
}: {
  rank: number;
  mep: any;
  highlight: 'top' | 'bottom' | 'neutral';
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
          highlight === 'top' ? 'text-green-600' : highlight === 'bottom' ? 'text-red-500' : 'text-gray-500'
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
