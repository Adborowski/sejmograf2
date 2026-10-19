import { describe, it, expect } from "vitest";
import { buildMepRoles, classifyCommitteeFunction, validateRoles } from "../../scraping/lib/roles.js";

// Shapes match /committees and /clubs/{id}
const member = (id, fn) => ({ id, firstName: "A", lastName: "B", club: "KO", joinDate: "2023-11-21", ...(fn && { function: fn }) });
const committee = (code, type, name, members) => ({ code, type, name, members });

describe("classifyCommitteeFunction", () => {
  it.each([
    ["przewodniczący", "chair"],
    ["przewodnicząca", "chair"],
    ["zastępca przewodniczącego", "deputy"],
    ["zastępczyni przewodniczącej", "deputy"],
    ["zastępca przewodniczącej", "deputy"],
    [undefined, "member"],
  ])("%s → %s", (fn, role) => {
    expect(classifyCommitteeFunction(fn)).toBe(role);
  });
});

describe("buildMepRoles", () => {
  const committees = [
    committee("ASW", "STANDING", "Komisja Administracji i Spraw Wewnętrznych", [member(1), member(2, "przewodniczący")]),
    committee("SKPG", "INVESTIGATIVE", "Komisja Śledcza do zbadania … Pegasus …", [member(1)]),
    committee("INF", "STANDING", "Komisja Infrastruktury", [member(1, "zastępca przewodniczącego")]),
  ];
  const clubs = [{ id: "KO", members: [member(2, "przewodniczący"), member(3)] }];

  const roles = buildMepRoles(committees, clubs);

  it("groups committees per MEP, ordered chair → deputy → member, investigative first", () => {
    expect(roles[1].committees.map((c) => c.code)).toEqual(["INF", "SKPG", "ASW"]);
    expect(roles[1].committees[0]).toMatchObject({ role: "deputy", function: "zastępca przewodniczącego" });
  });

  it("uses short names for long committee names", () => {
    expect(roles[1].committees.find((c) => c.code === "SKPG").name).toBe("Komisja śledcza ds. Pegasusa");
  });

  it("records club leadership functions, and nothing for plain club members", () => {
    expect(roles[2].clubFunction).toBe("przewodniczący");
    expect(roles[3]).toBeUndefined();
    expect(roles[1].clubFunction).toBeNull();
  });
});

describe("validateRoles", () => {
  it("fails when the committee list is missing or truncated", () => {
    expect(validateRoles([], {})).toHaveLength(1);
  });

  it("fails when chairs can no longer be recognised", () => {
    const committees = Array.from({ length: 40 }, (_, i) =>
      committee(`C${i}`, "STANDING", "X", [member(i, "head")]),
    );
    expect(validateRoles(committees, {}).join()).toMatch(/have a chair/);
  });
});
