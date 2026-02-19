'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMepReviews, Review } from '@/lib/firebase/reviews';

export const useReviews = (mepId: number) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMepReviews(mepId);
      setReviews(data);
    } finally {
      setLoading(false);
    }
  }, [mepId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { reviews, loading, reload };
};
