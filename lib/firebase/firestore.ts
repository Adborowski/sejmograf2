import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ClubAgreementData, LeaderboardSnapshot, LeaderboardSnapshotMeta, MepList, MinistryStat } from '@/types/mep';
import { decodeVotingIndex, VotingIndex } from '@/lib/votings';
import { firestore } from './config';

// Get Firestore instance
const db = firestore;

/**
 * Get a single MEP by ID
 */
export const getMepById = async (mepId: number) => {
  try {
    const docRef = doc(db, 'meps', String(mepId));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch MEP');
  }
};

/**
 * Lightweight list of all MEPs + per-sitting chart totals, from the single
 * stats/mep_list doc written by uploadMepSummary.js. Fetched once per page load
 * and shared by every caller. Full MEP docs (with votingStats) are only read
 * on the MEP detail page.
 */
let mepListPromise: Promise<MepList> | null = null;

export const getMepList = (): Promise<MepList> => {
  mepListPromise ??= getDoc(doc(db, 'stats', 'mep_list'))
    .then((snap) => {
      if (!snap.exists()) throw new Error('Brak danych listy posłów');
      const data = snap.data();
      return { ...JSON.parse(data.json), generatedAt: data.generatedAt } as MepList;
    })
    .catch((error) => {
      mepListPromise = null; // allow a retry on the next call
      throw new Error(error.message || 'Failed to fetch MEP list');
    });
  return mepListPromise;
};

/**
 * Get all MEPs (with optional filters), ordered by last name
 */
export const getAllMeps = async (options?: {
  club?: string;
  active?: boolean;
  limitCount?: number;
}) => {
  const { meps } = await getMepList();
  const filtered = meps.filter(
    (mep) =>
      (options?.club === undefined || mep.club === options.club) &&
      (options?.active === undefined || mep.active === options.active),
  );
  return options?.limitCount ? filtered.slice(0, options.limitCount) : filtered;
};

/**
 * Get unique list of political clubs (of active MEPs)
 */
export const getAllClubs = async () => {
  const meps = await getAllMeps({ active: true });
  return Array.from(new Set(meps.map((mep) => mep.club))).sort();
};

/**
 * Get the most recent leaderboard snapshot (full, including rankings)
 */
export const getLatestLeaderboardSnapshot = async (): Promise<LeaderboardSnapshot | null> => {
  try {
    const q = query(
      collection(db, 'leaderboard_snapshots'),
      where('sitting', '>', 0), // exclude the 'index' meta document
      orderBy('sitting', 'desc'),
      limit(1),
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as LeaderboardSnapshot;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch latest leaderboard snapshot');
  }
};

/**
 * Get a specific leaderboard snapshot by sitting number (full, including rankings)
 */
export const getLeaderboardSnapshotBySitting = async (sitting: number): Promise<LeaderboardSnapshot | null> => {
  try {
    const docRef = doc(db, 'leaderboard_snapshots', String(sitting));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as LeaderboardSnapshot;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch leaderboard snapshot');
  }
};

/**
 * Get lightweight metadata for all snapshots (no rankings) for navigation/listing.
 * Reads from the 'index' document written by saveLeaderboardSnapshot.js.
 */
export const getAllLeaderboardSnapshotMeta = async (): Promise<LeaderboardSnapshotMeta[]> => {
  try {
    const docRef = doc(db, 'leaderboard_snapshots', 'index');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];
    const snapshots: LeaderboardSnapshotMeta[] = docSnap.data().snapshots ?? [];
    return snapshots.slice().sort((a, b) => b.sitting - a.sitting); // newest first
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch leaderboard snapshot list');
  }
};

/**
 * Get the two most recent leaderboard snapshots (full, with rankings).
 * Returns [latest, previous] — either may be null if not enough snapshots exist.
 */
export const getTwoLatestLeaderboardSnapshots = async (): Promise<[LeaderboardSnapshot | null, LeaderboardSnapshot | null]> => {
  try {
    const meta = await getAllLeaderboardSnapshotMeta(); // newest first
    if (meta.length === 0) return [null, null];

    const [latestMeta, previousMeta] = meta;
    const [latest, previous] = await Promise.all([
      getLeaderboardSnapshotBySitting(latestMeta.sitting),
      previousMeta ? getLeaderboardSnapshotBySitting(previousMeta.sitting) : Promise.resolve(null),
    ]);
    return [latest, previous];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch latest two leaderboard snapshots');
  }
};

/**
 * Ministry response ranking, written by scraper-questions.js (worst first)
 */
export const getMinistryStats = async (): Promise<{ computedOn: string; ministries: MinistryStat[] } | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'stats', 'ministries'));
    if (!docSnap.exists()) return null;
    return docSnap.data() as { computedOn: string; ministries: MinistryStat[] };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ministry stats');
  }
};

/**
 * Search index of all votings (gzipped bytes in stats/votings_index), fetched once per session
 */
let votingIndexPromise: Promise<VotingIndex> | null = null;

export const getVotingIndex = (): Promise<VotingIndex> => {
  votingIndexPromise ??= getDoc(doc(db, 'stats', 'votings_index'))
    .then((snap) => {
      if (!snap.exists()) throw new Error('Brak indeksu głosowań');
      return decodeVotingIndex(snap.data().gz.toUint8Array());
    })
    .catch((error) => {
      votingIndexPromise = null;
      throw new Error(error.message || 'Failed to fetch voting index');
    });
  return votingIndexPromise;
};

/**
 * Club × club agreement matrices (whole term and recent months)
 */
export const getClubAgreement = async (): Promise<ClubAgreementData | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'stats', 'club_agreement'));
    return docSnap.exists() ? (docSnap.data() as ClubAgreementData) : null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch club agreement');
  }
};
