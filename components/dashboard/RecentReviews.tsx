'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentReviews, RecentReview } from '@/lib/firebase/reviews';

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-sm tracking-tight">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span key={n} className={value >= n ? 'text-amber-400' : 'text-gray-200'}>★</span>
      ))}
    </span>
  );
}

export function RecentReviews({ getMepName }: { getMepName: (id: number) => string | null }) {
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecentReviews(5)
      .then((data) => { if (!cancelled) setReviews(data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Ostatnie recenzje</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {reviews.map((review, i) => {
          const mepName = getMepName(review.mepId);
          const emailDisplay = review.userEmail.split('@')[0];
          const date = new Date(review.updatedAt).toLocaleDateString('pl-PL', {
            year: 'numeric', month: 'short', day: 'numeric',
          });
          return (
            <div key={i} className="px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-gray-700">{emailDisplay}</span>
                  <StarDisplay value={review.stars} />
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  dla:{' '}
                  <Link href={`/mep/${review.mepId}`} className="text-blue-600 hover:underline font-medium">
                    {mepName ?? `Poseł #${review.mepId}`}
                  </Link>
                </p>
                {review.comment && (
                  <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
