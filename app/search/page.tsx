'use client';

import Link from 'next/link';
import { useMeps, useClubs } from '@/hooks/useMeps';
import MepList from '@/components/meps/MepList';
import { Mep } from '@/types/mep';

export default function SearchPage() {
  const { meps, loading: mepsLoading, error: mepsError } = useMeps();
  const { clubs, loading: clubsLoading } = useClubs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
            >
              ← Wróć
            </Link>
            <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Posłowie i Posłanki</h2>
          <p className="text-gray-600">Przeglądaj i wyszukuj posłów polskiego Sejmu</p>
        </div>

        {mepsLoading || clubsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Ładowanie...</p>
            </div>
          </div>
        ) : mepsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Błąd ładowania danych</h3>
            <p className="text-red-700">{mepsError}</p>
          </div>
        ) : (
          <MepList meps={meps as Mep[]} clubs={clubs} />
        )}
      </main>
    </div>
  );
}
