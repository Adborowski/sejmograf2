import { describe, it, expect } from "vitest";
import {
  listSittingDays,
  statementSeconds,
  classifyStatement,
  buildMepSpeeches,
  validateSpeeches,
} from "../../scraping/lib/speeches.js";

// Shape matches /proceedings/{n}/{date}/transcripts statements
const st = (num, memberID, opts = {}) => ({
  num,
  memberID,
  name: "X",
  function: "Poseł",
  rapporteur: false,
  secretary: false,
  unspoken: false,
  startDateTime: "2025-01-10T10:00:00",
  endDateTime: "2025-01-10T10:02:00",
  ...opts,
});

describe("listSittingDays", () => {
  it("keeps past days of numbered sittings, oldest first", () => {
    const days = listSittingDays(
      [
        { number: 2, dates: ["2025-02-01", "2025-02-02"] },
        { number: 1, dates: ["2025-01-10"] },
        { number: 0, dates: ["2025-03-01"] }, // planned
        { number: 3, dates: ["2025-02-20", "2025-02-21"] },
      ],
      "2025-02-20",
    );
    expect(days).toEqual([
      { proceeding: 1, date: "2025-01-10" },
      { proceeding: 2, date: "2025-02-01" },
      { proceeding: 2, date: "2025-02-02" },
      { proceeding: 3, date: "2025-02-20" },
    ]);
  });
});

describe("statementSeconds", () => {
  it("returns the duration, or null for missing or corrupt timestamps", () => {
    expect(statementSeconds(st(1, 5))).toBe(120);
    expect(statementSeconds(st(1, 5, { startDateTime: undefined }))).toBeNull();
    expect(statementSeconds(st(1, 5, { endDateTime: "1970-01-01T00:00:00" }))).toBeNull();
    expect(statementSeconds(st(1, 5, { endDateTime: "2025-01-11T10:00:00" }))).toBeNull();
  });
});

describe("classifyStatement", () => {
  it.each([
    [st(1, 5), "speech"],
    [st(1, 5, { unspoken: true, startDateTime: undefined }), "written"],
    [st(1, 5, { function: "Sekretarz Stanu w Ministerstwie Finansów" }), "official"],
    [st(1, 5, { function: "Sekretarz Poseł", secretary: true }), null],
    [st(1, 0, { name: "Marszałek", function: "" }), null],
  ])("%#", (statement, kind) => {
    expect(classifyStatement(statement)).toBe(kind);
  });
});

describe("buildMepSpeeches", () => {
  const result = buildMepSpeeches([
    {
      proceeding: 1,
      date: "2025-01-10",
      statements: [
        st(0, 0, { name: "Marszałek", function: "" }),
        st(1, 5),
        st(2, 5, { rapporteur: true, endDateTime: "2025-01-10T10:10:00" }),
        st(3, 7, { secretary: true, function: "Sekretarz Poseł" }),
        st(4, 5, { unspoken: true, startDateTime: undefined, endDateTime: undefined }),
      ],
    },
    {
      proceeding: 2,
      date: "2025-02-01",
      statements: [st(9, 5, { function: "Minister Finansów" }), st(10, 7, { unspoken: true })],
    },
  ]);

  it("counts speeches, time, written and official statements separately", () => {
    expect(result[5]).toMatchObject({
      speeches: 2,
      seconds: 120 + 600,
      rapporteur: 1,
      written: 1,
      official: 1,
      daysSpoken: 2,
      lastDate: "2025-02-01",
    });
  });

  it("does not count session-secretary duty, and written-only days aren't spoken days", () => {
    expect(result[7]).toMatchObject({ speeches: 0, written: 1, daysSpoken: 0 });
  });

  it("lists recent statements newest first", () => {
    expect(result[5].recent.map((r) => [r.proceeding, r.num, r.kind])).toEqual([
      [2, 9, "official"],
      [1, 4, "written"],
      [1, 2, "speech"],
      [1, 1, "speech"],
    ]);
  });

  it("ignores the presiding officer", () => {
    expect(result[0]).toBeUndefined();
  });
});

describe("validateSpeeches", () => {
  it("fails when any transcript is missing", () => {
    const expected = Array.from({ length: 200 }, (_, i) => ({ proceeding: 1, date: String(i) }));
    expect(validateSpeeches(expected, expected.slice(1), {}).join()).toMatch(/1 sitting day transcript/);
  });
});

describe("statement topics", async () => {
  const { parseStatementTopic, topicsToFetch, attachTopics } = await import("../../scraping/lib/speeches.js");

  // Shape matches /proceedings/{n}/{date}/transcripts/{num}
  const page = (punkt, tytul) => `<html><body><h1>10. kadencja</h1>
<h2 class="punkt">${punkt}</h2>
<p class="punkt-tytul">${tytul}</p>
<h2 class="mowca">Poseł X:</h2><p>...</p></body></html>`;

  it("reads the agenda title, collapsing whitespace and stripping tags", () => {
    const html = page("16. punkt porządku dziennego:", "\r\nSprawozdanie Komisji <b>Infrastruktury</b>\r\n o projekcie (druki nr 3101 i 3151).\r\n");
    expect(parseStatementTopic(html)).toBe("Sprawozdanie Komisji Infrastruktury o projekcie (druki nr 3101 i 3151)");
  });

  it("decodes HTML entities", () => {
    expect(parseStatementTopic(page("1.", "Wyb&oacute;r &bdquo;Marszałka&rdquo; &amp; &#378;r&#xF3;d&#322;o"))).toBe("Wybór „Marszałka” & źródło");
  });

  it("falls back to a descriptive section heading, but not a bare agenda number", () => {
    expect(parseStatementTopic(page("Oświadczenia.", "\r\n"))).toBe("Oświadczenia");
    expect(parseStatementTopic(page("3. punkt porządku dziennego:", "\r\n"))).toBeNull();
    expect(parseStatementTopic("<html><body>no agenda</body></html>")).toBeNull();
  });

  const speeches = {
    1: { recent: [{ proceeding: 2, date: "2025-02-01", num: 9 }, { proceeding: 1, date: "2025-01-10", num: 2 }] },
    2: { recent: [{ proceeding: 2, date: "2025-02-01", num: 9 }, { proceeding: 2, date: "2025-02-01", num: 30 }] },
  };

  it("lists distinct uncached statements, newest first", () => {
    const missing = topicsToFetch(speeches, { "1/2025-01-10/2": "Ustawa A" });
    expect(missing.map((s) => s.num)).toEqual([30, 9]);
  });

  it("treats a cached null (no agenda item) as known", () => {
    expect(topicsToFetch(speeches, { "2/2025-02-01/9": null, "2/2025-02-01/30": "B", "1/2025-01-10/2": "A" })).toEqual([]);
  });

  it("attaches cached topics, null when unknown", () => {
    const copy = JSON.parse(JSON.stringify(speeches));
    attachTopics(copy, { "2/2025-02-01/9": "Ustawa B" });
    expect(copy[1].recent.map((s) => s.topic)).toEqual(["Ustawa B", null]);
  });
});
