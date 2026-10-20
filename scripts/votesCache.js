// Sync scraping/votings-cache.json.gz with Firebase Storage so each pipeline
// run (fresh GHA checkout) only fetches new votings.
//   node scripts/votesCache.js download   — before scraper-votes.js
//   node scripts/votesCache.js upload     — after it
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { colors } = require('./blastUtils');

const LOCAL = path.resolve(__dirname, '../scraping/votings-cache.json.gz');
const REMOTE = 'pipeline-cache/votings-term10.json.gz';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'sejmograf-91428',
  storageBucket: 'sejmograf-91428.firebasestorage.app',
});
const file = admin.storage().bucket().file(REMOTE);

async function main(mode) {
  if (mode === 'download') {
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`${colors.yellow}No cache in Storage — the scraper will fetch every voting${colors.reset}`);
      return;
    }
    await file.download({ destination: LOCAL });
    console.log(`${colors.green}✓ Downloaded ${REMOTE} (${Math.round(fs.statSync(LOCAL).size / 1024)} KB)${colors.reset}`);
  } else if (mode === 'upload') {
    await file.save(fs.readFileSync(LOCAL), { contentType: 'application/gzip', resumable: false });
    console.log(`${colors.green}✓ Uploaded ${REMOTE} (${Math.round(fs.statSync(LOCAL).size / 1024)} KB)${colors.reset}`);
  } else {
    throw new Error('Usage: votesCache.js download|upload');
  }
}

main(process.argv[2])
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
