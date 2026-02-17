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

  const PROGRESS_INTERVAL = 50;

  // Process each MEP
  for (let i = 0; i < mepsData.length; i++) {
    const mep = mepsData[i];

    // Fetch voting stats
    const votingStats = await getMepVotingStats(mep.id);

    if (votingStats) {
      combinedData.push({ ...mep, votingStats });
      successCount++;
    } else {
      combinedData.push({ ...mep, votingStats: null });
      errorCount++;
    }

    // Log progress every PROGRESS_INTERVAL MEPs and at the end
    if ((i + 1) % PROGRESS_INTERVAL === 0 || i === mepsData.length - 1) {
      console.log(
        `${colors.cyan}Progress: ${i + 1}/${mepsData.length} ` +
        `(✓ ${successCount}` +
        (errorCount > 0 ? ` ✗ ${errorCount}` : '') +
        `)${colors.reset}`
      );
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
