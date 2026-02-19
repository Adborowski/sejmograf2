'use client';

import { useState, useMemo, useCallback } from 'react';
import { Mep } from '@/types/mep';
import MepCard from './MepCard';
import MepFilters from './MepFilters';
import { getClubColorMap } from '@/lib/clubStyles';

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
        const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
        const fields = [
          mep.firstName.toLowerCase(),
          mep.lastName.toLowerCase(),
          mep.fullName.toLowerCase(),
          String(mep.id),
          mep.profession?.toLowerCase() ?? '',
          mep.districtName?.toLowerCase() ?? '',
          mep.voivodeship?.toLowerCase() ?? '',
        ];
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

  return (
    <div>
      {/* Filters */}
      <MepFilters
        clubs={clubs}
        onSearchChange={handleSearchChange}
        onClubChange={handleClubChange}
        onActiveChange={handleActiveChange}
      />

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600">
        Pokazuję {currentMeps.length} z {filteredMeps.length} posłów
        {filteredMeps.length !== meps.length && ` (odfiltrowano z ${meps.length} łącznie)`}
      </div>

      {/* MEP Grid */}
      {currentMeps.length > 0 ? (
        <>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Poprzednia
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page as number)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Następna
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentMeps.map((mep) => (
              <MepCard key={mep.id} mep={mep} clubColor={mep.club ? clubColorMap[mep.club] : undefined} />
            ))}
          </div>
        </>
      ) : (
        // No results
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nie znaleziono posłów</h3>
          <p className="mt-1 text-sm text-gray-500">
            Spróbuj zmienić kryteria wyszukiwania
          </p>
        </div>
      )}
    </div>
  );
}
