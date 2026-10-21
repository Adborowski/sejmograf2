import { ReactNode } from 'react';
import { CARD_CLASS } from './Card';

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-10 w-10' }[size];
  return (
    <span
      role="status"
      aria-label="Ładowanie"
      className={`inline-block ${s} animate-spin rounded-full border-2 border-slate-200 border-t-blue-600`}
    />
  );
}

/** Centered spinner for a page or card that's loading */
export function LoadingState({ label = 'Ładowanie…', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-sm text-slate-500 ${compact ? 'py-8' : 'py-24'}`}>
      <Spinner size={compact ? 'md' : 'lg'} />
      {!compact && <span>{label}</span>}
    </div>
  );
}

export function ErrorState({ title = 'Coś poszło nie tak', message }: { title?: string; message: ReactNode }) {
  return (
    <div className="rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-5">
      <p className="text-sm font-semibold text-rose-900">{title}</p>
      <p className="text-sm text-rose-700 mt-1">{message}</p>
    </div>
  );
}

export function EmptyState({ title, description, inCard = false }: { title: ReactNode; description?: ReactNode; inCard?: boolean }) {
  return (
    <div className={`text-center py-12 px-6 ${inCard ? CARD_CLASS : ''}`}>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}
