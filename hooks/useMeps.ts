'use client';

import { useState, useEffect } from 'react';
import {
  getMepById,
  getAllMeps,
  getMepsByClub,
  searchMepsByName,
  getAllClubs,
  getClubStats,
} from '@/lib/firebase/firestore';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getAllMeps(options)
      .then((data) => {
        setMeps(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [options?.club, options?.active, options?.limitCount]);

  return { meps, loading, error };
};

/**
 * Hook to fetch MEPs by political club
 */
export const useMepsByClub = (club: string | null) => {
  const [meps, setMeps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!club) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getMepsByClub(club)
      .then((data) => {
        setMeps(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [club]);

  return { meps, loading, error };
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

/**
 * Hook to get aggregated stats for a club
 */
export const useClubStats = (club: string | null) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!club) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getClubStats(club)
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [club]);

  return { stats, loading, error };
};
