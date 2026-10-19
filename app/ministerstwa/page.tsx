'use client';

import { useEffect, useState } from 'react';
import { NavBar } from '@/components/layout/NavBar';
import { getMinistryStats } from '@/lib/firebase/firestore';
import { MinistryStat } from '@/types/mep';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const shareColor = (share: number) =>
  share >= 0.75 ? 'bg-green-500' : share >= 0.5 ? 'bg-yellow-500' : 'bg-red-500';

export default function MinistriesPage() {
  const [data, setData] = useState<{ computedOn: string; ministries: MinistryStat[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMinistryStats()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar backHref="/" maxWidth="max-w-4xl" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Jak ministerstwa odpowiadają posłom</h2>
          <p className="text-sm text-gray-500 mt-1">
            Interpelacje i zapytania poselskie X kadencji. Minister ma 21 dni na odpowiedź od przekazania pytania;
            może ten termin przedłużyć. Liczymy pytania skierowane do jednego adresata.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : !data ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">Brak danych.</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Adresat</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-48">W terminie 21 dni</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Mediana dni</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Bez odpowiedzi</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Pytań</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.ministries.map((m) => (
                    <tr key={m.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{capitalizeFirst(m.name)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${shareColor(m.onTimeShare)}`} style={{ width: `${m.onTimeShare * 100}%` }} />
                          </div>
                          <span className="w-10 text-right font-medium text-gray-700">{Math.round(m.onTimeShare * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{m.medianResponseDays ?? '—'}</td>
                      <td className={`px-4 py-3 text-right ${m.unanswered > 0 ? 'text-red-600' : 'text-gray-400'}`}>{m.unanswered}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{m.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-4 py-3 text-xs text-gray-400 border-t border-gray-100">
              Dane z API Sejmu, przeliczone {data.computedOn}. „Bez odpowiedzi” — pytania, na które termin już minął.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
