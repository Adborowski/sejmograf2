// Plenary speeches per MEP, from /proceedings/{n}/{date}/transcripts. Pure — no I/O.

// A handful of statements have corrupt timestamps (negative or decades-long)
const MAX_STATEMENT_SECONDS = 2 * 60 * 60;
const RECENT_COUNT = 5;

// Sitting days that have happened, from GET /proceedings.
// number 0 marks a planned sitting with no transcripts yet.
const listSittingDays = (proceedings, today) =>
  proceedings
    .filter((p) => p.number > 0)
    .flatMap((p) => (p.dates || []).filter((d) => d <= today).map((date) => ({ proceeding: p.number, date })))
    .sort((a, b) => a.date.localeCompare(b.date) || a.proceeding - b.proceeding);

const statementSeconds = (s) => {
  if (!s.startDateTime || !s.endDateTime) return null;
  const seconds = (Date.parse(s.endDateTime) - Date.parse(s.startDateTime)) / 1000;
  return seconds > 0 && seconds <= MAX_STATEMENT_SECONDS ? seconds : null;
};

// How a statement counts for its speaker:
//   speech   — spoken as an MP ("Poseł")
//   written  — submitted in writing, not delivered (unspoken)
//   official — spoken in a government/other role by someone who is also an MP
//   null     — not counted: presiding officer (memberID 0) or acting as session secretary
const classifyStatement = (s) => {
  if (!s.memberID || s.secretary) return null;
  if (s.unspoken) return "written";
  return s.function === "Poseł" ? "speech" : "official";
};

// days: [{ proceeding, date, statements }]
// Returns { [mepId]: { speeches, seconds, written, official, rapporteur, daysSpoken, lastDate, recent } }
const buildMepSpeeches = (days) => {
  const result = {};
  const spokenDays = {};

  for (const { proceeding, date, statements } of days) {
    for (const s of statements || []) {
      const kind = classifyStatement(s);
      if (!kind) continue;

      const r = (result[s.memberID] ??= {
        speeches: 0,
        seconds: 0,
        written: 0,
        official: 0,
        rapporteur: 0,
        daysSpoken: 0,
        lastDate: null,
        recent: [],
      });

      if (kind === "speech") {
        r.speeches++;
        r.seconds += statementSeconds(s) ?? 0;
        if (s.rapporteur) r.rapporteur++;
      } else if (kind === "written") {
        r.written++;
      } else {
        r.official++;
      }
      if (kind !== "written") (spokenDays[s.memberID] ??= new Set()).add(date);
      if (!r.lastDate || date > r.lastDate) r.lastDate = date;
      r.recent.push({ proceeding, date, num: s.num, kind });
    }
  }

  for (const [id, r] of Object.entries(result)) {
    r.daysSpoken = spokenDays[id]?.size ?? 0;
    r.seconds = Math.round(r.seconds);
    // Newest first: by date, then by order within the day
    r.recent = r.recent
      .sort((a, b) => b.date.localeCompare(a.date) || b.num - a.num)
      .slice(0, RECENT_COUNT);
  }
  return result;
};

const validateSpeeches = (expectedDays, days, speeches) => {
  const errors = [];
  if (expectedDays.length < 200) errors.push(`Only ${expectedDays.length} sitting days listed (expected 200+)`);
  const missing = expectedDays.length - days.length;
  if (missing > 0) errors.push(`${missing} sitting day transcript(s) failed to download`);
  const speakers = Object.values(speeches).filter((r) => r.speeches > 0).length;
  if (speakers < 350) errors.push(`Only ${speakers} MEPs spoke (expected 350+) — statement format changed?`);
  return errors;
};

// --- Statement topics -----------------------------------------------------------

const statementKey = ({ proceeding, date, num }) => `${proceeding}/${date}/${num}`;

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  oacute: "ó", Oacute: "Ó", ndash: "–", mdash: "—", bdquo: "„", rdquo: "”", ldquo: "“", hellip: "…",
};

const htmlToText = (html) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name] ?? m)
    .replace(/\s+/g, " ")
    .trim();

// Agenda item a statement was made under, from its transcript HTML:
// <p class="punkt-tytul">, or the section heading when that's empty (e.g. "Oświadczenia.").
const parseStatementTopic = (html) => {
  const title = html.match(/<p class="punkt-tytul">([\s\S]*?)<\/p>/);
  // Agenda titles end with a full stop, which reads oddly as a link label
  const text = title ? htmlToText(title[1]).replace(/\.$/, "") : "";
  if (text) return text;
  const heading = html.match(/<h2 class="punkt">([\s\S]*?)<\/h2>/);
  const headingText = heading ? htmlToText(heading[1]) : "";
  return headingText && !/punkt porządku dziennego/i.test(headingText) ? headingText.replace(/[.:]$/, "") : null;
};

// Distinct recent statements (across all MEPs) whose topic isn't cached yet, newest first
const topicsToFetch = (speeches, cache) => {
  const seen = new Set();
  const missing = [];
  for (const r of Object.values(speeches)) {
    for (const s of r.recent) {
      const key = statementKey(s);
      if (key in cache || seen.has(key)) continue;
      seen.add(key);
      missing.push(s);
    }
  }
  return missing.sort((a, b) => b.date.localeCompare(a.date) || b.num - a.num);
};

// Copy cached topics onto each MEP's recent statements (null when unknown)
const attachTopics = (speeches, cache) => {
  for (const r of Object.values(speeches)) {
    r.recent = r.recent.map((s) => ({ ...s, topic: cache[statementKey(s)] ?? null }));
  }
  return speeches;
};

module.exports = {
  statementKey,
  parseStatementTopic,
  topicsToFetch,
  attachTopics,
  MAX_STATEMENT_SECONDS,
  listSittingDays,
  statementSeconds,
  classifyStatement,
  buildMepSpeeches,
  validateSpeeches,
};
