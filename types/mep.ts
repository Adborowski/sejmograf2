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
