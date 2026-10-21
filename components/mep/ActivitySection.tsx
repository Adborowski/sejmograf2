'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MepActivity } from '@/types/mep';
import { getRecentQuestions, QuestionItem } from '@/lib/sejmApi';
import { RevealButton } from './RevealButton';
import { Badge, BadgeTone, Card, LoadingState, SectionLabel, Stat, StatGrid } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';

const capitalizeFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const STATUS: Record<QuestionItem['status'], BadgeTone> = {
  answered: 'green',
  extended: 'amber',
  pending: 'neutral',
};

const STATUS_LABEL: Record<QuestionItem['status'], string> = {
  answered: 'Odpowiedź',
  extended: 'Termin przedłużony',
  pending: 'Czeka na odpowiedź',
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
  const [revealed, setRevealed] = useState(false);
  const [recent, setRecent] = useState<QuestionItem[] | null>(null);
  const [recentError, setRecentError] = useState(false);
  const total = activity ? activity.interpellations + activity.writtenQuestions : 0;

  useEffect(() => {
    if (!total || !revealed) return;
    let cancelled = false;
    getRecentQuestions(mepId, 8)
      .then((items) => { if (!cancelled) setRecent(items); })
      .catch(() => { if (!cancelled) setRecentError(true); });
    return () => { cancelled = true; };
  }, [mepId, total, revealed]);

  // Docs written before the activity step existed have no `activity` field
  if (!activity) return null;

  return (
    <Card
      id="interpelacje"
      title="Interpelacje i zapytania"
      actions={<Link href="/ministerstwa" className="text-sm font-medium text-blue-700 hover:text-blue-800">Jak odpowiadają ministerstwa →</Link>}
    >
      {total === 0 ? (
        <p className="text-sm text-slate-500">Brak interpelacji i zapytań w tej kadencji.</p>
      ) : (
        <>
          <StatGrid>
            <Stat emphasis label="Interpelacje" value={formatNumber(activity.interpellations)} />
            <Stat label="Zapytania" value={formatNumber(activity.writtenQuestions)} />
            <Stat label="Pierwszy podpis" value={formatNumber(activity.firstAuthor)} hint="pozostałe to współpodpisane" />
          </StatGrid>

          {activity.topRecipients.length > 0 && (
            <div className="mt-6">
              <SectionLabel>Najczęściej kierowane do</SectionLabel>
              <ul className="space-y-1.5">
                {activity.topRecipients.map((r) => (
                  <li key={r.name} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-800">{capitalizeFirst(r.name)}</span>
                    <span className="text-slate-500 tabular flex-shrink-0">{formatNumber(r.count)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            {!revealed ? (
              <RevealButton label="Pokaż ostatnie interpelacje i zapytania" onClick={() => setRevealed(true)} />
            ) : (
              <>
                <SectionLabel>Ostatnie</SectionLabel>
                {recentError ? (
                  <p className="text-sm text-slate-500">Nie udało się pobrać listy z API Sejmu.</p>
                ) : recent === null ? (
                  <LoadingState compact />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {recent.map((q) => (
                      <li key={`${q.type}-${q.num}`} className="py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
                          <span>{TYPE_LABEL[q.type]} nr {q.num} · {formatDate(q.receiptDate)}</span>
                          {q.answer ? (
                            <a href={q.answer.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              <Badge tone="green">Odpowiedź{q.answer.isPdf ? ' (PDF)' : ''} ↗</Badge>
                            </a>
                          ) : (
                            <Badge tone={STATUS[q.status]}>{STATUS_LABEL[q.status]}</Badge>
                          )}
                        </div>
                        {q.bodyUrl ? (
                          <a href={q.bodyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-800 hover:text-blue-700 hover:underline line-clamp-2">
                            {q.title}
                          </a>
                        ) : (
                          <p className="text-sm text-slate-800 line-clamp-2">{q.title}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
