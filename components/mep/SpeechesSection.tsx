'use client';

import { useEffect, useState } from 'react';
import { MepSpeeches } from '@/types/mep';
import { getStatementTopic, statementUrl } from '@/lib/sejmApi';

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} godz. ${minutes % 60} min`;
};

const KIND_LABEL: Record<MepSpeeches['recent'][number]['kind'], string | null> = {
  speech: null,
  written: 'Na piśmie',
  official: 'Jako członek rządu',
};

interface SpeechesSectionProps {
  speeches?: MepSpeeches;
}

export function SpeechesSection({ speeches }: SpeechesSectionProps) {
  // undefined = still loading, null = no agenda item / failed
  const [topics, setTopics] = useState<Record<string, string | null>>({});
  const recent = speeches?.recent ?? [];
  const recentKey = recent.map((r) => `${r.proceeding}/${r.date}/${r.num}`).join(',');

  useEffect(() => {
    let cancelled = false;
    for (const r of recent) {
      const key = `${r.proceeding}/${r.date}/${r.num}`;
      getStatementTopic(r.proceeding, r.date, r.num)
        .catch(() => null)
        .then((topic) => {
          if (!cancelled) setTopics((t) => ({ ...t, [key]: topic }));
        });
    }
    return () => { cancelled = true; };
    // recentKey captures the list's identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentKey]);

  // Docs written before the speeches step existed have no `speeches` field
  if (!speeches) return null;

  const total = speeches.speeches + speeches.official + speeches.written;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Wystąpienia na sali plenarnej</h3>

      {total === 0 ? (
        <p className="text-sm text-gray-500">Brak wystąpień na posiedzeniach Sejmu w tej kadencji.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-2 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{speeches.speeches.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Wystąpienia</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{formatDuration(speeches.seconds)}</p>
              <p className="text-xs text-gray-500 mt-1">Łączny czas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{speeches.daysSpoken}</p>
              <p className="text-xs text-gray-500 mt-1">Dni z wystąpieniem</p>
            </div>
          </div>
          {(speeches.written > 0 || speeches.official > 0 || speeches.rapporteur > 0) && (
            <p className="text-xs text-gray-500 text-center mb-5">
              {[
                speeches.rapporteur > 0 && `${speeches.rapporteur} jako sprawozdawca`,
                speeches.written > 0 && `${speeches.written} na piśmie`,
                speeches.official > 0 && `${speeches.official} jako członek rządu`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}

          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2 mt-5">Ostatnie</p>
          <ul className="divide-y divide-gray-100">
            {recent.map((r) => {
              const key = `${r.proceeding}/${r.date}/${r.num}`;
              const topic = topics[key];
              return (
                <li key={key} className="py-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                    <span>Posiedzenie {r.proceeding}</span>
                    <span>·</span>
                    <span>{r.date}</span>
                    {KIND_LABEL[r.kind] && (
                      <span className="px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {KIND_LABEL[r.kind]}
                      </span>
                    )}
                  </div>
                  <a
                    href={statementUrl(r.proceeding, r.date, r.num)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-800 hover:text-blue-600 hover:underline"
                  >
                    {topic === undefined ? (
                      <span className="inline-block h-4 w-3/4 bg-gray-100 rounded animate-pulse align-middle" />
                    ) : (
                      topic ?? 'Wystąpienie'
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
