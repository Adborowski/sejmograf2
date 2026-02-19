import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
} from 'firebase/firestore';
import { LeaderboardSnapshot, LeaderboardSnapshotMeta } from '@/types/mep';
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
 * Get all MEPs (with optional filters)
 */
export const getAllMeps = async (options?: {
  club?: string;
  active?: boolean;
  limitCount?: number;
}) => {
  try {
    const constraints: QueryConstraint[] = [];

    // Add filters
    if (options?.club) {
      constraints.push(where('club', '==', options.club));
    }
    if (options?.active !== undefined) {
      constraints.push(where('active', '==', options.active));
    }

    // Add ordering
    constraints.push(orderBy('lastName'));

    // Add limit
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collection(db, 'meps'), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch MEPs');
  }
};

/**
 * Get MEPs by political party/club
 */
export const getMepsByClub = async (club: string) => {
  return getAllMeps({ club, active: true });
};

/**
 * Search MEPs by name
 */
export const searchMepsByName = async (searchTerm: string) => {
  try {
    // Note: Firestore doesn't support full-text search
    // This gets all MEPs and filters client-side
    // For production, consider using Algolia or similar
    const allMeps = await getAllMeps({ active: true });

    const searchLower = searchTerm.toLowerCase();
    return allMeps.filter((mep: any) =>
      mep.firstName.toLowerCase().includes(searchLower) ||
      mep.lastName.toLowerCase().includes(searchLower) ||
      mep.fullName.toLowerCase().includes(searchLower)
    );
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search MEPs');
  }
};

/**
 * Get unique list of political clubs
 */
export const getAllClubs = async () => {
  try {
    const allMeps = await getAllMeps({ active: true });
    const clubs = new Set(allMeps.map((mep: any) => mep.club));
    return Array.from(clubs).sort();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch clubs');
  }
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
 * Calculate aggregate stats for a club
 */
export const getClubStats = async (club: string) => {
  try {
    const clubMeps = await getMepsByClub(club);

    // Aggregate voting stats
    let totalVoted = 0;
    let totalMissed = 0;
    let totalVotings = 0;

    clubMeps.forEach((mep: any) => {
      if (mep.votingStats && Array.isArray(mep.votingStats)) {
        mep.votingStats.forEach((stat: any) => {
          totalVoted += stat.numVoted || 0;
          totalMissed += stat.numMissed || 0;
          totalVotings += stat.numVotings || 0;
        });
      }
    });

    const attendanceRate = totalVotings > 0
      ? ((totalVoted / totalVotings) * 100).toFixed(1)
      : '0';

    return {
      club,
      memberCount: clubMeps.length,
      totalVoted,
      totalMissed,
      totalVotings,
      attendanceRate: `${attendanceRate}%`,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to calculate club stats');
  }
};
