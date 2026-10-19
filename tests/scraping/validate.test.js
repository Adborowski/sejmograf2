import { describe, it, expect } from "vitest";
import { validateMeps, SEJM_SEATS } from "../../scraping/lib/validate.js";

const mep = (id, overrides = {}) => ({
  id,
  firstName: "Jan",
  lastName: `Kowalski${id}`,
  club: "KO",
  active: true,
  totalVoted: 90,
  totalVotings: 100,
  attendanceRate: 0.9,
  ...overrides,
});

const fullSejm = () => Array.from({ length: SEJM_SEATS }, (_, i) => mep(i + 1));

describe("validateMeps", () => {
  it("accepts a full, well-formed dataset", () => {
    expect(validateMeps(fullSejm())).toEqual([]);
  });

  it("rejects an empty or truncated API response", () => {
    expect(validateMeps([]).length).toBeGreaterThan(0);
    expect(validateMeps(fullSejm().slice(0, 100)).join()).toMatch(/Only 100 MEPs/);
    expect(validateMeps(null)).toEqual(["MEP data is not an array"]);
  });

  it("flags out-of-range attendance and duplicate ids", () => {
    const data = fullSejm();
    data[0].attendanceRate = 1.4;
    data[1].id = data[2].id;
    const errors = validateMeps(data).join("\n");
    expect(errors).toMatch(/attendanceRate 1.4 out of range/);
    expect(errors).toMatch(/duplicate id/);
  });

  it("rejects data where the voting stats fetch mostly failed", () => {
    const data = fullSejm().map((m) => ({ ...m, totalVoted: 0, totalVotings: 0, attendanceRate: null }));
    expect(validateMeps(data).join()).toMatch(/have voting stats/);
  });

  it("allows inactive MPs without a club", () => {
    const data = [...fullSejm(), mep(999, { active: false, club: undefined })];
    expect(validateMeps(data)).toEqual([]);
  });
});
