import { ReactNode } from 'react';

// The one card surface used across the site: white, hairline ring, soft shadow.
export const CARD_CLASS = 'bg-white rounded-2xl ring-1 ring-slate-900/[0.06] shadow-sm';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Right side of the header: toggles, links, counts */
  actions?: ReactNode;
  /** Set false for edge-to-edge content such as lists and tables */
  padded?: boolean;
  id?: string;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, actions, padded = true, id, className = '', children }: CardProps) {
  const hasHeader = title || description || actions;
  return (
    <section id={id} className={`${CARD_CLASS} ${id ? 'scroll-mt-24' : ''} ${className}`}>
      {hasHeader && (
        <header className={`flex items-start justify-between gap-4 flex-wrap px-5 sm:px-6 pt-5 ${padded ? '' : 'pb-4 border-b border-slate-100'}`}>
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>}
            {description && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </header>
      )}
      <div className={padded ? `px-5 sm:px-6 pb-5 ${hasHeader ? 'pt-4' : 'pt-5'}` : ''}>{children}</div>
    </section>
  );
}

/** Small uppercase label above a group inside a card */
export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-2 ${className}`}>
      {children}
    </p>
  );
}
