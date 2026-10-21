const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { colors, initFirebase } = require('./blastUtils');

console.log(`${colors.cyan}${colors.bold}==== UPLOAD VOTES (loyalty, history, agreement, index) TO FIRESTORE ====${colors.reset}\n`);

const NO_VOTES = {
  cast: 0, abstained: 0, withLine: 0, rebellions: 0, opposed: 0,
  loyalty: null, abstainRate: null, recentRebellions: [],
};

// meps/{id}: merges `loyalty`, `voteHistory` and `clubAgreement` only.
// stats/votings_index: gzipped search index (stored as bytes — raw JSON would
// approach Firestore's 1 MiB doc limit by the end of the term).
// stats/club_agreement: club × club matrices.
async function uploadVotes() {
  const read = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scraping', file), 'utf8'));
  const meps = read('meps.json');
  const loyalty = read('mep-loyalty.json');
  const { indexId, history, clubAgreement } = read('mep-votes.json');
  const index = read('voting-index.json');
  const agreement = read('club-agreement.json');
  if (index.indexId !== indexId) throw new Error('Vote history and index come from different runs');
  const db = initFirebase();

  // Index first: the site falls back to live API lookups while ids differ
  const gz = zlib.gzipSync(JSON.stringify(index));
  await db.collection('stats').doc('votings_index').set({ indexId, gz });
  console.log(`${colors.green}✓ Saved stats/votings_index (${index.rows.length} votings, ${Math.round(gz.length / 1024)} KB gzipped)${colors.reset}`);

  await db.collection('stats').doc('club_agreement').set(agreement);
  console.log(`${colors.green}✓ Saved stats/club_agreement (${agreement.recent.clubs.length} clubs recently)${colors.reset}`);

  let batch = db.batch();
  let pending = 0;
  for (const mep of meps) {
    batch.set(
      db.collection('meps').doc(String(mep.id)),
      {
        loyalty: loyalty[mep.id] || NO_VOTES,
        voteHistory: { indexId, votes: history[mep.id] ?? '' },
        clubAgreement: clubAgreement[mep.id] || [],
      },
      { merge: true },
    );
    if (++pending === 100) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending > 0) await batch.commit();
  console.log(`${colors.green}✓ Updated votes for ${meps.length} MEPs${colors.reset}\n`);
}

uploadVotes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
