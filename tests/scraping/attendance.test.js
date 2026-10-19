import { describe, it, expect } from "vitest";
import { aggregateVotingStats, computeAttendanceTotals } from "../../scraping/lib/attendance.js";

// Shape matches /sejm/term10/MP/{id}/votings/stats
const day = (sitting, date, numVoted, numVotings, absenceExcuse = false) => ({
  sitting,
  date,
  numVoted,
  numMissed: numVotings - numVoted,
  numVotings,
  absenceExcuse,
});

describe("aggregateVotingStats", () => {
  it("sums sitting days into one entry per sitting", () => {
    const result = aggregateVotingStats([
      day(1, "2023-11-13", 8, 8),
      day(1, "2023-11-14", 3, 5),
      day(2, "2023-11-21", 0, 10),
    ]);

    expect(Object.keys(result)).toEqual(["1", "2"]);
    expect(result[1]).toEqual({
      sitting: 1,
      date: "2023-11-14",
      numVoted: 11,
      numMissed: 2,
      numVotings: 13,
      absenceExcuse: false,
    });
    expect(result[2].numMissed).toBe(10);
  });

  it("takes absenceExcuse from the latest day of the sitting", () => {
    const result = aggregateVotingStats([
      day(5, "2024-01-11", 0, 4, true),
      day(5, "2024-01-10", 4, 4, false),
    ]);
    expect(result[5].date).toBe("2024-01-11");
    expect(result[5].absenceExcuse).toBe(true);
  });

  it("passes through non-array input unchanged", () => {
    expect(aggregateVotingStats(null)).toBeNull();
    expect(aggregateVotingStats(undefined)).toBeUndefined();
  });
});

describe("computeAttendanceTotals", () => {
  it("computes totals and a 0–1 rate", () => {
    const aggregated = aggregateVotingStats([
      day(1, "2023-11-13", 6, 8),
      day(2, "2023-11-21", 10, 12),
    ]);
    expect(computeAttendanceTotals(aggregated)).toEqual({
      totalVoted: 16,
      totalMissed: 4,
      totalVotings: 20,
      attendanceRate: 0.8,
    });
  });

  it("returns a null rate when there were no votings", () => {
    expect(computeAttendanceTotals({}).attendanceRate).toBeNull();
    expect(computeAttendanceTotals(null).attendanceRate).toBeNull();
  });
});
