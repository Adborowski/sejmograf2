'use client';

import { useState, useEffect } from 'react';
import { CLUB_FULL_NAMES } from '@/lib/clubStyles';
import { CARD_CLASS, Label, SearchInput, Select, SegmentedControl } from '@/components/ui';

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
    <div className={`${CARD_CLASS} p-4 sm:p-5 mb-6`}>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end">
        <div>
          <Label htmlFor="search">Szukaj</Label>
          <SearchInput
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Imię, nazwisko, nr mandatu, zawód, okręg, województwo…"
          />
        </div>
        <div>
          <Label htmlFor="club">Klub</Label>
          <Select id="club" value={selectedClub} onChange={(e) => handleClubChange(e.target.value)}>
            <option value="">Wszystkie kluby</option>
            {clubs.map((club) => (
              <option key={club} value={club}>
                {CLUB_FULL_NAMES[club] ?? club}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedControl
            label="Status mandatu"
            value={activeFilter}
            onChange={handleActiveChange}
            options={[
              { value: 'all', label: 'Wszyscy' },
              { value: 'active', label: 'Aktywni' },
              { value: 'inactive', label: 'Byli' },
            ]}
          />
          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="text-sm font-medium text-blue-700 hover:text-blue-800 whitespace-nowrap">
              Wyczyść
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
