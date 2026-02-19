/**
 * MEP Voting Statistics by Sitting
 */
export interface VotingStat {
  sitting: number;
  date: string;
  numVoted: number;
  numMissed: number;
  numVotings: number;
  absenceExcuse: boolean;
}

/**
 * Member of European Parliament (MEP) data structure
 */
export interface Mep {
  // Basic info
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  club: string;
  email?: string;
  active: boolean;

  // Birth info
  birthDate?: string;
  birthLocation?: string;

  // District info
  districtName?: string;
  districtNum?: number;
  voivodeship?: string;

  // Other info
  educationLevel?: string;
  profession?: string;
  numberOfVotes?: number;

  // Voting stats (keyed by sitting number)
  votingStats?: Record<number, VotingStat>;

  // Pre-computed attendance totals
  totalVoted?: number;
  totalMissed?: number;
  totalVotings?: number;
  attendanceRate?: number | null; // 0-1 range, null if no data

  // Metadata
  updatedAt?: any; // Firestore Timestamp
}

/**
 * A single MEP's entry in a leaderboard snapshot
 */
export interface LeaderboardEntry {
  rank: number;
  mepId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  club: string;
  attendanceRate: number; // 0-1 range
  totalVoted: number;
  totalVotings: number;
}

/**
 * A point-in-time leaderboard snapshot, captured when a new sitting is detected
 */
export interface LeaderboardSnapshot {
  sitting: number;        // the max sitting number that triggered this snapshot
  date: string;           // date of that sitting
  createdAt: any;         // Firestore Timestamp
  activeMepCount: number;
  rankings: LeaderboardEntry[];
}

/**
 * Lightweight metadata for a snapshot (no rankings), used for listing/navigation
 */
export interface LeaderboardSnapshotMeta {
  sitting: number;
  date: string;
}

/**
 * Club/Party statistics
 */
export interface ClubStats {
  club: string;
  memberCount: number;
  totalVoted: number;
  totalMissed: number;
  totalVotings: number;
  attendanceRate: string;
}
