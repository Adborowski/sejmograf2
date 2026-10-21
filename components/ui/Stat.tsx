import { ReactNode } from 'react';

interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Small line under the value: context such as an average */
  hint?: ReactNode;
  /** Highlight the headline number */
  emphasis?: boolean;
}

export function Stat({ label, value, hint, emphasis = false }: StatProps) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight tabular ${emphasis ? 'text-blue-700' : 'text-slate-900'}`}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Row of stats separated by hairlines */
export function StatGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const cols = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[columns];
  return <div className={`grid ${cols} gap-x-6 gap-y-5`}>{children}</div>;
}
