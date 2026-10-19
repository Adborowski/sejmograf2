// Pure attendance helpers — no I/O, so they can be unit tested.

// Collapse per-day voting stats (as returned by /MP/{id}/votings/stats)
// into one entry per sitting, keyed by sitting number.
const aggregateVotingStats = (votingStats) => {
  if (!votingStats || !Array.isArray(votingStats)) {
    return votingStats;
  }

  // Group by sitting number
  const bySitting = {};

  votingStats.forEach((stat) => {
    const sitting = stat.sitting;

    if (!bySitting[sitting]) {
      bySitting[sitting] = {
        sitting: sitting,
        numMissed: 0,
        numVoted: 0,
        numVotings: 0,
        dates: [],
      };
    }

    bySitting[sitting].numMissed += stat.numMissed || 0;
    bySitting[sitting].numVoted += stat.numVoted || 0;
    bySitting[sitting].numVotings += stat.numVotings || 0;

    if (stat.date) {
      bySitting[sitting].dates.push(stat.date);
    }
  });

  const result = {};

  Object.values(bySitting).forEach((sitting) => {
    const latestDate = sitting.dates.sort().reverse()[0];

    // Use absenceExcuse from the latest date entry
    const latestIndex = votingStats.findIndex(
      (s) => s.sitting === sitting.sitting && s.date === latestDate,
    );
    const absenceExcuse =
      latestIndex >= 0 ? votingStats[latestIndex].absenceExcuse : false;

    result[sitting.sitting] = {
      absenceExcuse: absenceExcuse,
      date: latestDate,
      numMissed: sitting.numMissed,
      numVoted: sitting.numVoted,
      numVotings: sitting.numVotings,
      sitting: sitting.sitting,
    };
  });

  return result;
};

// Totals across all sittings. attendanceRate is 0–1, or null with no data.
const computeAttendanceTotals = (aggregated) => {
  let totalVoted = 0;
  let totalMissed = 0;
  let totalVotings = 0;
  if (aggregated && typeof aggregated === "object") {
    Object.values(aggregated).forEach((stat) => {
      totalVoted += stat.numVoted || 0;
      totalMissed += stat.numMissed || 0;
      totalVotings += stat.numVotings || 0;
    });
  }
  const attendanceRate = totalVotings > 0 ? totalVoted / totalVotings : null;
  return { totalVoted, totalMissed, totalVotings, attendanceRate };
};

module.exports = { aggregateVotingStats, computeAttendanceTotals };
