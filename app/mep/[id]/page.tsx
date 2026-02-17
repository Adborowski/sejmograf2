'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useMep } from '@/hooks/useMeps';
import { getMepPhotoBigDirectURL } from '@/lib/firebase/storage';
import { VotingStat } from '@/types/mep';

export default function MepStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mepId = parseInt(id, 10);
  const { mep, loading, error } = useMep(mepId);

  const photoUrl = getMepPhotoBigDirectURL(mepId);

  // Compute aggregate stats from votingStats record
  const statsEntries: VotingStat[] = mep?.votingStats
    ? Object.values(mep.votingStats).sort((a: VotingStat, b: VotingStat) => a.sitting - b.sitting)
    : [];

  const totalVoted = statsEntries.reduce((sum, s) => sum + s.numVoted, 0);
  const totalVotings = statsEntries.reduce((sum, s) => sum + s.numVotings, 0);
  const overallRate = totalVotings > 0 ? ((totalVoted / totalVotings) * 100).toFixed(1) : null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16 gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                ← Back
              </Link>
              <span className="text-gray-300">|</span>
              <h1 className="text-neutral-950 text-xl font-bold">Sejmograf</h1>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{error}</p>
            </div>
          ) : mep ? (
            <>
              {/* MEP Header */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={photoUrl}
                    alt={mep.fullName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900">{mep.fullName}</h2>
                  {mep.club && <p className="text-blue-600 font-medium mt-1">{mep.club}</p>}
                  {mep.districtName && (
                    <p className="text-sm text-gray-500 mt-1">{mep.districtName}{mep.voivodeship ? `, ${mep.voivodeship}` : ''}</p>
                  )}
                  <span
                    className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mep.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {mep.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Overall Stats */}
              {overallRate !== null && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-blue-600">{overallRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">Overall attendance</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-green-600">{totalVoted.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Votes cast</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-5 text-center">
                    <p className="text-3xl font-bold text-gray-700">{totalVotings.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">Total votings</p>
                  </div>
                </div>
              )}

              {/* Per-Sitting Table */}
              {statsEntries.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Voting by Sitting</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">Sitting</th>
                          <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Voted</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Missed</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Total</th>
                          <th className="px-6 py-3 text-right font-medium text-gray-500">Attendance</th>
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
                  No voting data available for this MEP.
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              MEP not found.
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
