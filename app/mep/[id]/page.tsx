'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMep } from '@/hooks/useMeps';
import { getMepPhotoBigDirectURL, getMepPhotoDirectURL } from '@/lib/firebase/storage';
import { VotingStat } from '@/types/mep';
import { MepAttendanceChart } from '@/components/mep/MepAttendanceChart';
import { ReviewsSection } from '@/components/mep/ReviewsSection';
import { CLUB_COLOR_OVERRIDES, CLUB_LOGOS } from '@/lib/clubStyles';

const capitalizeCompound = (str: string) =>
  str.replace(/(^|[\s-])([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/g, (_, sep, letter) => sep + letter.toUpperCase());

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export default function MepStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mepId = parseInt(id, 10);
  const { mep, loading, error } = useMep(mepId);

  type PhotoState = 'big' | 'small' | 'error';
  const [photoState, setPhotoState] = useState<PhotoState>('big');
  const photoUrl = photoState === 'big'
    ? getMepPhotoBigDirectURL(mepId)
    : getMepPhotoDirectURL(mepId);

  // Compute aggregate stats from votingStats record
  const statsEntries: VotingStat[] = mep?.votingStats
    ? (Object.values(mep.votingStats) as VotingStat[]).sort((a, b) => b.sitting - a.sitting)
    : [];

  const totalVoted = statsEntries.reduce((sum, s) => sum + s.numVoted, 0);
  const totalVotings = statsEntries.reduce((sum, s) => sum + s.numVotings, 0);
  const overallRate = totalVotings > 0 ? ((totalVoted / totalVotings) * 100).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-4">
              <Link
                href="/search"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors shadow-sm"
              >
                ← Wróć
              </Link>
              <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Ładowanie...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : mep ? (
            <>
              {/* MEP Header */}
              <div className="relative bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {photoState !== 'error' ? (
                    <Image
                      src={photoUrl}
                      alt={mep.fullName}
                      fill
                      className="object-cover"
                      sizes="96px"
                      onError={() => setPhotoState(photoState === 'big' ? 'small' : 'error')}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-300 text-gray-500">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900">{mep.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {mep.club && (() => {
                      const clubColor = CLUB_COLOR_OVERRIDES[mep.club];
                      return (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={clubColor
                            ? { backgroundColor: `${clubColor}20`, color: clubColor, border: `1px solid ${clubColor}50` }
                            : { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }
                          }
                        >
                          {mep.club}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-gray-600 font-medium">Mandat nr {mep.id}</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mep.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {mep.active ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </div>
                </div>
                {mep.club && CLUB_LOGOS[mep.club] && (
                  <div className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center">
                    <img
                      src={CLUB_LOGOS[mep.club]}
                      alt={mep.club}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Informacje osobiste</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {mep.birthDate && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Data urodzenia</dt>
                      <dd className="text-gray-800">{mep.birthDate}</dd>
                    </div>
                  )}
                  {mep.birthLocation && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Miejsce urodzenia</dt>
                      <dd className="text-gray-800">{capitalizeCompound(mep.birthLocation)}</dd>
                    </div>
                  )}
                  {mep.educationLevel && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Wykształcenie</dt>
                      <dd className="text-gray-800">{capitalizeFirst(mep.educationLevel)}</dd>
                    </div>
                  )}
                  {mep.districtName && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Okręg Wyborczy</dt>
                      <dd className="text-gray-800">
                        {capitalizeCompound(mep.districtName)}
                        {mep.districtNum != null ? ` (nr ${mep.districtNum})` : ''}
                      </dd>
                    </div>
                  )}
                  {mep.voivodeship && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Województwo</dt>
                      <dd className="text-gray-800">{capitalizeCompound(mep.voivodeship)}</dd>
                    </div>
                  )}
                  {mep.numberOfVotes != null && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Liczba głosów</dt>
                      <dd className="text-gray-800">{mep.numberOfVotes.toLocaleString()}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Zawód</dt>
                    <dd className="text-gray-800">
                      {mep.profession ? capitalizeFirst(mep.profession) : <span className="text-gray-400">Nieznany</span>}
                    </dd>
                  </div>
                  {mep.email && (
                    <div>
                      <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">E-mail</dt>
                      <dd>
                        <a href={`mailto:${mep.email}`} className="text-blue-600 hover:underline">{mep.email}</a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Overall Stats */}
              {overallRate !== null && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-blue-600">{overallRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">Ogólna obecność</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-green-600">{totalVoted.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Głosowania oddane</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-gray-700">{totalVotings.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Łączna liczba głosowań</p>
                  </div>
                </div>
              )}

              <ReviewsSection mepId={mepId} />

              {/* Attendance chart */}
              {overallRate !== null && (
                <MepAttendanceChart statsEntries={[...statsEntries].reverse()} overallRate={parseFloat(overallRate)} />
              )}

              {/* Per-Sitting Table */}
              {statsEntries.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Głosowania wg posiedzenia</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">Posiedzenie</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">Data</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Oddane</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Nieobecny</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Łącznie</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Obecność</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {statsEntries.map((stat) => {
                          const rate = stat.numVotings > 0
                            ? ((stat.numVoted / stat.numVotings) * 100).toFixed(1)
                            : null;
                          const rateNum = rate ? parseFloat(rate) : 0;
                          return (
                            <tr key={stat.sitting} className="hover:bg-gray-50">
                              <td className="px-6 py-3 font-medium text-gray-900">#{stat.sitting}</td>
                              <td className="px-6 py-3 text-gray-600">{stat.date}</td>
                              <td className="px-6 py-3 text-right text-green-700">{stat.numVoted}</td>
                              <td className="px-6 py-3 text-right text-red-600">{stat.numMissed}</td>
                              <td className="px-6 py-3 text-right text-gray-600">{stat.numVotings}</td>
                              <td className="px-6 py-3 text-right">
                                {rate !== null ? (
                                  <span className={`font-medium ${rateNum >= 80 ? 'text-green-600' : rateNum >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    {rate}%
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
                  Brak danych o głosowaniach.
                </div>
              )}

            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              Nie znaleziono posła.
            </div>
          )}
        </main>
      </div>
  );
}
