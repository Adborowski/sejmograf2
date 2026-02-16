const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");

console.log(
  `${colors.cyan}${colors.bold}==== COMBINE MEP DATA WITH VOTING STATS ====${colors.reset}\n`,
);

// Fetch voting stats for a single MEP
const getMepVotingStats = async (mepId) => {
  try {
    const response = await fetch(
      `https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/votings/stats`,
      { method: "GET" },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `${colors.red}✗ Error fetching stats for MEP ${mepId}: ${error.message}${colors.reset}`,
    );
    return null;
  }
};

// Add delay to avoid rate limiting
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Main function to combine data
const combineVotingData = async () => {
  const mepsFilePath = path.resolve(__dirname, "meps.json");
  const outputFilePath = path.resolve(__dirname, "mep-voting.json");

  // Read meps.json
  console.log(`${colors.cyan}Reading meps.json...${colors.reset}`);
  const mepsData = JSON.parse(fs.readFileSync(mepsFilePath, "utf8"));
  console.log(
    `${colors.green}✓ Found ${mepsData.length} MEPs${colors.reset}\n`,
  );

  const combinedData = [];
  let successCount = 0;
  let errorCount = 0;

  // Process each MEP
  for (let i = 0; i < mepsData.length; i++) {
    const mep = mepsData[i];
    const progress = `[${i + 1}/${mepsData.length}]`;

    process.stdout.write(
      `${colors.cyan}${progress} Fetching voting stats for ${mep.firstName} ${mep.lastName} (ID: ${mep.id})...${colors.reset}`,
    );

    // Fetch voting stats
    const votingStats = await getMepVotingStats(mep.id);

    if (votingStats) {
      // Combine data
      const combinedMep = {
        ...mep,
        votingStats: votingStats,
      };
      combinedData.push(combinedMep);
      successCount++;
      process.stdout.write(` ${colors.green}✓${colors.reset}\n`);
    } else {
      // Add MEP without voting stats
      combinedData.push({
        ...mep,
        votingStats: null,
      });
      errorCount++;
      process.stdout.write(` ${colors.red}✗${colors.reset}\n`);
    }

    // Add delay between requests to avoid rate limiting (100ms)
    if (i < mepsData.length - 1) {
      await delay(100);
    }
  }

  // Save to file
  console.log(`\n${colors.cyan}Saving to mep-voting.json...${colors.reset}`);
  fs.writeFileSync(outputFilePath, JSON.stringify(combinedData, null, 2));

  // Summary
  console.log(`${colors.green}${colors.bold}✓ Complete!${colors.reset}`);
  console.log(`${colors.green}Success: ${successCount}${colors.reset}`);
  if (errorCount > 0) {
    console.log(`${colors.yellow}Errors: ${errorCount}${colors.reset}`);
  }
  console.log(
    `${colors.cyan}Output saved to: ${outputFilePath}${colors.reset}\n`,
  );
};

// Run the script
combineVotingData().catch((error) => {
  console.error(
    `${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`,
  );
  process.exit(1);
});

getMepVotingStats();
