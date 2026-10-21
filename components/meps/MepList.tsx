'use client';

import { useState, useMemo, useCallback } from 'react';
import { Mep } from '@/types/mep';
import MepCard from './MepCard';
import MepFilters from './MepFilters';
import { getClubColorMap } from '@/lib/clubStyles';
import { normalize } from '@/lib/votings';
import { EmptyState } from '@/components/ui';
import { formatNumber } from '@/lib/format';

interface MepListProps {
  meps: Mep[];
  clubs: string[];
}

const ITEMS_PER_PAGE = 12;

export default function MepList({ meps, clubs }: MepListProps) {
  const clubColorMap = useMemo(() => getClubColorMap([...clubs].sort()), [clubs]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  // Filter and search MEPs
  const filteredMeps = useMemo(() => {
    return meps.filter((mep) => {
      // Search filter
      if (searchQuery) {
        // Ignore case and Polish diacritics, so "lukasz" finds "Łukasz"
        const tokens = normalize(searchQuery).split(/\s+/).filter(Boolean);
        const fields = [
          mep.firstName,
          mep.lastName,
          mep.fullName,
          String(mep.id),
          mep.profession ?? '',
          mep.districtName ?? '',
          mep.voivodeship ?? '',
        ].map(normalize);
        const allMatch = tokens.every((token) => fields.some((field) => field.includes(token)));
        if (!allMatch) return false;
      }

      // Club filter
      if (selectedClub && mep.club !== selectedClub) {
        return false;
      }

      // Active filter
      if (activeFilter !== null && mep.active !== activeFilter) {
        return false;
      }

      return true;
    });
  }, [meps, searchQuery, selectedClub, activeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMeps.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMeps = filteredMeps.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
    setCurrentPage(1);
  }, []);

  const handleClubChange = useCallback((club: string) => {
    setSelectedClub(club);
    setCurrentPage(1);
  }, []);

  const handleActiveChange = useCallback((active: boolean | null) => {
    setActiveFilter(active);
    setCurrentPage(1);
  }, []);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageButton = (active: boolean) =>
    `min-w-9 h-9 px-3 rounded-lg text-sm font-medium tabular transition-colors ${
      active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white hover:ring-1 hover:ring-slate-200'
    }`;

  const pagination = totalPages > 1 ? (
    <nav aria-label="Strony wyników" className="flex items-center justify-center gap-1 flex-wrap">
      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={`${pageButton(false)} disabled:opacity-40 disabled:pointer-events-none`}>
        ← Poprzednia
      </button>
      {getPageNumbers().map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={page}
            onClick={() => goToPage(page as number)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={pageButton(currentPage === page)}
          >
            {page}
          </button>
        ),
      )}
      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={`${pageButton(false)} disabled:opacity-40 disabled:pointer-events-none`}>
        Następna →
      </button>
    </nav>
  ) : null;

  return (
    <div>
      <MepFilters
        clubs={clubs}
        onSearchChange={handleSearchChange}
        onClubChange={handleClubChange}
        onActiveChange={handleActiveChange}
      />

      <p className="mb-4 text-sm text-slate-500">
        {formatNumber(filteredMeps.length)} {filteredMeps.length === meps.length ? 'posłów' : `z ${formatNumber(meps.length)} posłów`}
      </p>

      {currentMeps.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentMeps.map((mep) => (
              <MepCard key={mep.id} mep={mep} clubColor={mep.club ? clubColorMap[mep.club] : undefined} />
            ))}
          </div>
          <div className="mt-8">{pagination}</div>
        </>
      ) : (
        <EmptyState inCard title="Nie znaleziono posłów" description="Spróbuj zmienić kryteria wyszukiwania." />
      )}
    </div>
  );
}
