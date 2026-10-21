'use client';

import { useEffect, useState } from 'react';
import { getClubAgreement } from '@/lib/firebase/firestore';
import { CLUB_FULL_NAMES } from '@/lib/clubStyles';
import { ClubAgreementData } from '@/types/mep';
import { Card, LoadingState, SegmentedControl } from '@/components/ui';
import { formatNumber } from '@/lib/format';

// Sequential blue ramp, light → dark (dataviz reference palette, steps 100–700)
const RAMP = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5',
  '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
];
const cellColor = (share: number) => RAMP[Math.min(RAMP.length - 1, Math.round(share * (RAMP.length - 1)))];
// Steps from #3987e5 on are dark enough to need light text
const needsLightText = (share: number) => Math.round(share * (RAMP.length - 1)) >= 6;

type Period = 'recent' | 'all';

export function ClubAgreementMatrix() {
  const [data, setData] = useState<ClubAgreementData | null>(null);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<Period>('recent');
  const [hover, setHover] = useState<{ a: string; b: string } | null>(null);

  useEffect(() => {
    getClubAgreement().then(setData).catch(() => setError(true));
  }, []);

  // Non-critical section: hide it if the data can't be loaded
  if (error) return null;

  const current = data?.[period];
  const hovered = hover && current?.pairs[hover.a]?.[hover.b];

  return (
    <Card
      title="Z kim głosują kluby"
      description="Jak często większości dwóch klubów głosowały tak samo. Liczą się głosowania, w których oba kluby miały wyraźną większość."
      actions={
        <SegmentedControl
          label="Okres"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'recent', label: 'Ostatnie 6 mies.' },
            { value: 'all', label: 'Cała kadencja' },
          ]}
        />
      }
    >
      {!current ? (
        <LoadingState compact />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="text-xs border-separate" style={{ borderSpacing: 2 }} onMouseLeave={() => setHover(null)}>
              <thead>
                <tr>
                  <th />
                  {current.clubs.map((club) => (
                    <th key={club} scope="col" className="px-1 pb-1 font-medium text-slate-600 align-bottom">
                      <span className="block whitespace-nowrap [writing-mode:vertical-rl] rotate-180 mx-auto" title={CLUB_FULL_NAMES[club] ?? club}>
                        {club}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.clubs.map((a) => (
                  <tr key={a}>
                    <th scope="row" className="pr-2 text-right font-medium text-slate-600 whitespace-nowrap" title={CLUB_FULL_NAMES[a] ?? a}>
                      {a}
                    </th>
                    {current.clubs.map((b) => {
                      const pair = current.pairs[a]?.[b];
                      if (a === b) return <td key={b} className="w-10 h-9 rounded bg-slate-50" />;
                      if (!pair) return <td key={b} className="w-10 h-9 rounded bg-slate-50 text-center text-slate-300">—</td>;
                      const share = pair.agree / pair.n;
                      const active = hover && ((hover.a === a && hover.b === b) || (hover.a === b && hover.b === a));
                      return (
                        <td
                          key={b}
                          onMouseEnter={() => setHover({ a, b })}
                          className={`w-10 h-9 rounded text-center tabular-nums font-medium cursor-default ${
                            needsLightText(share) ? 'text-white' : 'text-slate-900'
                          } ${active ? 'ring-2 ring-slate-900' : ''}`}
                          style={{ backgroundColor: cellColor(share) }}
                        >
                          {Math.round(share * 100)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap mt-4 text-xs text-slate-500">
            <p className="min-h-[1rem]" aria-live="polite">
              {hover && hovered ? (
                <>
                  <span className="font-semibold text-slate-800">{hover.a} i {hover.b}</span>: zgodnie w{' '}
                  {Math.round((hovered.agree / hovered.n) * 100)}% głosowań ({formatNumber(hovered.agree)} z {formatNumber(hovered.n)})
                </>
              ) : (
                <>Wartości w %. {period === 'recent' ? `Od ${data!.since}.` : 'Od początku X kadencji.'}</>
              )}
            </p>
            <div className="flex items-center gap-2" aria-hidden="true">
              <span>0%</span>
              <span className="flex h-2 w-32 rounded-full overflow-hidden">
                {RAMP.map((c) => <span key={c} className="flex-1" style={{ backgroundColor: c }} />)}
              </span>
              <span>100%</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
