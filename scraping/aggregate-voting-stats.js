const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const {
  aggregateVotingStats,
  computeAttendanceTotals,
} = require("./lib/attendance.js");

console.log(
  `${colors.cyan}${colors.bold}==== AGGREGATE VOTING STATS BY SITTING ====${colors.reset}\n`,
);

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

    const totals = computeAttendanceTotals(aggregated);

    return {
      ...mep,
      votingStats: aggregated,
      ...totals,
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
