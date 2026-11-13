'use client';

import { useMemo } from 'react';
import type { SittingTotals } from '@/types/mep';
import { clubAttendance, overallAttendance } from '@/lib/sitting';
import { formatDate, formatPercent, formatPointsDelta } from '@/lib/format';
import { ButtonLink, Card, ClubBadge, Stat, StatGrid } from '@/components/ui';

// Home-page teaser for /posiedzenie. Uses only stats/mep_list totals the page already
// has — the voting index (needed for the voting highlights) loads on the sitting page.
export function LatestSittingCard({ sittings }: { sittings: SittingTotals[] }) {
  const data = useMemo(() => {
    if (sittings.length === 0) return null;
    const latest = sittings.reduce((a, b) => (b.sitting > a.sitting ? b : a));
    const clubs = clubAttendance(sittings, latest.sitting).filter((c) => c.rate !== null);
    return {
      latest,
      attendance: overallAttendance(sittings, latest.sitting),
      best: clubs[0] ?? null,
      worst: clubs.length > 1 ? clubs[clubs.length - 1] : null,
    };
  }, [sittings]);

  if (!data) return null;
  const { latest, attendance, best, worst } = data;
  const delta = attendance.rate !== null && attendance.termRate !== null ? attendance.rate - attendance.termRate : null;

  return (
    <Card
      title={`Ostatnie posiedzenie · nr ${latest.sitting}`}
      description={`Głosowania zakończone ${formatDate(latest.date)}`}
      actions={<ButtonLink href="/posiedzenie" variant="secondary" size="sm">Podsumowanie posiedzenia →</ButtonLink>}
    >
      <StatGrid columns={3}>
        <Stat
          label="Obecność na głosowaniach"
          emphasis
          value={attendance.rate !== null ? formatPercent(attendance.rate) : '—'}
          hint={delta !== null ? `${formatPointsDelta(delta)} wobec średniej kadencji` : undefined}
        />
        {best && (
          <Stat
            label="Najwyższa obecność klubu"
            value={formatPercent(best.rate!)}
            hint={<ClubBadge club={best.club} />}
          />
        )}
        {worst && (
          <Stat
            label="Najniższa obecność klubu"
            value={formatPercent(worst.rate!)}
            hint={<ClubBadge club={worst.club} />}
          />
        )}
      </StatGrid>
    </Card>
  );
}
