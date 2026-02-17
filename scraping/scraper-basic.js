const colors = require("../utils/ansiColors.js");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

console.log(
  `${colors.yellow}${colors.bold}==== SEJM-SCRAPER BASIC ====${colors.reset}`,
);

const getMepsAndSaveToFile = async () => {
  const res = await fetch("https://api.sejm.gov.pl/sejm/term10/MP", {
    method: "GET",
  });
  const data = await res.json();
  console.log(`${colors.green}✓ Fetched ${data.length} MEPs${colors.reset}`);
  fs.writeFileSync(path.resolve(__dirname, "meps.json"), JSON.stringify(data));
  console.log(`${colors.green}✓ Saved to meps.json${colors.reset}\n`);
};

const saveMepPhoto = async (mepId) => {
  const destination = path.resolve(__dirname, "img", `${mepId}.jpeg`);

  // Check if file already exists
  if (fs.existsSync(destination)) {
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

const getMepPhotosAndSave = async () => {
  fs.mkdirSync(path.resolve(__dirname, "img"), { recursive: true });
  console.log(`${colors.cyan}Getting MEP photos...${colors.reset}`);

  let skipped = 0;
  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  const promises = [];
  for (let i = 1; i <= 600; i++) {
    promises.push(saveMepPhoto(i));
  }

  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result === 'skipped') skipped++;
    else if (result === 'downloaded') downloaded++;
    else if (result === 'not-found') notFound++;
    else if (result === 'error') errors++;
  });

  console.log(`${colors.green}✓ Downloaded: ${downloaded}${colors.reset}`);
  console.log(`${colors.yellow}⏭  Skipped (already exists): ${skipped}${colors.reset}`);
  console.log(`${colors.dim}✗  Not found (404): ${notFound}${colors.reset}`);
  if (errors > 0) {
    console.log(`${colors.red}✗  Errors: ${errors}${colors.reset}`);
  }
  console.log('');
};

const saveMepPhotoBig = async (mepId) => {
  const destination = path.resolve(__dirname, "img", `${mepId}-big.jpeg`);

  // Check if file already exists
  if (fs.existsSync(destination)) {
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

const getMepPhotosBigAndSave = async () => {
  fs.mkdirSync(path.resolve(__dirname, "img"), { recursive: true });
  console.log(`${colors.cyan}Getting full-size MEP photos...${colors.reset}`);

  let skipped = 0;
  let downloaded = 0;
  let notFound = 0;
  let errors = 0;

  const promises = [];
  for (let i = 1; i <= 600; i++) {
    promises.push(saveMepPhotoBig(i));
  }

  const results = await Promise.all(promises);

  results.forEach(result => {
    if (result === 'skipped') skipped++;
    else if (result === 'downloaded') downloaded++;
    else if (result === 'not-found') notFound++;
    else if (result === 'error') errors++;
  });

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
// Photo functions (getMepPhotosAndSave, getMepPhotosBigAndSave) are defined above
// but excluded from the automated pipeline — run them manually when needed.
(async () => {
  try {
    await getMepsAndSaveToFile();
    console.log(`${colors.green}${colors.bold}✓ All done!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
})();
