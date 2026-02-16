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
