// Interpellations + written questions: per-MEP activity and per-ministry
// response stats. Pure — `today` is passed in so results are deterministic.

// Ministers must answer within 21 days (Regulamin Sejmu art. 192 ust. 3 / art. 193 ust. 5)
const ANSWER_DEADLINE_DAYS = 21;
// Ministries with fewer single-recipient items than this are left out of the ranking
const MIN_MINISTRY_ITEMS = 20;

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

const median = (values) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// A "reply" with prolongation: true is only a notice that the deadline was extended.
const firstAnswerDate = (item) => {
  const dates = (item.replies || [])
    .filter((r) => !r.prolongation && r.receiptDate)
    .map((r) => r.receiptDate)
    .sort();
  return dates[0] || null;
};

// Normalise one API item (either endpoint) into what the stats need.
const summarizeItem = (item, type) => {
  const answeredDate = firstAnswerDate(item);
  // Top-level sentDate is unreliable (often weeks after the answer arrived);
  // the per-recipient `sent` date is when the Marshal forwarded it to the minister.
  const sentDate =
    (item.recipientDetails || []).map((r) => r.sent).filter(Boolean).sort()[0] || null;
  return {
    type, // 'interpellation' | 'writtenQuestion'
    num: item.num,
    authors: (item.from || []).map(Number),
    receiptDate: item.receiptDate || null,
    sentDate,
    recipients: (item.recipientDetails || []).map((r) => r.name),
    answeredDate,
    responseDays: answeredDate && sentDate ? daysBetween(sentDate, answeredDate) : null,
    // A few items have an answer dated before forwarding (re-forwarded) — unusable for timing
    badDates: Boolean(answeredDate && sentDate && answeredDate < sentDate),
  };
};

// { [mepId]: { interpellations, writtenQuestions, firstAuthor, lastDate, topRecipients } }
const buildMepActivity = (items) => {
  const activity = {};
  const recipientCounts = {};

  for (const item of items) {
    item.authors.forEach((id, index) => {
      const a = (activity[id] ??= {
        interpellations: 0,
        writtenQuestions: 0,
        firstAuthor: 0,
        lastDate: null,
      });
      if (item.type === "interpellation") a.interpellations++;
      else a.writtenQuestions++;
      if (index === 0) a.firstAuthor++;
      if (item.receiptDate && (!a.lastDate || item.receiptDate > a.lastDate)) {
        a.lastDate = item.receiptDate;
      }
      const counts = (recipientCounts[id] ??= {});
      for (const name of item.recipients) counts[name] = (counts[name] || 0) + 1;
    });
  }

  for (const [id, a] of Object.entries(activity)) {
    a.topRecipients = Object.entries(recipientCounts[id])
      .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "pl"))
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }
  return activity;
};

// Ranking of ministries by how they answer. Only single-recipient items are
// used, because replies aren't linked to a specific recipient.
const buildMinistryStats = (items, today) => {
  const byName = {};
  for (const item of items) {
    if (item.recipients.length !== 1 || !item.sentDate || item.badDates) continue;
    // Too recent to judge: the deadline hasn't passed yet
    if (!item.answeredDate && daysBetween(item.sentDate, today) <= ANSWER_DEADLINE_DAYS) continue;
    (byName[item.recipients[0]] ??= []).push(item);
  }

  return Object.entries(byName)
    .filter(([, list]) => list.length >= MIN_MINISTRY_ITEMS)
    .map(([name, list]) => {
      const answered = list.filter((i) => i.answeredDate);
      const onTime = answered.filter((i) => i.responseDays <= ANSWER_DEADLINE_DAYS);
      return {
        name,
        count: list.length,
        answered: answered.length,
        unanswered: list.length - answered.length,
        onTimeShare: onTime.length / list.length,
        medianResponseDays: median(answered.map((i) => i.responseDays)),
      };
    })
    .sort((a, b) => a.onTimeShare - b.onTimeShare);
};

const validateQuestions = (interpellations, writtenQuestions, activity) => {
  const errors = [];
  // Term 10 had 20k+ interpellations and 4k+ written questions by Oct 2026; counts only grow
  if (interpellations.length < 20000) errors.push(`Only ${interpellations.length} interpellations (expected 20000+)`);
  if (writtenQuestions.length < 4000) errors.push(`Only ${writtenQuestions.length} written questions (expected 4000+)`);
  const authors = Object.keys(activity).length;
  if (authors < 400) errors.push(`Only ${authors} MEPs authored anything (expected 400+)`);
  if (Object.keys(activity).some((id) => !Number.isInteger(Number(id)))) {
    errors.push("Non-numeric author id — `from` format changed?");
  }
  return errors;
};

module.exports = {
  ANSWER_DEADLINE_DAYS,
  daysBetween,
  median,
  summarizeItem,
  buildMepActivity,
  buildMinistryStats,
  validateQuestions,
};
