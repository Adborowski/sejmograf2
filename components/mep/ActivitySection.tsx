'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MepActivity } from '@/types/mep';
import { getRecentQuestions, QuestionItem } from '@/lib/sejmApi';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const STATUS: Record<QuestionItem['status'], { label: string; className: string }> = {
  answered: { label: 'Odpowiedź', className: 'bg-green-100 text-green-800' },
  extended: { label: 'Termin przedłużony', className: 'bg-amber-100 text-amber-800' },
  pending: { label: 'Czeka na odpowiedź', className: 'bg-gray-100 text-gray-600' },
};

const TYPE_LABEL: Record<QuestionItem['type'], string> = {
  interpellation: 'Interpelacja',
  writtenQuestion: 'Zapytanie',
};

interface ActivitySectionProps {
  mepId: number;
  activity?: MepActivity;
}

export function ActivitySection({ mepId, activity }: ActivitySectionProps) {
  const [recent, setRecent] = useState<QuestionItem[] | null>(null);
  const [recentError, setRecentError] = useState(false);
  const total = activity ? activity.interpellations + activity.writtenQuestions : 0;

  useEffect(() => {
    if (!total) return;
    let cancelled = false;
    getRecentQuestions(mepId, 8)
      .then((items) => { if (!cancelled) setRecent(items); })
      .catch(() => { if (!cancelled) setRecentError(true); });
    return () => { cancelled = true; };
  }, [mepId, total]);

  // Docs written before the activity step existed have no `activity` field
  if (!activity) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Interpelacje i zapytania</h3>

      {total === 0 ? (
        <p className="text-sm text-gray-500">Brak interpelacji i zapytań w tej kadencji.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{activity.interpellations.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Interpelacje</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{activity.writtenQuestions.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Zapytania</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{activity.firstAuthor.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Jako pierwszy autor</p>
            </div>
          </div>

          {activity.topRecipients.length > 0 && (
            <div className="mb-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Najczęściej pyta</p>
              <ul className="space-y-1">
                {activity.topRecipients.map((r) => (
                  <li key={r.name} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-800">{capitalizeFirst(r.name)}</span>
                    <span className="text-gray-500 flex-shrink-0">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Ostatnie</p>
          {recentError ? (
            <p className="text-sm text-gray-500">Nie udało się pobrać listy z API Sejmu.</p>
          ) : recent === null ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((q) => (
                <li key={`${q.type}-${q.num}`} className="py-2.5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                    <span>{TYPE_LABEL[q.type]} nr {q.num}</span>
                    <span>·</span>
                    <span>{q.receiptDate}</span>
                    {q.answer ? (
                      <a
                        href={q.answer.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-2 py-0.5 rounded-full font-medium hover:underline ${STATUS.answered.className}`}
                      >
                        {STATUS.answered.label}{q.answer.isPdf ? ' (PDF)' : ''} ↗
                      </a>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS[q.status].className}`}>
                        {STATUS[q.status].label}
                      </span>
                    )}
                  </div>
                  {q.bodyUrl ? (
                    <a href={q.bodyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-800 hover:text-blue-600 hover:underline">
                      {q.title}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-800">{q.title}</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Jak ministerstwa odpowiadają na pytania posłów?{' '}
            <Link href="/ministerstwa" className="text-blue-600 hover:underline">Zobacz ranking</Link>
          </p>
        </>
      )}
    </div>
  );
}
