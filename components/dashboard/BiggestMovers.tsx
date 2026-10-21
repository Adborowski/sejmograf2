'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLeaderboardMovers, MoverEntry } from '@/hooks/useLeaderboardMovers';
import { getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { Card, LoadingState } from '@/components/ui';
import { formatDate } from '@/lib/format';

function MoverRow({ entry, direction }: { entry: MoverEntry; direction: 'up' | 'down' }) {
  const photoUrl = getMepPhotoDirectURL(entry.mepId);
  const isUp = direction === 'up';
  const changeAbs = Math.abs(entry.rankChange);

  return (
    <Link href={`/mep/${entry.mepId}`} className="group flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors">
      <span
        className={`w-12 flex-shrink-0 inline-flex items-center justify-center gap-0.5 rounded-md py-0.5 text-xs font-semibold tabular ${
          isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}
      >
        {isUp ? '▲' : '▼'} {changeAbs}
      </span>
      <div className="relative w-9 h-9 flex-shrink-0 rounded-full overflow-hidden bg-slate-200">
        <Image src={photoUrl} alt={entry.fullName} fill className="object-cover" sizes="36px" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-700">{entry.fullName}</p>
        <p className="text-xs text-slate-500 truncate">{entry.club}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold tabular text-slate-900">{String(entry.currentAttendancePct).replace('.', ',')}%</p>
        <p className="text-[11px] text-slate-400 tabular">#{entry.previousRank} → #{entry.rank}</p>
      </div>
    </Link>
  );
}

export function BiggestMovers() {
  const { movers, loading, error } = useLeaderboardMovers();

  if (loading) return <LoadingState compact />;
  if (error || !movers || (movers.risers.length === 0 && movers.fallers.length === 0)) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Największe zmiany</h2>
        <p className="text-sm text-slate-500 mt-1">
          Zmiana pozycji w rankingu obecności po posiedzeniu nr {movers.latestSitting} ({formatDate(movers.latestDate)}),
          w porównaniu z posiedzeniem nr {movers.previousSitting}.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padded={false} title={<span className="flex items-center gap-2 text-emerald-700">▲ Awanse</span>}>
          <div className="divide-y divide-slate-100">
            {movers.risers.map((entry) => <MoverRow key={entry.mepId} entry={entry} direction="up" />)}
          </div>
        </Card>
        <Card padded={false} title={<span className="flex items-center gap-2 text-rose-700">▼ Spadki</span>}>
          <div className="divide-y divide-slate-100">
            {movers.fallers.map((entry) => <MoverRow key={entry.mepId} entry={entry} direction="down" />)}
          </div>
        </Card>
      </div>
    </section>
  );
}
