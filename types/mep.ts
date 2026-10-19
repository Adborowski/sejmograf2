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
 * A committee seat held by an MEP (written by scraper-roles.js)
 */
export interface CommitteeMembership {
  code: string;
  name: string;
  type: 'STANDING' | 'EXTRAORDINARY' | 'INVESTIGATIVE';
  role: 'chair' | 'deputy' | 'member';
  function: string | null; // gendered Polish title, e.g. "przewodnicząca"
  joinDate: string | null;
}

/**
 * Interpellation + written question counts (written by scraper-questions.js)
 */
export interface MepActivity {
  interpellations: number;
  writtenQuestions: number;
  firstAuthor: number; // items where the MEP is the first signatory
  lastDate: string | null;
  topRecipients: Array<{ name: string; count: number }>;
}

/**
 * How one ministry answers MEPs' questions (stats/ministries)
 */
export interface MinistryStat {
  name: string;
  count: number;
  answered: number;
  unanswered: number;
  onTimeShare: number; // 0–1, answered within the 21-day deadline
  medianResponseDays: number | null;
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

  // Roles
  committees?: CommitteeMembership[];
  clubFunction?: string | null;

  // Parliamentary questions
  activity?: MepActivity;

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
