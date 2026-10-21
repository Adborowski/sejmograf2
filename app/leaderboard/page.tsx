'use client';

import { useMemo, useState } from 'react';
import { useMeps } from '@/hooks/useMeps';
import { MepRankRow } from '@/components/leaderboard/MepRankRow';
import { Card, ErrorState, LoadingState, Page, PageHeader, SegmentedControl } from '@/components/ui';
import { plural } from '@/lib/format';

export default function FullLeaderboardPage() {
  const { meps, loading, error } = useMeps();
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const descSorted = useMemo(
    () =>
      [...meps]
        .filter((m) => m.active && m.attendanceRate !== null && m.attendanceRate !== undefined)
        .sort((a, b) => b.attendanceRate - a.attendanceRate),
    [meps],
  );
  const activeSorted = sortDir === 'desc' ? descSorted : [...descSorted].reverse();

  // Dense ranking (always based on desc order for consistent rank numbers)
  const rankMap = useMemo(() => {
    const map = new Map<number, number>();
    let currentRank = 1;
    for (let i = 0; i < descSorted.length; i++) {
      if (i > 0 && descSorted[i].attendanceRate !== descSorted[i - 1].attendanceRate) currentRank++;
      map.set(descSorted[i].id, currentRank);
    }
    return map;
  }, [descSorted]);

  const total = activeSorted.length;

  return (
    <Page width="narrow">
      <PageHeader
        eyebrow="Ranking"
        title="Obecność na głosowaniach"
        description="Wszyscy aktywni posłowie według udziału w głosowaniach od początku X kadencji."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <Card
          padded={false}
          title={`${total} ${plural(total, 'poseł', 'posłów', 'posłów')}`}
          actions={
            <SegmentedControl
              label="Kolejność"
              value={sortDir}
              onChange={setSortDir}
              options={[
                { value: 'desc', label: 'Najwyższa' },
                { value: 'asc', label: 'Najniższa' },
              ]}
            />
          }
        >
          <div className="divide-y divide-slate-100">
            {activeSorted.map((mep) => {
              const rank = rankMap.get(mep.id)!;
              const highlight = rank <= 20 ? 'top' : rank > total - 20 ? 'bottom' : 'neutral';
              return <MepRankRow key={mep.id} rank={rank} mep={mep} highlight={highlight} />;
            })}
          </div>
        </Card>
      )}
    </Page>
  );
}
