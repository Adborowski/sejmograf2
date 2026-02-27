'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaSatelliteDish } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

interface NavBarProps {
  subtitle?: string;
  backHref?: string;
  navLinks?: Array<{ href: string; label: string }>;
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-7xl';
}

export function NavBar({ subtitle, backHref, navLinks = [], maxWidth = 'max-w-5xl' }: NavBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {backHref && (
              <Link
                href={backHref}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                ← Wróć
              </Link>
            )}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FaSatelliteDish size={20} color="#ef4444" aria-hidden="true" />
              </div>
              <div>
                <p className="text-neutral-950 text-xl font-bold leading-tight">Sejmograf</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop: nav links */}
            {navLinks.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Auth button (desktop) */}
            {!authLoading && (
              <div className="hidden sm:block">
                {user ? (
                  <button
                    onClick={() => signOut()}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Wyloguj się
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Zaloguj się
                  </Link>
                )}
              </div>
            )}

            {/* Mobile: hamburger button */}
            {(navLinks.length > 0 || !authLoading) && (
              <button
                className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100">
          <div className="px-2 py-2 space-y-0.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {label}
              </Link>
            ))}
            {!authLoading && (
              user ? (
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Wyloguj się
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
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
