const fs = require('fs');
const path = require('path');
const { colors, initFirebase } = require('./blastUtils');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP ROLES TO FIRESTORE ====${colors.reset}\n`);

// Writes only `committees` and `clubFunction` (merge), so other fields are untouched.
// Every MEP gets a value, so someone who left a committee has it removed.
async function uploadRoles() {
  const meps = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping/meps.json'), 'utf8'));
  const roles = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping/mep-roles.json'), 'utf8'));
  const db = initFirebase();

  let batch = db.batch();
  let pending = 0;
  for (const mep of meps) {
    const r = roles[mep.id] || { committees: [], clubFunction: null };
    batch.set(db.collection('meps').doc(String(mep.id)), r, { merge: true });
    if (++pending === 100) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();

  console.log(`${colors.green}✓ Updated roles for ${meps.length} MEPs${colors.reset}\n`);
}

uploadRoles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
