import { describe, it, expect } from "vitest";
import { buildMepSummary, compareLikeFirestore, validateSummary } from "../../scraping/lib/summary.js";

// Shape matches mep-voting-aggregated.json entries
const mep = (id, lastName, club, votingStats, extra = {}) => ({
  id,
  firstName: "Jan",
  lastName,
  firstLastName: `Jan ${lastName}`,
  club,
  active: true,
  votingStats,
  totalVoted: 0,
  totalVotings: 0,
  attendanceRate: null,
  birthDate: "1970-01-01",
  ...extra,
});
const stat = (sitting, date, numVoted, numVotings) => ({ sitting, date, numVoted, numVotings, numMissed: numVotings - numVoted, absenceExcuse: false });

describe("compareLikeFirestore", () => {
  it("orders by code units (uppercase before lowercase, Ł after Z) then by id as a string", () => {
    const sorted = [
      { id: 2, lastName: "Łukasz" },
      { id: 10, lastName: "Nowak" },
      { id: 9, lastName: "Nowak" },
      { id: 1, lastName: "de Witt" },
      { id: 3, lastName: "Zieliński" },
    ].sort(compareLikeFirestore);
    expect(sorted.map((m) => m.id)).toEqual([10, 9, 3, 1, 2]);
  });
});

describe("buildMepSummary", () => {
  const summary = buildMepSummary([
    mep(2, "Nowak", "PiS", { 1: stat(1, "2023-11-14", 10, 10), 2: stat(2, "2023-11-22", 5, 10) }),
    mep(1, "Kowalski", "KO", { 1: stat(1, "2023-11-14", 8, 10) }, { email: "a@sejm.pl" }),
    mep(3, "Adamska", undefined, null, { active: false }),
  ]);

  it("keeps only list fields, maps fullName, sorts like Firestore", () => {
    expect(summary.meps.map((m) => m.id)).toEqual([3, 1, 2]);
    expect(summary.meps[1]).toMatchObject({ fullName: "Jan Kowalski", email: "a@sejm.pl", club: "KO" });
    expect(summary.meps[1]).not.toHaveProperty("votingStats");
    expect(summary.meps[1]).not.toHaveProperty("birthDate");
    expect(summary.meps[0]).not.toHaveProperty("club"); // undefined fields are omitted
  });

  it("totals each sitting overall and per club", () => {
    expect(summary.sittings).toEqual([
      { sitting: 1, date: "2023-11-14", voted: 18, votings: 20, clubs: { KO: [8, 10], PiS: [10, 10] } },
      { sitting: 2, date: "2023-11-22", voted: 5, votings: 10, clubs: { PiS: [5, 10] } },
    ]);
  });

  it("validates count and size", () => {
    expect(validateSummary(summary, 3)).toEqual([]);
    expect(validateSummary(summary, 4).join()).toMatch(/input had 4/);
  });
});
