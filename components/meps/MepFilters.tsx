'use client';

import { useState, useEffect } from 'react';
import { CLUB_FULL_NAMES } from '@/lib/clubStyles';

interface MepFiltersProps {
  clubs: string[];
  onSearchChange: (search: string) => void;
  onClubChange: (club: string) => void;
  onActiveChange: (active: boolean | null) => void;
}

export default function MepFilters({
  clubs,
  onSearchChange,
  onClubChange,
  onActiveChange,
}: MepFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, onSearchChange]);

  const handleClubChange = (club: string) => {
    setSelectedClub(club);
    onClubChange(club);
  };

  const handleActiveChange = (filter: 'all' | 'active' | 'inactive') => {
    setActiveFilter(filter);
    if (filter === 'all') {
      onActiveChange(null);
    } else if (filter === 'active') {
      onActiveChange(true);
    } else {
      onActiveChange(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedClub('');
    setActiveFilter('all');
    onSearchChange('');
    onClubChange('');
    onActiveChange(null);
  };

  const hasActiveFilters = search || selectedClub || activeFilter !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Filtruj posłów</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Szukaj
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Imię, nazwisko, ID, zawód, okręg, region…"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-neutral-950 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Club Filter */}
        <div>
          <label
            htmlFor="club"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Klub polityczny
          </label>
          <select
            id="club"
            value={selectedClub}
            onChange={(e) => handleClubChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-neutral-950 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Wszystkie kluby</option>
            {clubs.map((club) => (
              <option key={club} value={club}>
                {CLUB_FULL_NAMES[club] ?? club}
              </option>
            ))}
          </select>
        </div>

        {/* Active Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status mandatu
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleActiveChange('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wszyscy
            </button>
            <button
              onClick={() => handleActiveChange('active')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aktywni
            </button>
            <button
              onClick={() => handleActiveChange('inactive')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeFilter === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nieaktywni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
