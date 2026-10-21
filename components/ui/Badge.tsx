import { ReactNode } from 'react';
import { CLUB_COLOR_OVERRIDES } from '@/lib/clubStyles';

const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  red: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  solid: 'bg-slate-900 text-white',
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({ tone = 'neutral', children, title }: { tone?: BadgeTone; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Club abbreviation pill, tinted with the club's colour when it has one */
export function ClubBadge({ club, color }: { club: string; color?: string }) {
  const c = color ?? CLUB_COLOR_OVERRIDES[club];
  if (!c) return <Badge tone="blue">{club}</Badge>;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${c}14`, color: c, boxShadow: `inset 0 0 0 1px ${c}30` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
      {club}
    </span>
  );
}
