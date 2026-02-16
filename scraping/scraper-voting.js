const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");

console.log(
  `${colors.cyan}${colors.bold}==== SEJM-SCRAPER VOTING ====${colors.reset}`,
);

// Fetch voting stats for a single MEP
const getMepVotingStats = async (mepId) => {
  try {
    const res = await fetch(`https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/votings/stats`, {
      method: "GET",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`${colors.red}Error fetching voting stats for MEP ${mepId}: ${error.message}${colors.reset}`);
    return null;
  }
};

// Fetch voting stats for all MEPs and save to file
const getAllMepVotingStats = async () => {
  // Read MEP list from meps.json
  const mepsPath = path.resolve(__dirname, 'meps.json');

  if (!fs.existsSync(mepsPath)) {
    console.error(`${colors.red}Error: meps.json not found. Run scraper-basic.js first.${colors.reset}`);
    process.exit(1);
  }

  const meps = JSON.parse(fs.readFileSync(mepsPath, 'utf8'));
  console.log(`${colors.green}✓ Found ${meps.length} MEPs${colors.reset}`);
  console.log(`${colors.cyan}Fetching voting statistics...${colors.reset}\n`);

  const votingData = [];
  let successful = 0;
  let failed = 0;

  // Fetch voting stats for each MEP
  for (let i = 0; i < meps.length; i++) {
    const mep = meps[i];
    const stats = await getMepVotingStats(mep.id);

    if (stats) {
      votingData.push({
        mepId: mep.id,
        votingStats: stats
      });
      successful++;
    } else {
      failed++;
    }

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === meps.length - 1) {
      process.stdout.write(`${colors.dim}  Progress: ${i + 1}/${meps.length}${colors.reset}\r`);
    }
  }

  console.log(`\n${colors.green}✓ Successfully fetched: ${successful}${colors.reset}`);
  if (failed > 0) {
    console.log(`${colors.yellow}⚠  Failed: ${failed}${colors.reset}`);
  }

  // Save to file
  const outputPath = path.resolve(__dirname, 'voting-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(votingData, null, 2));
  console.log(`${colors.green}✓ Saved to voting-data.json${colors.reset}\n`);
};

// Run the script
(async () => {
  try {
    await getAllMepVotingStats();
    console.log(`${colors.green}${colors.bold}✓ All done!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
