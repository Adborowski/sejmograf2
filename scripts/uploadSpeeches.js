const fs = require('fs');
const path = require('path');
const { colors, initFirebase } = require('./blastUtils');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP SPEECHES TO FIRESTORE ====${colors.reset}\n`);

const NO_SPEECHES = {
  speeches: 0, seconds: 0, written: 0, official: 0, rapporteur: 0, daysSpoken: 0, lastDate: null, recent: [],
};

// Writes only `speeches` on meps/{id} (merge).
async function uploadSpeeches() {
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping', file), 'utf8'));
  const meps = read('meps.json');
  const speeches = read('mep-speeches.json');
  const db = initFirebase();

  let batch = db.batch();
  let pending = 0;
  for (const mep of meps) {
    batch.set(
      db.collection('meps').doc(String(mep.id)),
      { speeches: speeches[mep.id] || NO_SPEECHES },
      { merge: true },
    );
    if (++pending === 100) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  console.log(`${colors.green}✓ Updated speeches for ${meps.length} MEPs${colors.reset}\n`);
}

uploadSpeeches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
