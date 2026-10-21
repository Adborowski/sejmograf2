'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { formatNumber, formatPercent } from '@/lib/format';

export function AttendanceBar({ rate }: { rate: number }) {
  const color =
    rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.5 ? 'bg-amber-400' : 'bg-rose-500';
  const textColor =
    rate >= 0.8 ? 'text-slate-900' : rate >= 0.5 ? 'text-amber-700' : 'text-rose-700';
  return (
    <div className="flex items-center gap-3">
      {/* Bar hidden on mobile to save space for the MEP name */}
      <div className="hidden sm:block w-24 bg-slate-100 rounded-full h-1.5 flex-shrink-0">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${rate * 100}%` }} />
      </div>
      <span className={`text-sm font-semibold tabular w-14 text-right ${textColor}`}>
        {formatPercent(rate)}
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
      className="group flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 hover:bg-slate-50 transition-colors"
    >
      <span
        className={`w-8 text-right text-sm font-semibold tabular flex-shrink-0 ${
          highlight === 'top' ? 'text-emerald-600' : highlight === 'bottom' ? 'text-rose-600' : 'text-slate-400'
        }`}
      >
        {rank}
      </span>
      <div className="relative w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-slate-200 ring-2 ring-white">
        <Image src={photoUrl} alt={mep.fullName} fill className="object-cover" sizes="40px" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate text-sm group-hover:text-blue-700">{mep.fullName}</p>
        <p className="text-xs text-slate-500 truncate">{mep.club}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        {rate !== null ? (
          <AttendanceBar rate={rate} />
        ) : (
          <span className="text-sm text-slate-400">Brak danych</span>
        )}
        {attended !== null && total !== null && (
          <p className="text-[11px] text-slate-400 tabular mt-0.5">
            {formatNumber(attended)} / {formatNumber(total)}
          </p>
        )}
      </div>
    </Link>
  );
}
