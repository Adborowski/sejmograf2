const fs = require('fs');
const path = require('path');
const { colors, initFirebase } = require('./blastUtils');
const { buildMepSummary, validateSummary } = require('../scraping/lib/summary.js');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP LIST SUMMARY TO FIRESTORE ====${colors.reset}\n`);

// stats/mep_list holds the whole list as one JSON string: a single read for
// list pages, and no per-field indexing of ~500 nested entries.
async function uploadSummary() {
  const dataPath = path.resolve(__dirname, '../scraping/mep-voting-aggregated.json');
  const meps = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const summary = buildMepSummary(meps);

  const errors = validateSummary(summary, meps.length);
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`${colors.red}  - ${e}${colors.reset}`));
    throw new Error('Summary failed validation');
  }

  const json = JSON.stringify(summary);
  const db = initFirebase();
  await db.collection('stats').doc('mep_list').set({
    json,
    generatedAt: new Date().toISOString(),
  });
  console.log(
    `${colors.green}✓ Saved stats/mep_list: ${summary.meps.length} MEPs, ${summary.sittings.length} sittings, ${Math.round(Buffer.byteLength(json) / 1024)} KB${colors.reset}\n`,
  );
}

uploadSummary()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
