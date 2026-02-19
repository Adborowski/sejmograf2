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
    name: "Fetch voting data",
    script: "scraping/scraper-voting.js",
    description: "Fetching voting statistics",
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
    name: "Upload to Firestore",
    script: "scripts/uploadToFirestore.js",
    description: "Uploading MEP data to Firestore",
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
    execSync(`node "${scriptPath}"`, {
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
