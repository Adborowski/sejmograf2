'use client';

import { useEffect, useState } from 'react';
import { getMinistryStats } from '@/lib/firebase/firestore';
import { MinistryStat } from '@/types/mep';
import { Card, EmptyState, ErrorState, LoadingState, Page, PageHeader } from '@/components/ui';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const shareColor = (share: number) =>
  share >= 0.75 ? 'bg-emerald-500' : share >= 0.5 ? 'bg-amber-400' : 'bg-rose-500';

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
    <Page>
      <PageHeader
        eyebrow="Ministerstwa"
        title="Jak ministerstwa odpowiadają posłom"
        description="Minister ma 21 dni na odpowiedź na interpelację lub zapytanie (może ten termin przedłużyć). Ranking od najgorzej dotrzymujących terminu."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <EmptyState inCard title="Brak danych." />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3 text-left font-medium">Adresat</th>
                  <th className="px-5 py-3 text-left font-medium w-52">W terminie 21 dni</th>
                  <th className="px-5 py-3 text-right font-medium">Mediana dni</th>
                  <th className="px-5 py-3 text-right font-medium">Bez odpowiedzi</th>
                  <th className="px-5 py-3 text-right font-medium">Pytań</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular">
                {data.ministries.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-slate-900">{capitalizeFirst(m.name)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${shareColor(m.onTimeShare)}`} style={{ width: `${m.onTimeShare * 100}%` }} />
                        </div>
                        <span className="w-12 text-right font-semibold text-slate-900">{formatPercent(m.onTimeShare, 0)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{m.medianResponseDays !== null ? String(m.medianResponseDays).replace('.', ',') : '—'}</td>
                    <td className={`px-5 py-3 text-right ${m.unanswered > 0 ? 'text-rose-600 font-medium' : 'text-slate-300'}`}>
                      {formatNumber(m.unanswered)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatNumber(m.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100">
            Dane z API Sejmu, przeliczone {formatDate(data.computedOn)}. Liczymy pytania skierowane do jednego adresata.
            „Bez odpowiedzi” — pytania, dla których termin już minął.
          </p>
        </Card>
      )}
    </Page>
  );
}
