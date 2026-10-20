// Individual votes → party loyalty and abstention per MEP. Pure — no I/O.
//
// Loyalty is measured against the club the MEP belonged to *at the time of the
// vote* (the API records it per vote), so club switchers aren't penalised for
// voting with their new club.

const CAST = ["YES", "NO", "ABSTAIN"];
// A club line needs at least this many members casting a vote...
const MIN_CLUB_VOTES = 3;
// ...and one option chosen by more than this share of them; otherwise the club was split
const LINE_THRESHOLD = 0.5;
const RECENT_REBELLIONS = 10;
// Not a club: independents have no line to follow
const NO_CLUB = "niez.";

const votingKey = (sitting, num) => `${sitting}/${num}`;

// Compact form of GET /votings/{sitting}/{num} for the cache: ids grouped by club and vote.
const compactVoting = (detail) => {
  const byClub = {};
  for (const v of detail.votes || []) {
    const club = (byClub[v.club || NO_CLUB] ??= {});
    (club[v.vote] ??= []).push(v.MP);
  }
  return {
    sitting: detail.sitting,
    num: detail.votingNumber,
    date: detail.date,
    kind: detail.kind,
    title: detail.title,
    topic: detail.topic || null,
    byClub,
  };
};

// The option chosen by a majority of the club members who cast a vote, or null.
const clubLine = (clubVotes) => {
  const counts = CAST.map((option) => [option, clubVotes[option]?.length ?? 0]);
  const cast = counts.reduce((sum, [, n]) => sum + n, 0);
  if (cast < MIN_CLUB_VOTES) return null;
  const [option, n] = counts.reduce((best, c) => (c[1] > best[1] ? c : best));
  return n / cast > LINE_THRESHOLD ? option : null;
};

// votings: compact votings (any order).
// Returns { [mepId]: { cast, abstained, withLine, rebellions, opposed, loyalty, abstainRate, recentRebellions } }
//   withLine   — votes cast where the MEP's club had a line
//   rebellions — of those, votes different from the line
//   opposed    — of those, the opposite side (YES vs NO), not just abstaining
const buildLoyalty = (votings) => {
  const result = {};
  const entry = (id) =>
    (result[id] ??= { cast: 0, abstained: 0, withLine: 0, rebellions: 0, opposed: 0, club: null, recentRebellions: [] });

  const ordered = [...votings]
    .filter((v) => v.kind === "ELECTRONIC")
    .sort((a, b) => a.date.localeCompare(b.date) || a.sitting - b.sitting || a.num - b.num);

  for (const voting of ordered) {
    for (const [club, clubVotes] of Object.entries(voting.byClub)) {
      const line = club === NO_CLUB ? null : clubLine(clubVotes);
      for (const option of CAST) {
        for (const id of clubVotes[option] || []) {
          const r = entry(id);
          r.club = club; // votings are in date order, so this ends as the latest club
          r.cast++;
          if (option === "ABSTAIN") r.abstained++;
          if (!line) continue;
          r.withLine++;
          if (option === line) continue;
          r.rebellions++;
          if (option !== "ABSTAIN" && line !== "ABSTAIN") r.opposed++;
          r.recentRebellions.push({
            sitting: voting.sitting,
            num: voting.num,
            date: voting.date.slice(0, 10),
            title: voting.title,
            topic: voting.topic,
            vote: option,
            clubLine: line,
            club,
          });
        }
      }
    }
  }

  for (const r of Object.values(result)) {
    r.loyalty = r.withLine > 0 ? 1 - r.rebellions / r.withLine : null;
    r.abstainRate = r.cast > 0 ? r.abstained / r.cast : null;
    r.recentRebellions = r.recentRebellions.slice(-RECENT_REBELLIONS).reverse(); // newest first
  }

  // Context for a single score: average loyalty in the MEP's (latest) club and in the whole Sejm
  const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
  const scored = Object.values(result).filter((r) => r.loyalty !== null);
  const clubAverages = {};
  for (const club of new Set(scored.map((r) => r.club))) {
    clubAverages[club] = mean(scored.filter((r) => r.club === club).map((r) => r.loyalty));
  }
  const sejmAverage = mean(scored.map((r) => r.loyalty));
  for (const r of Object.values(result)) {
    // MEPs who are now independent keep a score from their club days, but
    // "independents" aren't a club, so there's no club average to compare to
    r.clubAverage = r.club === NO_CLUB ? null : clubAverages[r.club] ?? null;
    r.sejmAverage = sejmAverage;
  }
  return result;
};

// Which votings are missing from the cache, given GET /votings (per-day counts).
// Returns sitting numbers whose cached count differs from the API's.
const sittingsToFetch = (votingIndex, cache) => {
  const expected = {};
  for (const day of votingIndex) {
    expected[day.proceeding] = (expected[day.proceeding] || 0) + (day.votingsNum || 0);
  }
  const cached = {};
  for (const v of Object.values(cache)) cached[v.sitting] = (cached[v.sitting] || 0) + 1;
  return Object.keys(expected)
    .map(Number)
    .filter((s) => expected[s] !== (cached[s] || 0))
    .sort((a, b) => a - b);
};

const validateLoyalty = (votingIndex, cache, loyalty) => {
  const errors = [];
  const expected = votingIndex.reduce((sum, d) => sum + (d.votingsNum || 0), 0);
  const cachedCount = Object.keys(cache).length;
  if (expected < 4900) errors.push(`Vote index lists only ${expected} votings (expected 4900+)`);
  if (cachedCount !== expected) errors.push(`Cache has ${cachedCount} votings, index lists ${expected}`);
  const withLoyalty = Object.values(loyalty).filter((r) => r.loyalty !== null).length;
  if (withLoyalty < 440) errors.push(`Only ${withLoyalty} MEPs have a loyalty score (expected 440+)`);
  const avg = Object.values(loyalty).reduce((s, r) => s + (r.loyalty ?? 0), 0) / (withLoyalty || 1);
  // Club discipline in the Sejm is very high; a low average means the vote format changed
  if (avg < 0.9) errors.push(`Average loyalty ${avg.toFixed(3)} is implausibly low`);
  return errors;
};

module.exports = {
  NO_CLUB,
  votingKey,
  compactVoting,
  clubLine,
  buildLoyalty,
  sittingsToFetch,
  validateLoyalty,
};
