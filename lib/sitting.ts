// Stats for a single Sejm sitting, from data already on the client:
// the voting index (stats/votings_index) and per-sitting totals (stats/mep_list).
// Pure helpers — no I/O — so they can be unit tested.

import type { SittingTotals } from '@/types/mep';
import { entryAt, VotingEntry, VotingIndex } from './votings';

/** Votes cast (yes + no + abstain) — present-but-not-voting MPs aren't in the index */
export const castCount = (v: VotingEntry) => v.yes + v.no + v.abstain;

/** Absolute yes−no gap; 0 is a tie */
export const margin = (v: VotingEntry) => Math.abs(v.yes - v.no);

/** All votings of one sitting, in voting-number order */
export const sittingVotings = (index: VotingIndex, sitting: number): VotingEntry[] => {
  const entries: VotingEntry[] = [];
  index.rows.forEach((row, position) => {
    if (row[0] === sitting) entries.push(entryAt(index, position));
  });
  return entries.sort((a, b) => a.num - b.num);
};

/**
 * Votings with a meaningful yes/no/abstain split. Votings "on list" (elections of
 * officials) only record V = "voted" and have no totals, so they're excluded.
 */
export const regularVotings = (entries: VotingEntry[]) => entries.filter((v) => !v.onList && castCount(v) > 0);

/** Closest votings: smallest yes−no gap first (ties on top), larger turnout breaks ties */
export const closestVotings = (entries: VotingEntry[], limit = 5) =>
  regularVotings(entries)
    .sort((a, b) => margin(a) - margin(b) || castCount(b) - castCount(a) || a.num - b.num)
    .slice(0, limit);

/** Share of votes cast that went against the winning side (no + abstain or yes + abstain) */
export const dissentShare = (v: VotingEntry) => {
  const cast = castCount(v);
  return cast === 0 ? 0 : (cast - Math.max(v.yes, v.no)) / cast;
};

/** At most this share of votes against the winning side still counts as near-unanimous */
export const CONSENSUS_MAX_DISSENT = 0.1;

/** Near-unanimous votings: smallest dissent first, larger turnout breaks ties */
export const consensusVotings = (entries: VotingEntry[], limit = 5) =>
  regularVotings(entries)
    .filter((v) => dissentShare(v) <= CONSENSUS_MAX_DISSENT)
    .sort((a, b) => dissentShare(a) - dissentShare(b) || castCount(b) - castCount(a) || a.num - b.num)
    .slice(0, limit);

/** Votings with the most abstentions (only those with at least one) */
export const mostAbstentions = (entries: VotingEntry[], limit = 5) =>
  regularVotings(entries)
    .filter((v) => v.abstain > 0)
    .sort((a, b) => b.abstain - a.abstain || a.num - b.num)
    .slice(0, limit);

export interface RankedVoting {
  voting: VotingEntry;
  /** Other votings on the same agenda item in this sitting (amendments, motions…) */
  others: number;
}

/**
 * Keep only the best-ranked voting per agenda item, so one bill with twenty
 * amendments can't fill a whole list. The agenda item is the voting title
 * ("Pkt. 11 Sprawozdanie Komisji…"); `ranked` must already be in rank order.
 */
export const onePerItem = (ranked: VotingEntry[], sittingEntries: VotingEntry[], limit = 5): RankedVoting[] => {
  const perTitle = new Map<string, number>();
  for (const v of sittingEntries) perTitle.set(v.title, (perTitle.get(v.title) ?? 0) + 1);
  const seen = new Set<string>();
  const result: RankedVoting[] = [];
  for (const voting of ranked) {
    if (result.length >= limit) break;
    if (seen.has(voting.title)) continue;
    seen.add(voting.title);
    result.push({ voting, others: (perTitle.get(voting.title) ?? 1) - 1 });
  }
  return result;
};

export interface SittingHighlights {
  closest: RankedVoting[];
  consensus: RankedVoting[];
  abstentions: RankedVoting[];
}

/** The page's three voting lists, one voting per agenda item each */
export const sittingHighlights = (entries: VotingEntry[], limit = 5): SittingHighlights => ({
  closest: onePerItem(closestVotings(entries, Infinity), entries, limit),
  consensus: onePerItem(consensusVotings(entries, Infinity), entries, limit),
  abstentions: onePerItem(mostAbstentions(entries, Infinity), entries, limit),
});

/** Sittings in the list before and after `sitting` (for prev/next links) */
export const adjacentSittings = (sittings: SittingTotals[], sitting: number) => {
  const numbers = sittings.map((s) => s.sitting).sort((a, b) => a - b);
  const i = numbers.indexOf(sitting);
  return {
    previous: i > 0 ? numbers[i - 1] : null,
    next: i >= 0 && i < numbers.length - 1 ? numbers[i + 1] : null,
  };
};

export interface SittingSummary {
  sitting: number;
  votings: number;
  onList: number;
  firstDate: string | null;
  lastDate: string | null;
  days: string[]; // distinct voting days, ascending
  averageCast: number | null; // mean votes cast per regular voting
  ties: number;
}

export const summarizeSitting = (sitting: number, entries: VotingEntry[]): SittingSummary => {
  const days = [...new Set(entries.map((v) => v.date))].sort();
  const regular = regularVotings(entries);
  return {
    sitting,
    votings: entries.length,
    onList: entries.filter((v) => v.onList).length,
    firstDate: days[0] ?? null,
    lastDate: days[days.length - 1] ?? null,
    days,
    averageCast: regular.length ? regular.reduce((s, v) => s + castCount(v), 0) / regular.length : null,
    ties: regular.filter((v) => margin(v) === 0).length,
  };
};

/** Latest sitting that has votings in the index (the index and mep_list are built in the same run) */
export const latestSittingNumber = (index: VotingIndex): number | null =>
  index.rows.reduce<number | null>((max, row) => (max === null || row[0] > max ? row[0] : max), null);

const rate = ([voted, votings]: [number, number]) => (votings > 0 ? voted / votings : null);

export interface ClubSittingAttendance {
  club: string;
  rate: number | null; // 0–1, this sitting
  termRate: number | null; // 0–1, all sittings
  delta: number | null; // rate − termRate
}

/**
 * Attendance per club in one sitting vs the club's whole-term rate, best first.
 * Totals in mep_list are per *current* club, so a club switcher counts toward their new club.
 */
export const clubAttendance = (sittings: SittingTotals[], sitting: number): ClubSittingAttendance[] => {
  const current = sittings.find((s) => s.sitting === sitting);
  if (!current) return [];
  const term: Record<string, [number, number]> = {};
  for (const s of sittings) {
    for (const [club, [voted, votings]] of Object.entries(s.clubs)) {
      const t = (term[club] ??= [0, 0]);
      t[0] += voted;
      t[1] += votings;
    }
  }
  return Object.entries(current.clubs)
    .map(([club, totals]) => {
      const r = rate(totals);
      const termRate = term[club] ? rate(term[club]) : null;
      return { club, rate: r, termRate, delta: r !== null && termRate !== null ? r - termRate : null };
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1) || a.club.localeCompare(b.club));
};

/** Overall attendance in one sitting and over the term (0–1) */
export const overallAttendance = (sittings: SittingTotals[], sitting: number) => {
  const current = sittings.find((s) => s.sitting === sitting);
  const term = sittings.reduce<[number, number]>((t, s) => [t[0] + s.voted, t[1] + s.votings], [0, 0]);
  return {
    rate: current ? rate([current.voted, current.votings]) : null,
    termRate: rate(term),
  };
};
