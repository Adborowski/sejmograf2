const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const admin = require("firebase-admin");

console.log(
  `${colors.yellow}${colors.bold}==== SEJM-SCRAPER BASIC ====${colors.reset}`,
);

// Initialize Firebase Admin to check which photos are already in Storage
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "sejmograf-91428",
  storageBucket: "sejmograf-91428.firebasestorage.app",
});
const bucket = admin.storage().bucket();

// Returns Sets of IDs already uploaded: { miniIds: Set<number>, bigIds: Set<number> }
const getUploadedPhotoIds = async () => {
  console.log(`${colors.cyan}Checking Firebase Storage for existing photos...${colors.reset}`);
  const [files] = await bucket.getFiles({ prefix: "meps/" });
  const miniIds = new Set();
  const bigIds = new Set();
  for (const file of files) {
    const bigMatch = file.name.match(/^meps\/(\d+)-big\.jpeg$/);
    const miniMatch = file.name.match(/^meps\/(\d+)\.jpeg$/);
    if (bigMatch) bigIds.add(parseInt(bigMatch[1]));
    else if (miniMatch) miniIds.add(parseInt(miniMatch[1]));
  }
  console.log(
    `${colors.green}✓ Found ${miniIds.size} mini and ${bigIds.size} big photos already in Storage${colors.reset}\n`,
  );
  return { miniIds, bigIds };
};

const getMepsAndSaveToFile = async () => {
  const res = await fetch("https://api.sejm.gov.pl/sejm/term10/MP", {
    method: "GET",
  });
  const data = await res.json();
  console.log(`${colors.green}✓ Fetched ${data.length} MEPs${colors.reset}`);
  fs.writeFileSync(path.resolve(__dirname, "meps.json"), JSON.stringify(data));
  console.log(`${colors.green}✓ Saved to meps.json${colors.reset}\n`);
};

const saveMepPhoto = async (mepId, uploadedMiniIds) => {
  const destination = path.resolve(__dirname, "img", `${mepId}.jpeg`);

  // Skip if already in Firebase Storage or on local disk
  if (uploadedMiniIds.has(mepId) || fs.existsSync(destination)) {
    return 'skipped';
  }

  try {
    const res = await fetch(`https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/photo-mini`, {
      method: "GET",
    });

    if (res.status === 404) {
      return 'not-found';
    }

    const fileStream = fs.createWriteStream(destination, { flags: "w" });
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return 'downloaded';
  } catch (error) {
    // Handle fetch errors (network issues, etc.)
    return 'error';
  }
};

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 300;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMepPhotosAndSave = async (uploadedMiniIds) => {
  fs.mkdirSync(path.resolve(__dirname, "img"), { recursive: true });
  console.log(`${colors.cyan}Getting MEP photos...${colors.reset}`);

  let skipped = 0;
  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  const ids = Array.from({ length: 600 }, (_, i) => i + 1);
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((id) => saveMepPhoto(id, uploadedMiniIds)));
    results.forEach(result => {
      if (result === 'skipped') skipped++;
      else if (result === 'downloaded') downloaded++;
      else if (result === 'not-found') notFound++;
      else if (result === 'error') errors++;
    });
    if (i + BATCH_SIZE < ids.length) await delay(BATCH_DELAY_MS);
  }

  console.log(`${colors.green}✓ Downloaded: ${downloaded}${colors.reset}`);
  console.log(`${colors.yellow}⏭  Skipped (already exists): ${skipped}${colors.reset}`);
  console.log(`${colors.dim}✗  Not found (404): ${notFound}${colors.reset}`);
  if (errors > 0) {
    console.log(`${colors.red}✗  Errors: ${errors}${colors.reset}`);
  }
  console.log('');
};

const saveMepPhotoBig = async (mepId, uploadedBigIds) => {
  const destination = path.resolve(__dirname, "img", `${mepId}-big.jpeg`);

  // Skip if already in Firebase Storage or on local disk
  if (uploadedBigIds.has(mepId) || fs.existsSync(destination)) {
    return 'skipped';
  }

  try {
    const res = await fetch(`https://api.sejm.gov.pl/sejm/term10/MP/${mepId}/photo`, {
      method: "GET",
    });

    if (res.status === 404) {
      return 'not-found';
    }

    const fileStream = fs.createWriteStream(destination, { flags: "w" });
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return 'downloaded';
  } catch (error) {
    // Handle fetch errors (network issues, etc.)
    return 'error';
  }
};

const getMepPhotosBigAndSave = async (uploadedBigIds) => {
  fs.mkdirSync(path.resolve(__dirname, "img"), { recursive: true });
  console.log(`${colors.cyan}Getting full-size MEP photos...${colors.reset}`);

  let skipped = 0;
  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  const ids = Array.from({ length: 600 }, (_, i) => i + 1);
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map((id) => saveMepPhotoBig(id, uploadedBigIds)));
    results.forEach(result => {
      if (result === 'skipped') skipped++;
      else if (result === 'downloaded') downloaded++;
      else if (result === 'not-found') notFound++;
      else if (result === 'error') errors++;
    });
    if (i + BATCH_SIZE < ids.length) await delay(BATCH_DELAY_MS);
  }

  console.log(`${colors.green}✓ Downloaded: ${downloaded}${colors.reset}`);
  console.log(`${colors.yellow}⏭  Skipped (already exists): ${skipped}${colors.reset}`);
  console.log(`${colors.dim}✗  Not found (404): ${notFound}${colors.reset}`);
  if (errors > 0) {
    console.log(`${colors.red}✗  Errors: ${errors}${colors.reset}`);
  }
  console.log('');
};

console.log(colors.reset); // reset terminal coloring

// Run functions sequentially
(async () => {
  try {
    await getMepsAndSaveToFile();
    const { miniIds, bigIds } = await getUploadedPhotoIds();
    await getMepPhotosAndSave(miniIds);
    await getMepPhotosBigAndSave(bigIds);
    console.log(`${colors.green}${colors.bold}✓ All done!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
