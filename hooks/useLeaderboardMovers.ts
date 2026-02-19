'use client';

import { useEffect, useState } from 'react';
import { getTwoLatestLeaderboardSnapshots } from '@/lib/firebase/firestore';
import { LeaderboardEntry } from '@/types/mep';

export interface MoverEntry extends LeaderboardEntry {
  rankChange: number;        // positive = rose, negative = fell
  previousRank: number;
  currentAttendancePct: string;
}

export interface LeaderboardMovers {
  risers: MoverEntry[];
  fallers: MoverEntry[];
  latestSitting: number;
  latestDate: string;
  previousSitting: number;
}

const TOP_N = 5;

export function useLeaderboardMovers() {
  const [movers, setMovers] = useState<LeaderboardMovers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTwoLatestLeaderboardSnapshots()
      .then(([latest, previous]) => {
        if (cancelled) return;
        if (!latest || !previous) {
          setMovers(null);
          return;
        }

        // Build a rank lookup from the previous snapshot
        const prevRankMap = new Map<number, number>();
        for (const entry of previous.rankings) {
          prevRankMap.set(entry.mepId, entry.rank);
        }

        // Compute rank change for every MEP in the latest snapshot that
        // also appeared in the previous snapshot
        const withChange: MoverEntry[] = [];
        for (const entry of latest.rankings) {
          const prevRank = prevRankMap.get(entry.mepId);
          if (prevRank == null) continue; // new MEP, skip
          const rankChange = prevRank - entry.rank; // positive = improved
          withChange.push({
            ...entry,
            rankChange,
            previousRank: prevRank,
            currentAttendancePct: (entry.attendanceRate * 100).toFixed(1),
          });
        }

        const risers = [...withChange]
          .filter((m) => m.rankChange > 0)
          .sort((a, b) => b.rankChange - a.rankChange)
          .slice(0, TOP_N);

        const fallers = [...withChange]
          .filter((m) => m.rankChange < 0)
          .sort((a, b) => a.rankChange - b.rankChange)
          .slice(0, TOP_N);

        setMovers({
          risers,
          fallers,
          latestSitting: latest.sitting,
          latestDate: latest.date,
          previousSitting: previous.sitting,
        });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load movers');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { movers, loading, error };
}
