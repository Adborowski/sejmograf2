'use client';

import { useState, useEffect } from 'react';
import { getMepById, getAllMeps, getAllClubs, getMepList } from '@/lib/firebase/firestore';
import { SittingTotals } from '@/types/mep';

/**
 * Hook to fetch a single MEP by ID
 */
export const useMep = (mepId: number | null) => {
  const [mep, setMep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mepId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getMepById(mepId)
      .then((data) => {
        setMep(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [mepId]);

  return { mep, loading, error };
};

/**
 * Hook to fetch all MEPs with optional filtering
 */
export const useMeps = (options?: {
  club?: string;
  active?: boolean;
  limitCount?: number;
}) => {
  const [meps, setMeps] = useState<any[]>([]);
  const [sittings, setSittings] = useState<SittingTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Both resolve from the same cached stats/mep_list read
    Promise.all([getAllMeps(options), getMepList()])
      .then(([data, list]) => {
        setMeps(data);
        setSittings(list.sittings);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [options?.club, options?.active, options?.limitCount]);

  return { meps, sittings, loading, error };
};

/**
 * Hook to get all political clubs
 */
export const useClubs = () => {
  const [clubs, setClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getAllClubs()
      .then((data) => {
        setClubs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { clubs, loading, error };
};
