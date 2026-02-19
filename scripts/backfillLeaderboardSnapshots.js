#!/usr/bin/env node
/**
 * One-time backfill script: creates a leaderboard snapshot for every sitting
 * found in mep-voting-aggregated.json, from sitting 1 up to the latest.
 *
 * Already-existing snapshots are skipped, so this is safe to re-run.
 *
 * Usage: node scripts/backfillLeaderboardSnapshots.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m"
};

console.log(`${colors.cyan}${colors.bold}==== BACKFILL LEADERBOARD SNAPSHOTS ====${colors.reset}\n`);

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sejmograf-91428",
});

let db = admin.firestore();
db.settings({ databaseId: 'sejmograf-db' });

async function backfill() {
  // Read aggregated MEP data
  const dataPath = path.resolve(__dirname, '../scraping/mep-voting-aggregated.json');
  console.log(`${colors.cyan}Reading ${dataPath}...${colors.reset}`);
  const mepsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`${colors.green}✓ Loaded ${mepsData.length} MEPs${colors.reset}\n`);

  // Collect all unique sitting numbers and their dates
  const sittingDates = new Map(); // sitting -> date
  for (const mep of mepsData) {
    if (!mep.votingStats || typeof mep.votingStats !== 'object') continue;
    for (const [key, stat] of Object.entries(mep.votingStats)) {
      const sitting = Number(key);
      if (!sittingDates.has(sitting)) {
        sittingDates.set(sitting, stat.date);
      }
    }
  }

  const allSittings = Array.from(sittingDates.keys()).sort((a, b) => a - b);
  console.log(`${colors.cyan}Found ${allSittings.length} sittings: #${allSittings[0]} → #${allSittings[allSittings.length - 1]}${colors.reset}`);

  // Check which snapshots already exist in Firestore
  console.log(`${colors.cyan}Checking for existing snapshots...${colors.reset}`);
  const existingSnaps = new Set();
  for (const sitting of allSittings) {
    const docSnap = await db.collection('leaderboard_snapshots').doc(String(sitting)).get();
    if (docSnap.exists) existingSnaps.add(sitting);
  }
  const toCreate = allSittings.filter(s => !existingSnaps.has(s));
  console.log(`${colors.green}✓ ${existingSnaps.size} already exist, ${toCreate.length} to create${colors.reset}\n`);

  if (toCreate.length === 0) {
    console.log(`${colors.yellow}Nothing to backfill. All snapshots already exist.${colors.reset}\n`);
    return;
  }

  // Build and write a snapshot for each sitting that needs one
  const indexEntries = []; // collect metadata for index update

  for (const sitting of toCreate) {
    const date = sittingDates.get(sitting);
    process.stdout.write(`${colors.dim}Building snapshot for sitting #${sitting} (${date})...${colors.reset}`);

    // For each active MEP, sum stats for sittings 1..sitting
    const activeMepsWithData = [];
    for (const mep of mepsData) {
      if (!mep.active) continue;
      if (!mep.votingStats || typeof mep.votingStats !== 'object') continue;

      let totalVoted = 0;
      let totalVotings = 0;

      for (const [key, stat] of Object.entries(mep.votingStats)) {
        if (Number(key) <= sitting) {
          totalVoted += stat.numVoted || 0;
          totalVotings += stat.numVotings || 0;
        }
      }

      if (totalVotings === 0) continue; // no data for this MEP at this point in time

      activeMepsWithData.push({
        mepId: mep.id,
        firstName: mep.firstName,
        lastName: mep.lastName,
        fullName: mep.firstLastName || `${mep.firstName} ${mep.lastName}`,
        club: mep.club,
        attendanceRate: totalVoted / totalVotings,
        totalVoted,
        totalVotings,
      });
    }

    // Sort by attendance descending and assign ranks
    activeMepsWithData.sort((a, b) => b.attendanceRate - a.attendanceRate);
    const rankings = activeMepsWithData.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    // Write snapshot document
    await db.collection('leaderboard_snapshots').doc(String(sitting)).set({
      sitting,
      date,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      activeMepCount: rankings.length,
      rankings,
    });

    indexEntries.push({ sitting, date });
    console.log(` ${colors.green}✓ (${rankings.length} MEPs ranked)${colors.reset}`);
  }

  // Update the index document with all newly created entries
  if (indexEntries.length > 0) {
    console.log(`\n${colors.cyan}Updating index document...${colors.reset}`);
    const indexRef = db.collection('leaderboard_snapshots').doc('index');
    await indexRef.set({
      snapshots: admin.firestore.FieldValue.arrayUnion(...indexEntries),
    }, { merge: true });
    console.log(`${colors.green}✓ Index updated with ${indexEntries.length} entries${colors.reset}`);
  }

  console.log(`\n${colors.green}${colors.bold}✓ Backfill complete!${colors.reset}`);
  console.log(`${colors.cyan}Created: ${toCreate.length} snapshots${colors.reset}`);
  console.log(`${colors.cyan}Skipped: ${existingSnaps.size} (already existed)${colors.reset}\n`);
}

backfill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  });
