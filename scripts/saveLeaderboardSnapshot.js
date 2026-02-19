const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  reset: "\x1b[0m"
};

console.log(`${colors.cyan}${colors.bold}==== SAVE LEADERBOARD SNAPSHOT ====${colors.reset}\n`);

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sejmograf-91428",
});

let db = admin.firestore();
db.settings({ databaseId: 'sejmograf-db' });

async function saveLeaderboardSnapshot() {
  // Read aggregated MEP data
  const dataPath = path.resolve(__dirname, '../scraping/mep-voting-aggregated.json');
  console.log(`${colors.cyan}Reading ${dataPath}...${colors.reset}`);
  const mepsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`${colors.green}✓ Loaded ${mepsData.length} MEPs${colors.reset}\n`);

  // Find max sitting number and its date across all MEPs
  let maxSitting = 0;
  let maxSittingDate = null;

  for (const mep of mepsData) {
    if (!mep.votingStats || typeof mep.votingStats !== 'object') continue;
    for (const [key, stat] of Object.entries(mep.votingStats)) {
      const sitting = Number(key);
      if (sitting > maxSitting) {
        maxSitting = sitting;
        maxSittingDate = stat.date;
      }
    }
  }

  if (maxSitting === 0) {
    console.log(`${colors.yellow}No sitting data found. Skipping snapshot.${colors.reset}`);
    return;
  }

  console.log(`${colors.cyan}Latest sitting in data: #${maxSitting} (${maxSittingDate})${colors.reset}`);

  // Check if a snapshot for this sitting already exists
  const snapshotRef = db.collection('leaderboard_snapshots').doc(String(maxSitting));
  const existing = await snapshotRef.get();

  if (existing.exists) {
    console.log(`${colors.yellow}Snapshot for sitting #${maxSitting} already exists. No new sitting detected. Skipping.${colors.reset}\n`);
    return;
  }

  console.log(`${colors.green}New sitting detected! Building snapshot for sitting #${maxSitting}...${colors.reset}`);

  // Build ranked list from all active MEPs that have attendance data
  const activeMepsWithData = mepsData
    .filter(mep => mep.active && mep.attendanceRate !== null && mep.attendanceRate !== undefined)
    .sort((a, b) => b.attendanceRate - a.attendanceRate);

  const rankings = activeMepsWithData.map((mep, index) => ({
    rank: index + 1,
    mepId: mep.id,
    firstName: mep.firstName,
    lastName: mep.lastName,
    fullName: mep.firstLastName || `${mep.firstName} ${mep.lastName}`,
    club: mep.club,
    attendanceRate: mep.attendanceRate,
    totalVoted: mep.totalVoted,
    totalVotings: mep.totalVotings,
  }));

  // Write snapshot document and update index in a batch
  const indexRef = db.collection('leaderboard_snapshots').doc('index');
  const batch = db.batch();

  batch.set(snapshotRef, {
    sitting: maxSitting,
    date: maxSittingDate,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    activeMepCount: rankings.length,
    rankings,
  });

  // index document holds lightweight metadata for all snapshots (no rankings)
  batch.set(indexRef, {
    snapshots: admin.firestore.FieldValue.arrayUnion({
      sitting: maxSitting,
      date: maxSittingDate,
    }),
  }, { merge: true });

  await batch.commit();

  console.log(`${colors.green}${colors.bold}✓ Snapshot saved!${colors.reset}`);
  console.log(`${colors.cyan}Sitting: #${maxSitting}${colors.reset}`);
  console.log(`${colors.cyan}Date: ${maxSittingDate}${colors.reset}`);
  console.log(`${colors.cyan}Active MEPs ranked: ${rankings.length}${colors.reset}\n`);
}

saveLeaderboardSnapshot()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  });
