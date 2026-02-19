import { collection, doc, setDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { firestore } from './config';

const db = firestore;

export interface Review {
  userId: string;
  userEmail: string;
  stars: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Subcollection: mep_reviews/{mepId}/reviews/{userId}
const reviewsCol = (mepId: number) =>
  collection(db, 'mep_reviews', String(mepId), 'reviews');

const reviewDoc = (mepId: number, userId: string) =>
  doc(db, 'mep_reviews', String(mepId), 'reviews', userId);

export const getMepReviews = async (mepId: number): Promise<Review[]> => {
  const snap = await getDocs(reviewsCol(mepId));
  return snap.docs
    .map((d) => d.data() as Review)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getUserReview = async (
  mepId: number,
  userId: string
): Promise<Review | null> => {
  const snap = await getDoc(reviewDoc(mepId, userId));
  return snap.exists() ? (snap.data() as Review) : null;
};

export const submitReview = async (
  mepId: number,
  userId: string,
  userEmail: string,
  stars: number,
  comment: string
): Promise<void> => {
  const ref = reviewDoc(mepId, userId);
  const existing = await getDoc(ref);
  const now = new Date().toISOString();
  await setDoc(ref, {
    userId,
    userEmail,
    stars,
    comment: comment.trim(),
    createdAt: existing.exists() ? existing.data().createdAt : now,
    updatedAt: now,
  });
};

export const deleteReview = async (
  mepId: number,
  userId: string
): Promise<void> => {
  await deleteDoc(reviewDoc(mepId, userId));
};
