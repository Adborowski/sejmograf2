'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mep } from '@/types/mep';
import { getMepPhotoBigDirectURL, getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { Badge, CARD_CLASS, ClubBadge } from '@/components/ui';
import { formatPercent } from '@/lib/format';

// Capitalises the first letter of every word, including after hyphens (for e.g. "Kujawsko-Pomorskie")
const capitalizeCompound = (str: string) =>
  str.replace(/(^|[\s-])([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/g, (_, sep, letter) => sep + letter.toUpperCase());

// Capitalises only the very first character of a string
const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

interface MepCardProps {
  mep: Mep;
  clubColor?: string;
}

type PhotoState = 'big' | 'small' | 'error';

/** One MEP in the search grid; the whole card links to their profile */
export default function MepCard({ mep, clubColor }: MepCardProps) {
  const [photoState, setPhotoState] = useState<PhotoState>('big');
  const photoUrl = photoState === 'big' ? getMepPhotoBigDirectURL(mep.id) : getMepPhotoDirectURL(mep.id);
  const rate = mep.attendanceRate ?? null;

  return (
    <Link
      href={`/mep/${mep.id}`}
      className={`${CARD_CLASS} group flex flex-col p-4 hover:-translate-y-0.5 hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-200">
          {photoState !== 'error' ? (
            <Image
              src={photoUrl}
              alt=""
              fill
              className="object-cover"
              onError={() => setPhotoState(photoState === 'big' ? 'small' : 'error')}
              sizes="56px"
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-700">{mep.fullName}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {mep.club && <ClubBadge club={mep.club} color={clubColor} />}
            {!mep.active && <Badge>Mandat wygasł</Badge>}
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">
            {[mep.districtName && capitalizeCompound(mep.districtName), mep.profession && capitalizeFirst(mep.profession.split(',')[0].trim())]
              .filter(Boolean)
              .join(' · ') || `Mandat nr ${mep.id}`}
          </p>
        </div>
      </div>

      {rate !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="text-slate-500">Obecność na głosowaniach</span>
            <span className={`font-semibold tabular ${rate >= 0.8 ? 'text-slate-900' : rate >= 0.5 ? 'text-amber-700' : 'text-rose-700'}`}>
              {formatPercent(rate)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full ${rate >= 0.8 ? 'bg-emerald-500' : rate >= 0.5 ? 'bg-amber-400' : 'bg-rose-500'}`}
              style={{ width: `${rate * 100}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
