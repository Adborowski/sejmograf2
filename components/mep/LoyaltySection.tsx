'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MepLoyalty, Rebellion } from '@/types/mep';
import { Card, SectionLabel, Stat, StatGrid } from '@/components/ui';
import { API_VOTE_CODES, VoteBadge } from '@/components/votes/VoteBadge';
import { VOTE_LABELS } from '@/lib/votings';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';

const lineLabel = (vote: Rebellion['vote']) => VOTE_LABELS[API_VOTE_CODES[vote]].toLowerCase();

interface LoyaltySectionProps {
  loyalty?: MepLoyalty;
}

export function LoyaltySection({ loyalty }: LoyaltySectionProps) {
  const [showAll, setShowAll] = useState(false);
  // Docs written before the votes step existed have no `loyalty` field
  if (!loyalty) return null;
  const rebellions = showAll ? loyalty.recentRebellions : loyalty.recentRebellions.slice(0, 5);

  return (
    <Card
      id="lojalnosc"
      title="Zgodność z klubem"
      description="Jak często głosy są zgodne z większością klubu w chwili głosowania. Liczymy głosowania, w których klub miał wyraźną większość."
    >
      {loyalty.loyalty === null ? (
        <p className="text-sm text-slate-500">
          {loyalty.cast === 0
            ? 'Brak oddanych głosów w tej kadencji.'
            : 'Głosy oddane poza klubem (niezrzeszeni) — brak linii klubu do porównania.'}
        </p>
      ) : (
        <>
          <StatGrid>
            <Stat
              emphasis
              label="Zgodnie z klubem"
              value={formatPercent(loyalty.loyalty)}
              hint={loyalty.clubAverage !== null ? `średnia ${loyalty.club}: ${formatPercent(loyalty.clubAverage)}` : undefined}
            />
            <Stat
              label="Głosy wbrew klubowi"
              value={formatNumber(loyalty.rebellions)}
              hint={`w tym ${formatNumber(loyalty.opposed)} odwrotnie · na ${formatNumber(loyalty.withLine)}`}
            />
            <Stat
              label="Wstrzymania się"
              value={loyalty.abstainRate !== null ? formatPercent(loyalty.abstainRate) : '—'}
              hint={loyalty.sejmAverage !== null ? `średnia zgodności w Sejmie: ${formatPercent(loyalty.sejmAverage)}` : undefined}
            />
          </StatGrid>

          {loyalty.recentRebellions.length > 0 && (
            <div className="mt-6">
              <SectionLabel>Ostatnie głosy wbrew klubowi</SectionLabel>
              <ul className="divide-y divide-slate-100">
                {rebellions.map((r) => (
                  <li key={`${r.sitting}/${r.num}`} className="py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {formatDate(r.date)} · klub {r.club}: {lineLabel(r.clubLine)}
                      </p>
                      <Link
                        href={`/glosowania?v=${r.sitting}/${r.num}`}
                        className="text-sm text-slate-800 hover:text-blue-700 hover:underline line-clamp-2"
                      >
                        {r.topic || r.title}
                      </Link>
                    </div>
                    <VoteBadge code={API_VOTE_CODES[r.vote]} />
                  </li>
                ))}
              </ul>
              {loyalty.recentRebellions.length > 5 && (
                <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-sm font-medium text-blue-700 hover:text-blue-800">
                  {showAll ? 'Pokaż mniej' : `Pokaż wszystkie (${loyalty.recentRebellions.length})`}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
