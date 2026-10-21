#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

// ANSI colors
const colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

console.log(`${colors.cyan}${colors.bold}
╔════════════════════════════════════════════════╗
║   SEJMOGRAF MEP DATA UPDATE PIPELINE           ║
╚════════════════════════════════════════════════╝
${colors.reset}\n`);

const steps = [
  {
    name: "Fetch basic MEP data",
    script: "scraping/scraper-basic.js",
    description: "Fetching MEP profiles from Sejm API",
  },
  {
    name: "Combine data",
    script: "scraping/scraper-combine-voting.js",
    description: "Merging profiles with voting data",
  },
  {
    name: "Aggregate voting stats",
    script: "scraping/aggregate-voting-stats.js",
    description: "Aggregating by parliamentary sitting",
  },
  {
    name: "Validate data",
    script: "scraping/validate-data.js",
    description: "Checking data sanity before writing to Firestore",
  },
  {
    name: "Upload to Firestore",
    script: "scripts/uploadToFirestore.js",
    description: "Uploading MEP data to Firestore",
  },
  {
    name: "Upload list summary",
    script: "scripts/uploadMepSummary.js",
    description: "Writing the lightweight MEP list used by list pages",
  },
  {
    name: "Upload photos to Storage",
    script: "scripts/uploadToStorage.js",
    description: "Uploading MEP photos to Firebase Storage",
  },
  {
    name: "Save leaderboard snapshot",
    script: "scripts/saveLeaderboardSnapshot.js",
    description: "Saving leaderboard snapshot if a new sitting is detected",
  },
  // Enrichment steps run after the core attendance data, so a failure here
  // never blocks attendance updates or snapshots.
  {
    name: "Fetch roles",
    script: "scraping/scraper-roles.js",
    description: "Fetching committee memberships and club functions",
  },
  {
    name: "Upload roles",
    script: "scripts/uploadRoles.js",
    description: "Writing committees and club functions to Firestore",
  },
  {
    name: "Fetch questions",
    script: "scraping/scraper-questions.js",
    description: "Fetching interpellations and written questions",
  },
  {
    name: "Upload activity",
    script: "scripts/uploadActivity.js",
    description: "Writing MEP activity and ministry response stats to Firestore",
  },
  {
    name: "Download topics cache",
    script: "scripts/pipelineCache.js",
    args: ["download", "topics"],
    description: "Restoring previously fetched statement topics from Storage",
  },
  {
    name: "Fetch speeches",
    script: "scraping/scraper-speeches.js",
    description: "Fetching plenary transcripts and topics of recent statements",
  },
  {
    name: "Upload topics cache",
    script: "scripts/pipelineCache.js",
    args: ["upload", "topics"],
    description: "Saving statement topics to Storage for the next run",
  },
  {
    name: "Upload speeches",
    script: "scripts/uploadSpeeches.js",
    description: "Writing MEP speech stats to Firestore",
  },
  {
    name: "Download votes cache",
    script: "scripts/pipelineCache.js",
    args: ["download", "votes"],
    description: "Restoring previously fetched individual votes from Storage",
  },
  {
    name: "Fetch votes",
    script: "scraping/scraper-votes.js",
    description: "Fetching new votings and computing party loyalty",
  },
  {
    name: "Upload votes cache",
    script: "scripts/pipelineCache.js",
    args: ["upload", "votes"],
    description: "Saving individual votes to Storage for the next run",
  },
  {
    name: "Upload votes",
    script: "scripts/uploadVotes.js",
    description: "Writing loyalty, vote history, club agreement and the voting index to Firestore",
  },
];

let currentStep = 0;
const startTime = Date.now();

function runStep(step) {
  currentStep++;
  const stepPrefix = `[${currentStep}/${steps.length}]`;

  console.log(
    `${colors.cyan}${colors.bold}${stepPrefix} ${step.name}${colors.reset}`,
  );
  console.log(`${colors.yellow}${step.description}...${colors.reset}\n`);

  try {
    const scriptPath = path.resolve(__dirname, "..", step.script);
    const args = step.args ? ` ${step.args.join(" ")}` : "";
    execSync(`node "${scriptPath}"${args}`, {
      stdio: "inherit",
      cwd: path.resolve(__dirname, ".."),
    });

    console.log(`${colors.green}✓ ${step.name} completed${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ ${step.name} failed${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    return false;
  }
}

// Run all steps sequentially
let allSucceeded = true;
for (const step of steps) {
  const success = runStep(step);
  if (!success) {
    allSucceeded = false;
    break;
  }
}

// Summary
const duration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(
  `${colors.cyan}${colors.bold}════════════════════════════════════════════════${colors.reset}`,
);

if (allSucceeded) {
  console.log(
    `${colors.green}${colors.bold}✓ All steps completed successfully!${colors.reset}`,
  );
  console.log(`${colors.cyan}Total time: ${duration}s${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(
    `${colors.red}${colors.bold}✗ Update pipeline failed${colors.reset}`,
  );
  console.log(`${colors.cyan}Time elapsed: ${duration}s${colors.reset}\n`);
  process.exit(1);
}
