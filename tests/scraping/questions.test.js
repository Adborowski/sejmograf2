import { describe, it, expect } from "vitest";
import {
  summarizeItem,
  buildMepActivity,
  buildMinistryStats,
  validateQuestions,
  median,
} from "../../scraping/lib/questions.js";

// Shape matches /interpellations and /writtenQuestions items
const apiItem = ({ num = 1, from = ["1"], to = "minister zdrowia", sent = "2025-01-01", receipt = "2024-12-20", replies = [], topSent = "2025-03-01" } = {}) => ({
  num,
  from,
  receiptDate: receipt,
  sentDate: topSent, // deliberately unreliable, like the real API
  recipientDetails: (Array.isArray(to) ? to : [to]).map((name) => ({ name, sent, answerDelayedDays: 0 })),
  replies,
});
const reply = (receiptDate, prolongation = false) => ({ receiptDate, prolongation, onlyAttachment: false, from: "x" });

describe("summarizeItem", () => {
  it("measures response time from the per-recipient sent date, not top-level sentDate", () => {
    const s = summarizeItem(apiItem({ replies: [reply("2025-01-15")] }), "interpellation");
    expect(s.sentDate).toBe("2025-01-01");
    expect(s.responseDays).toBe(14);
  });

  it("ignores deadline-extension notices when finding the answer", () => {
    const s = summarizeItem(
      apiItem({ replies: [reply("2025-01-20", true), reply("2025-02-10")] }),
      "interpellation",
    );
    expect(s.answeredDate).toBe("2025-02-10");
  });

  it("treats an item with only an extension notice as unanswered", () => {
    const s = summarizeItem(apiItem({ replies: [reply("2025-01-20", true)] }), "interpellation");
    expect(s.answeredDate).toBeNull();
    expect(s.responseDays).toBeNull();
  });

  it("flags answers dated before forwarding", () => {
    const s = summarizeItem(apiItem({ replies: [reply("2024-12-28")] }), "interpellation");
    expect(s.badDates).toBe(true);
  });
});

describe("buildMepActivity", () => {
  const items = [
    summarizeItem(apiItem({ num: 1, from: ["1", "2"], receipt: "2025-01-01" }), "interpellation"),
    summarizeItem(apiItem({ num: 2, from: ["1"], to: "minister finansów", receipt: "2025-03-01" }), "interpellation"),
    summarizeItem(apiItem({ num: 3, from: ["2", "1"], receipt: "2025-02-01" }), "writtenQuestion"),
  ];
  const activity = buildMepActivity(items);

  it("counts each type and first-author items separately", () => {
    expect(activity[1]).toMatchObject({ interpellations: 2, writtenQuestions: 1, firstAuthor: 2, lastDate: "2025-03-01" });
    expect(activity[2]).toMatchObject({ interpellations: 1, writtenQuestions: 1, firstAuthor: 1 });
  });

  it("ranks the ministries an MEP writes to most", () => {
    expect(activity[1].topRecipients).toEqual([
      { name: "minister zdrowia", count: 2 },
      { name: "minister finansów", count: 1 },
    ]);
  });
});

describe("buildMinistryStats", () => {
  const today = "2025-06-01";
  const many = (n, opts) =>
    Array.from({ length: n }, (_, i) => summarizeItem(apiItem({ num: i, ...opts }), "interpellation"));

  it("computes on-time share against the 21-day deadline and the median response", () => {
    const items = [
      ...many(15, { replies: [reply("2025-01-10")] }), // 9 days — on time
      ...many(5, { replies: [reply("2025-02-01")] }), // 31 days — late
      ...many(5, {}), // never answered
    ];
    const [stats] = buildMinistryStats(items, today);
    expect(stats).toMatchObject({ name: "minister zdrowia", count: 25, answered: 20, unanswered: 5, medianResponseDays: 9 });
    expect(stats.onTimeShare).toBeCloseTo(15 / 25);
  });

  it("skips unanswered items whose deadline hasn't passed yet", () => {
    const items = [...many(20, { replies: [reply("2025-05-20")], sent: "2025-05-15" }), ...many(10, { sent: "2025-05-25" })];
    expect(buildMinistryStats(items, today)[0].count).toBe(20);
  });

  it("leaves out multi-recipient items, bad dates and ministries with too few items", () => {
    const items = [
      ...many(30, { to: ["minister zdrowia", "minister finansów"], replies: [reply("2025-01-05")] }),
      ...many(30, { replies: [reply("2024-12-01")] }),
      ...many(5, { to: "minister sportu", replies: [reply("2025-01-05")] }),
    ];
    expect(buildMinistryStats(items, today)).toEqual([]);
  });

  it("sorts worst on-time share first", () => {
    const items = [
      ...many(20, { to: "minister A", replies: [reply("2025-01-05")] }),
      ...many(20, { to: "minister B", replies: [reply("2025-03-05")] }),
    ];
    expect(buildMinistryStats(items, today).map((m) => m.name)).toEqual(["minister B", "minister A"]);
  });
});

describe("helpers and validation", () => {
  it("median handles even, odd and empty lists", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("rejects truncated downloads", () => {
    expect(validateQuestions(new Array(500), new Array(4000), {}).join()).toMatch(/Only 500 interpellations/);
  });
});
