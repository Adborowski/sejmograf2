const fs = require('fs');
const path = require('path');
const { colors, initFirebase } = require('./blastUtils');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD ACTIVITY + MINISTRY STATS TO FIRESTORE ====${colors.reset}\n`);

const NO_ACTIVITY = { interpellations: 0, writtenQuestions: 0, firstAuthor: 0, lastDate: null, topRecipients: [] };

// Writes only `activity` on meps/{id} (merge) and replaces stats/ministries.
async function uploadActivity() {
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping', file), 'utf8'));
  const meps = read('meps.json');
  const activity = read('mep-activity.json');
  const ministryStats = read('ministry-stats.json');
  const db = initFirebase();

  let batch = db.batch();
  let pending = 0;
  for (const mep of meps) {
    batch.set(
      db.collection('meps').doc(String(mep.id)),
      { activity: activity[mep.id] || NO_ACTIVITY },
      { merge: true },
    );
    if (++pending === 100) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  console.log(`${colors.green}✓ Updated activity for ${meps.length} MEPs${colors.reset}`);

  await db.collection('stats').doc('ministries').set(ministryStats);
  console.log(`${colors.green}✓ Saved stats/ministries (${ministryStats.ministries.length} ministries)${colors.reset}\n`);
}

uploadActivity()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
