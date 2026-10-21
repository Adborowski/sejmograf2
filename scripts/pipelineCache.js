// Sync scraper caches with Firebase Storage so each pipeline run (fresh GHA
// checkout) only fetches what's new.
//   node scripts/pipelineCache.js download <name>   — before the scraper
//   node scripts/pipelineCache.js upload <name>     — after it
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { colors } = require('./blastUtils');

const CACHES = {
  // Every voting's individual votes (scraper-votes.js)
  votes: { local: '../scraping/votings-cache.json.gz', remote: 'pipeline-cache/votings-term10.json.gz' },
  // Agenda topic of each recently made statement (scraper-speeches.js)
  topics: { local: '../scraping/statement-topics.json.gz', remote: 'pipeline-cache/statement-topics-term10.json.gz' },
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'sejmograf-91428',
  storageBucket: 'sejmograf-91428.firebasestorage.app',
});

async function main(mode, name) {
  const cache = CACHES[name];
  if (!cache || !['download', 'upload'].includes(mode)) {
    throw new Error(`Usage: pipelineCache.js download|upload ${Object.keys(CACHES).join('|')}`);
  }
  const local = path.resolve(__dirname, cache.local);
  const file = admin.storage().bucket().file(cache.remote);

  if (mode === 'download') {
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`${colors.yellow}No ${name} cache in Storage — the scraper will start from scratch${colors.reset}`);
      return;
    }
    await file.download({ destination: local });
    console.log(`${colors.green}✓ Downloaded ${cache.remote} (${Math.round(fs.statSync(local).size / 1024)} KB)${colors.reset}`);
  } else {
    await file.save(fs.readFileSync(local), { contentType: 'application/gzip', resumable: false });
    console.log(`${colors.green}✓ Uploaded ${cache.remote} (${Math.round(fs.statSync(local).size / 1024)} KB)${colors.reset}`);
  }
}

main(process.argv[2], process.argv[3])
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
