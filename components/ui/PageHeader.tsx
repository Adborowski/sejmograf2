import { ReactNode } from 'react';

interface PageHeaderProps {
  /** Short label above the title, e.g. the section of the site */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)] mb-2">{eyebrow}</p>
        )}
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-base text-slate-500 mt-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
} as const;

/** Page content container — the nav and footer come from the root layout */
export function Page({ width = 'default', children }: { width?: keyof typeof WIDTHS; children: ReactNode }) {
  return <main className={`${WIDTHS[width]} mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12`}>{children}</main>;
}
