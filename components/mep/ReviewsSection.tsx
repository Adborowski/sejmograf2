'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useReviews } from '@/hooks/useReviews';
import { submitReview, deleteReview, Review } from '@/lib/firebase/reviews';

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="text-5xl leading-none focus:outline-none transition-colors"
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        >
          <span className={(hovered || value) >= n ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-sm tracking-tight">
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span key={n} className={value >= n ? 'text-amber-400' : 'text-gray-300'}>★</span>
      ))}
    </span>
  );
}

function ReviewCard({
  review,
  isOwn,
  onEdit,
  onDelete,
}: {
  review: Review;
  isOwn: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const emailDisplay = review.userEmail.split('@')[0];
  const date = new Date(review.updatedAt).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`p-4 rounded-lg border ${isOwn ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{emailDisplay}</span>
            {isOwn && (
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Ty</span>
            )}
            <StarDisplay value={review.stars} />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
        </div>
        {isOwn && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="text-xs text-blue-600 hover:underline"
            >
              Edytuj
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:underline"
            >
              Usuń
            </button>
          </div>
        )}
      </div>
      {review.comment && (
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p>
      )}
    </div>
  );
}

function ReviewForm({
  mepId,
  userId,
  userEmail,
  initial,
  onSaved,
  onCancel,
}: {
  mepId: number;
  userId: string;
  userEmail: string;
  initial?: Review;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [stars, setStars] = useState(initial?.stars ?? 0);
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars === 0) { setError('Wybierz ocenę.'); return; }
    setSaving(true);
    setError(null);
    try {
      await submitReview(mepId, userId, userEmail, stars, comment);
      onSaved();
    } catch {
      setError('Nie udało się zapisać recenzji. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Ocena</label>
        <StarPicker value={stars} onChange={setStars} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Komentarz (opcjonalnie)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Podziel się opinią..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-full transition-colors"
        >
          {saving ? 'Zapisywanie…' : initial ? 'Zaktualizuj recenzję' : 'Dodaj recenzję'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 rounded-full transition-colors"
          >
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}

export function ReviewsSection({ mepId }: { mepId: number }) {
  const { user, loading: authLoading } = useAuth();
  const { reviews, loading: reviewsLoading, reload } = useReviews(mepId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (authLoading || reviewsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recenzje</h3>
        <div className="h-8 flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const ownReview = user ? reviews.find((r) => r.userId === user.uid) ?? null : null;
  const otherReviews = user ? reviews.filter((r) => r.userId !== user.uid) : reviews;

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteReview(mepId, user.uid);
      await reload();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recenzje{reviews.length > 0 && <span className="text-sm font-normal text-gray-400 ml-2">{reviews.length}</span>}
      </h3>

      {/* Auth gate */}
      {!user && (
        <div className="mb-5 p-4 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Zaloguj się</Link>
          {' '}aby dodać recenzję.
        </div>
      )}

      {/* Own review area */}
      {user && (
        <div className="mb-5">
          {ownReview && !editing ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Twoja recenzja</p>
              <ReviewCard
                review={ownReview}
                isOwn
                onEdit={() => setEditing(true)}
                onDelete={handleDelete}
              />
              {deleting && <p className="text-xs text-gray-400">Usuwanie…</p>}
            </div>
          ) : editing && ownReview ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Edytuj recenzję</p>
              <ReviewForm
                mepId={mepId}
                userId={user.uid}
                userEmail={user.email ?? ''}
                initial={ownReview}
                onSaved={async () => { setEditing(false); await reload(); }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : !ownReview ? (
            <div className="space-y-2">
              <ReviewForm
                mepId={mepId}
                userId={user.uid}
                userEmail={user.email ?? ''}
                onSaved={async () => { await reload(); }}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Other reviews */}
      {otherReviews.length > 0 ? (
        <div className="space-y-3">
          {otherReviews.length > 0 && user && ownReview && (
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inne recenzje</p>
          )}
          {otherReviews.map((review) => (
            <ReviewCard
              key={review.userId}
              review={review}
              isOwn={false}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      ) : (
        reviews.length === 0 && (
          <div className="p-4 rounded-lg border border-gray-100 bg-white text-sm text-gray-400 italic">
            Brak recenzji. Bądź pierwszym!
          </div>
        )
      )}
    </div>
  );
}
