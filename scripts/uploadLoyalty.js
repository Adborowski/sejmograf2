const fs = require('fs');
const path = require('path');
const { colors, initFirebase } = require('./blastUtils');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP LOYALTY TO FIRESTORE ====${colors.reset}\n`);

const NO_VOTES = {
  cast: 0, abstained: 0, withLine: 0, rebellions: 0, opposed: 0,
  loyalty: null, abstainRate: null, recentRebellions: [],
};

// Writes only `loyalty` on meps/{id} (merge).
async function uploadLoyalty() {
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping', file), 'utf8'));
  const meps = read('meps.json');
  const loyalty = read('mep-loyalty.json');
  const db = initFirebase();

  let batch = db.batch();
  let pending = 0;
  for (const mep of meps) {
    batch.set(
      db.collection('meps').doc(String(mep.id)),
      { loyalty: loyalty[mep.id] || NO_VOTES },
      { merge: true },
    );
    if (++pending === 100) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  console.log(`${colors.green}✓ Updated loyalty for ${meps.length} MEPs${colors.reset}\n`);
}

uploadLoyalty()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
