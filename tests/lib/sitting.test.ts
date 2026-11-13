import { describe, it, expect } from 'vitest';
import type { SittingTotals } from '@/types/mep';
import { VotingIndex } from '@/lib/votings';
import {
  castCount,
  margin,
  dissentShare,
  sittingVotings,
  regularVotings,
  closestVotings,
  consensusVotings,
  onePerItem,
  sittingHighlights,
  adjacentSittings,
  mostAbstentions,
  summarizeSitting,
  latestSittingNumber,
  clubAttendance,
  overallAttendance,
} from '@/lib/sitting';

// Row: [sitting, num, date, titleIndex, topic, yes, no, abstain, onList]
const index: VotingIndex = {
  indexId: 'test',
  titles: ['Pkt. 1 Ustawa A', 'Pkt. 2 Ustawa B', 'Wybór sędziów'],
  rows: [
    [40, 1, '2025-09-10', 0, 'całość', 230, 200, 10, 0],
    [41, 3, '2025-10-02', 1, 'poprawka 2', 220, 220, 5, 0], // tie
    [41, 1, '2025-10-01', 0, 'wniosek o odrzucenie', 440, 2, 0, 0], // near-unanimous
    [41, 2, '2025-10-01', 2, '', 0, 0, 0, 1], // on list
    [41, 4, '2025-10-02', 1, 'całość', 231, 229, 30, 0], // gap 2, most abstentions
    [41, 5, '2025-10-02', 1, 'poprawka 5', 150, 148, 0, 0], // gap 2, low turnout
  ],
};

const sitting41 = sittingVotings(index, 41);

describe('basic measures', () => {
  it('counts cast votes, margin and dissent', () => {
    const [first] = sitting41;
    expect(castCount(first)).toBe(442);
    expect(margin(first)).toBe(438);
    expect(dissentShare(first)).toBeCloseTo(2 / 442);
  });
});

describe('sittingVotings', () => {
  it('keeps only that sitting, ordered by voting number, with index positions', () => {
    expect(sitting41.map((v) => v.num)).toEqual([1, 2, 3, 4, 5]);
    expect(sitting41[0].position).toBe(2);
    expect(sittingVotings(index, 99)).toEqual([]);
  });

  it('regularVotings drops on-list votings', () => {
    expect(regularVotings(sitting41).map((v) => v.num)).toEqual([1, 3, 4, 5]);
  });
});

describe('rankings', () => {
  it('closestVotings puts ties first, then equal gaps by larger turnout', () => {
    expect(closestVotings(sitting41).map((v) => v.num)).toEqual([3, 4, 5, 1]);
    expect(closestVotings(sitting41, 2).map((v) => v.num)).toEqual([3, 4]);
  });

  it('consensusVotings keeps only votings with at most 10% dissent', () => {
    expect(consensusVotings(sitting41).map((v) => v.num)).toEqual([1]);
  });

  it('mostAbstentions skips votings without any', () => {
    expect(mostAbstentions(sitting41).map((v) => v.num)).toEqual([4, 3]);
  });
});

describe('one voting per agenda item', () => {
  // Votings 3, 4 and 5 share the title "Pkt. 2 Ustawa B"
  it('onePerItem keeps the best-ranked voting per title and counts the others', () => {
    const result = onePerItem(closestVotings(sitting41, Infinity), sitting41);
    expect(result.map((r) => [r.voting.num, r.others])).toEqual([[3, 2], [1, 0]]);
  });

  it('onePerItem respects the limit', () => {
    expect(onePerItem(closestVotings(sitting41, Infinity), sitting41, 1)).toHaveLength(1);
  });

  it('sittingHighlights builds all three lists', () => {
    const h = sittingHighlights(sitting41);
    expect(h.closest.map((r) => r.voting.num)).toEqual([3, 1]);
    expect(h.consensus.map((r) => r.voting.num)).toEqual([1]); // close votes are never "near-unanimous"
    expect(h.abstentions.map((r) => r.voting.num)).toEqual([4]);
  });
});

describe('summarizeSitting', () => {
  it('summarises days, counts and ties', () => {
    const s = summarizeSitting(41, sitting41);
    expect(s).toMatchObject({
      sitting: 41,
      votings: 5,
      onList: 1,
      firstDate: '2025-10-01',
      lastDate: '2025-10-02',
      days: ['2025-10-01', '2025-10-02'],
      ties: 1,
    });
    expect(s.averageCast).toBeCloseTo((442 + 445 + 490 + 298) / 4);
  });

  it('handles a sitting with no votings', () => {
    expect(summarizeSitting(99, [])).toMatchObject({ votings: 0, firstDate: null, averageCast: null, ties: 0 });
  });

  it('latestSittingNumber finds the highest sitting regardless of row order', () => {
    expect(latestSittingNumber(index)).toBe(41);
    expect(latestSittingNumber({ indexId: '', titles: [], rows: [] })).toBeNull();
  });
});

describe('attendance', () => {
  const sittings: SittingTotals[] = [
    { sitting: 40, date: '2025-09-10', voted: 80, votings: 100, clubs: { KO: [45, 50], PiS: [35, 50] } },
    { sitting: 41, date: '2025-10-01', voted: 90, votings: 100, clubs: { KO: [40, 50], PiS: [50, 50] } },
  ];

  it('clubAttendance compares the sitting with the term rate, best first', () => {
    const result = clubAttendance(sittings, 41);
    expect(result.map((c) => c.club)).toEqual(['PiS', 'KO']);
    expect(result[0].rate).toBe(1);
    expect(result[0].termRate).toBeCloseTo(0.85);
    expect(result[0].delta).toBeCloseTo(0.15);
    expect(result[1].delta).toBeCloseTo(0.8 - 0.85);
  });

  it('clubAttendance is empty for an unknown sitting', () => {
    expect(clubAttendance(sittings, 99)).toEqual([]);
  });

  it('adjacentSittings finds neighbours, null at the ends', () => {
    expect(adjacentSittings(sittings, 41)).toEqual({ previous: 40, next: null });
    expect(adjacentSittings(sittings, 40)).toEqual({ previous: null, next: 41 });
    expect(adjacentSittings(sittings, 99)).toEqual({ previous: null, next: null });
  });

  it('overallAttendance returns the sitting and term rates', () => {
    expect(overallAttendance(sittings, 41)).toEqual({ rate: 0.9, termRate: 0.85 });
    expect(overallAttendance(sittings, 99).rate).toBeNull();
  });
});
