'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaSatelliteDish } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURES } from '@/lib/features';

// Site-wide navigation, rendered once by the root layout
const LINKS = [
  { href: '/leaderboard', label: 'Ranking', match: ['/leaderboard'] },
  { href: '/search', label: 'Posłowie', match: ['/search', '/mep'] },
  { href: '/clubs', label: 'Kluby', match: ['/clubs', '/club'] },
  { href: '/glosowania', label: 'Głosowania', match: ['/glosowania'] },
  { href: '/ministerstwa', label: 'Ministerstwa', match: ['/ministerstwa'] },
];

const isActive = (pathname: string, match: string[]) =>
  match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

export function NavBar() {
  const pathname = usePathname() ?? '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const showAuth = FEATURES.reviews && !authLoading;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="w-8 h-8 rounded-lg bg-brand-900 flex items-center justify-center">
              <FaSatelliteDish size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">Sejmograf</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {LINKS.map(({ href, label, match }) => {
              const active = isActive(pathname, match);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            {showAuth && (
              user ? (
                <button onClick={() => signOut()} className="ml-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Wyloguj się
                </button>
              ) : (
                <Link href="/login" className="ml-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                  Zaloguj się
                </Link>
              )
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-3 py-2 space-y-0.5">
            {LINKS.map(({ href, label, match }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(pathname, match) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </Link>
            ))}
            {showAuth && (
              user ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Wyloguj się
                </button>
              ) : (
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Zaloguj się
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
