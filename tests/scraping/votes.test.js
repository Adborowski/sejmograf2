import { describe, it, expect } from "vitest";
import { compactVoting, clubLine, buildLoyalty, sittingsToFetch } from "../../scraping/lib/votes.js";

const ids = (n, start) => Array.from({ length: n }, (_, i) => start + i);

// Build a compact voting directly: { club: { YES: [...ids], ... } }
const voting = (num, byClub, opts = {}) => ({
  sitting: 1,
  num,
  date: `2025-01-01T10:${String(num).padStart(2, "0")}:00`,
  kind: "ELECTRONIC",
  title: `Głosowanie ${num}`,
  topic: null,
  byClub,
  ...opts,
});

describe("compactVoting", () => {
  it("groups ids by club and vote from the API detail shape", () => {
    const c = compactVoting({
      sitting: 60,
      votingNumber: 10,
      date: "2026-06-18T12:52:41",
      kind: "ELECTRONIC",
      title: "T",
      topic: "X",
      votes: [
        { MP: 1, club: "KO", vote: "YES" },
        { MP: 2, club: "KO", vote: "ABSENT" },
        { MP: 3, club: "PiS", vote: "NO" },
        { MP: 4, club: "KO", vote: "YES" },
      ],
    });
    expect(c).toMatchObject({ sitting: 60, num: 10, byClub: { KO: { YES: [1, 4], ABSENT: [2] }, PiS: { NO: [3] } } });
  });
});

describe("clubLine", () => {
  it("is the option chosen by a majority of members who cast a vote", () => {
    expect(clubLine({ YES: ids(8, 1), NO: ids(2, 20), ABSENT: ids(30, 40) })).toBe("YES");
    expect(clubLine({ ABSTAIN: ids(5, 1), YES: ids(1, 10) })).toBe("ABSTAIN");
  });

  it("is null for a split club or too few votes", () => {
    expect(clubLine({ YES: ids(5, 1), NO: ids(5, 10) })).toBeNull();
    expect(clubLine({ YES: ids(4, 1), NO: ids(3, 10), ABSTAIN: ids(3, 20) })).toBeNull(); // 40% isn't a majority
    expect(clubLine({ YES: [1, 2] })).toBeNull();
  });
});

describe("buildLoyalty", () => {
  const votings = [
    // KO line YES; MEP 9 votes NO (opposed), MEP 8 abstains (rebellion, not opposed)
    voting(1, { KO: { YES: ids(7, 1), NO: [9], ABSTAIN: [8] }, "niez.": { NO: [100] } }),
    // KO line NO; everyone follows; MEP 9 absent
    voting(2, { KO: { NO: ids(8, 1), ABSENT: [9] } }),
    // KO split — no line, nobody can rebel
    voting(3, { KO: { YES: ids(4, 1), NO: [5, 6, 7, 8], ABSTAIN: [9] } }),
    // Election by list — ignored
    voting(4, { KO: { VOTE_VALID: ids(9, 1) } }, { kind: "ON_LIST" }),
  ];
  const loyalty = buildLoyalty(votings);

  it("counts rebellions only where the club had a line", () => {
    expect(loyalty[9]).toMatchObject({ cast: 2, withLine: 1, rebellions: 1, opposed: 1, loyalty: 0 });
    expect(loyalty[8]).toMatchObject({ cast: 3, abstained: 1, withLine: 2, rebellions: 1, opposed: 0, loyalty: 0.5 });
    expect(loyalty[1]).toMatchObject({ cast: 3, withLine: 2, rebellions: 0, loyalty: 1 });
  });

  it("computes abstention rate over all votes cast", () => {
    expect(loyalty[8].abstainRate).toBeCloseTo(1 / 3);
  });

  it("gives independents no loyalty score", () => {
    expect(loyalty[100]).toMatchObject({ cast: 1, withLine: 0, loyalty: null });
  });

  it("records rebellions newest first with the club line", () => {
    const later = buildLoyalty([
      ...votings,
      voting(5, { KO: { YES: ids(8, 1), NO: [9] } }),
    ]);
    expect(later[9].recentRebellions.map((r) => [r.num, r.vote, r.clubLine])).toEqual([
      [5, "NO", "YES"],
      [1, "NO", "YES"],
    ]);
  });

  it("adds the latest club's average and the Sejm average for context", () => {
    // KO members 1–7 are fully loyal (1), 8 is 0.5, 9 is 0
    expect(loyalty[1].club).toBe("KO");
    expect(loyalty[1].clubAverage).toBeCloseTo((7 + 0.5 + 0) / 9);
    expect(loyalty[100].clubAverage).toBeNull(); // independents have no score
    expect(loyalty[1].sejmAverage).toBeCloseTo(loyalty[1].clubAverage);
  });

  it("measures against the club at the time of each vote", () => {
    const switched = buildLoyalty([
      voting(1, { PiS: { YES: [...ids(5, 1), 50] } }),
      voting(2, { RozwojPlus: { NO: [...ids(5, 60), 50] }, PiS: { YES: ids(5, 1) } }),
    ]);
    expect(switched[50]).toMatchObject({ withLine: 2, rebellions: 0, loyalty: 1, club: "RozwojPlus" });
  });

  it("keeps a score from club days for MEPs who left, but no club average", () => {
    const left = buildLoyalty([
      voting(1, { KO: { YES: [...ids(5, 1), 50] } }),
      voting(2, { "niez.": { NO: [50] }, KO: { YES: ids(5, 1) } }),
    ]);
    expect(left[50]).toMatchObject({ club: "niez.", loyalty: 1, clubAverage: null });
  });
});

describe("sittingsToFetch", () => {
  it("returns sittings whose cached vote count differs from the index", () => {
    const index = [
      { proceeding: 1, votingsNum: 2 },
      { proceeding: 1, votingsNum: 1 },
      { proceeding: 2, votingsNum: 2 },
      { proceeding: 3, votingsNum: 1 },
    ];
    const cache = {
      "1/1": { sitting: 1 }, "1/2": { sitting: 1 }, "1/4": { sitting: 1 },
      "2/1": { sitting: 2 },
    };
    expect(sittingsToFetch(index, cache)).toEqual([2, 3]);
  });
});
