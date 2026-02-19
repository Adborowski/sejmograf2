'use client';

import { useEffect, useState } from 'react';
import { getAllLeaderboardSnapshotMeta } from '@/lib/firebase/firestore';

export function useLatestSittingDate() {
  const [sitting, setSitting] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllLeaderboardSnapshotMeta()
      .then((snapshots) => {
        if (cancelled || snapshots.length === 0) return;
        const latest = snapshots[0]; // already sorted newest-first
        setSitting(latest.sitting);
        setDate(latest.date);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { sitting, date, loading };
}
