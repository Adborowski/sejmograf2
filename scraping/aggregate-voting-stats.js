const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");

console.log(
  `${colors.cyan}${colors.bold}==== AGGREGATE VOTING STATS BY SITTING ====${colors.reset}\n`,
);

// Aggregate voting stats by sitting number
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
        absenceExcuses: [],
      };
    }

    // Sum the numbers
    bySitting[sitting].numMissed += stat.numMissed || 0;
    bySitting[sitting].numVoted += stat.numVoted || 0;
    bySitting[sitting].numVotings += stat.numVotings || 0;

    // Collect dates and absenceExcuse values
    if (stat.date) {
      bySitting[sitting].dates.push(stat.date);
    }
    bySitting[sitting].absenceExcuses.push(stat.absenceExcuse);
  });

  // Convert to object keyed by sitting number
  const result = {};

  Object.values(bySitting).forEach((sitting) => {
    // Sort dates and get the latest one
    const latestDate = sitting.dates.sort().reverse()[0];

    // Use absenceExcuse from the latest date entry
    const latestIndex = votingStats.findIndex(
      (s) => s.sitting === sitting.sitting && s.date === latestDate,
    );
    const absenceExcuse =
      latestIndex >= 0 ? votingStats[latestIndex].absenceExcuse : false;

    // Use sitting number as the key
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

// Main function
const aggregateFile = () => {
  const inputFilePath = path.resolve(__dirname, "mep-voting.json");
  const outputFilePath = path.resolve(__dirname, "mep-voting-aggregated.json");

  // Read the file
  console.log(`${colors.cyan}Reading mep-voting.json...${colors.reset}`);
  const originalSize = fs.statSync(inputFilePath).size;
  console.log(
    `${colors.yellow}Original file size: ${(originalSize / 1024 / 1024).toFixed(2)} MB${colors.reset}`,
  );

  const mepsData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
  console.log(
    `${colors.green}✓ Found ${mepsData.length} MEPs${colors.reset}\n`,
  );

  let totalStatsBefore = 0;
  let totalStatsAfter = 0;

  // Process each MEP
  console.log(`${colors.cyan}Aggregating voting stats...${colors.reset}`);
  const aggregatedData = mepsData.map((mep, index) => {
    const before = mep.votingStats ? mep.votingStats.length : 0;
    const aggregated = aggregateVotingStats(mep.votingStats);
    const after = aggregated ? aggregated.length : 0;

    totalStatsBefore += before;
    totalStatsAfter += after;

    if ((index + 1) % 50 === 0) {
      process.stdout.write(
        `${colors.dim}  Processed ${index + 1}/${mepsData.length} MEPs...${colors.reset}\r`,
      );
    }

    return {
      ...mep,
      votingStats: aggregated,
    };
  });

  console.log(
    `${colors.green}✓ Processed all ${mepsData.length} MEPs${colors.reset}                    `,
  );

  // Save to new file
  console.log(
    `\n${colors.cyan}Saving to mep-voting-aggregated.json...${colors.reset}`,
  );
  const outputJson = JSON.stringify(aggregatedData, null, 2);
  fs.writeFileSync(outputFilePath, outputJson);

  const newSize = fs.statSync(outputFilePath).size;
  const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

  // Summary
  console.log(`${colors.green}${colors.bold}✓ Complete!${colors.reset}`);
  console.log(
    `${colors.cyan}Stats entries: ${totalStatsBefore} → ${totalStatsAfter} (${((1 - totalStatsAfter / totalStatsBefore) * 100).toFixed(1)}% reduction)${colors.reset}`,
  );
  console.log(
    `${colors.cyan}File size: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(newSize / 1024 / 1024).toFixed(2)} MB (${reduction}% reduction)${colors.reset}`,
  );
  console.log(`${colors.cyan}Output: ${outputFilePath}${colors.reset}\n`);
};

// Run the script
try {
  aggregateFile();
} catch (error) {
  console.error(
    `${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`,
  );
  process.exit(1);
}
aggregateVotingStats();
