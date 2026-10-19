// Lightweight MEP list for list pages (home, leaderboard, clubs, search).
// Replaces downloading every full `meps` doc: one Firestore read instead of ~500,
// and no per-sitting votingStats (≈80% of the full payload).

// Fields list views read. fullName comes from the API's firstLastName, as in uploadToFirestore.js.
const LIST_FIELDS = [
  "id", "firstName", "lastName", "club", "active", "email",
  "districtName", "districtNum", "voivodeship", "profession", "educationLevel",
  "totalVoted", "totalMissed", "totalVotings", "attendanceRate",
];

// Same order as Firestore's orderBy('lastName'): code-unit string order, ties by doc id (string)
const compareLikeFirestore = (a, b) => {
  if (a.lastName !== b.lastName) return a.lastName < b.lastName ? -1 : 1;
  const ia = String(a.id), ib = String(b.id);
  return ia === ib ? 0 : ia < ib ? -1 : 1;
};

const toListEntry = (mep) => {
  const entry = { fullName: mep.firstLastName };
  for (const field of LIST_FIELDS) {
    if (mep[field] !== undefined) entry[field] = mep[field];
  }
  return entry;
};

// Per-sitting totals overall and per (current) club, for the attendance chart.
// Mirrors what AttendanceChart used to compute in the browser from every MEP's votingStats.
const buildSittingTotals = (sortedMeps) => {
  const bySitting = new Map();
  for (const mep of sortedMeps) {
    if (!mep.votingStats) continue;
    for (const [key, stat] of Object.entries(mep.votingStats)) {
      const sitting = Number(key);
      if (!bySitting.has(sitting)) {
        bySitting.set(sitting, { sitting, date: stat.date ?? "", voted: 0, votings: 0, clubs: {} });
      }
      const entry = bySitting.get(sitting);
      entry.voted += stat.numVoted || 0;
      entry.votings += stat.numVotings || 0;
      if (mep.club) {
        const c = (entry.clubs[mep.club] ??= [0, 0]); // [voted, votings]
        c[0] += stat.numVoted || 0;
        c[1] += stat.numVotings || 0;
      }
    }
  }
  return [...bySitting.values()].sort((a, b) => a.sitting - b.sitting);
};

// aggregatedMeps: contents of mep-voting-aggregated.json
const buildMepSummary = (aggregatedMeps) => {
  const sorted = [...aggregatedMeps].sort(compareLikeFirestore);
  return {
    meps: sorted.map(toListEntry),
    sittings: buildSittingTotals(sorted),
  };
};

const validateSummary = (summary, inputCount) => {
  const errors = [];
  if (summary.meps.length !== inputCount) {
    errors.push(`Summary has ${summary.meps.length} MEPs, input had ${inputCount}`);
  }
  if (summary.sittings.length === 0) errors.push("Summary has no sittings");
  // Firestore docs are capped at 1 MiB; leave headroom
  const bytes = Buffer.byteLength(JSON.stringify(summary));
  if (bytes > 900 * 1024) errors.push(`Summary is ${Math.round(bytes / 1024)} KB (limit ~900 KB)`);
  return errors;
};

module.exports = { LIST_FIELDS, compareLikeFirestore, buildMepSummary, buildSittingTotals, validateSummary };
