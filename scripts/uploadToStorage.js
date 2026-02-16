const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  reset: "\x1b[0m"
};

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP PHOTOS TO FIREBASE STORAGE ====${colors.reset}\n`);

// Initialize Firebase Admin
const serviceAccount = {
  projectId: "sejmograf-91428",
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: serviceAccount.projectId,
  storageBucket: "sejmograf-91428.firebasestorage.app"
});

// Get Storage instance
const bucket = admin.storage().bucket();

// Upload images to Firebase Storage
async function uploadMepPhotos() {
  try {
    const imgDir = path.resolve(__dirname, '../scraping/img');
    console.log(`${colors.cyan}Reading images from ${imgDir}...${colors.reset}`);

    // Get all jpeg files
    const files = fs.readdirSync(imgDir).filter(file => file.endsWith('.jpeg'));
    console.log(`${colors.green}✓ Found ${files.length} images${colors.reset}\n`);

    console.log(`${colors.cyan}Uploading to Firebase Storage...${colors.reset}\n`);

    let uploaded = 0;
    let skipped = 0;

    // Upload images in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await Promise.all(batch.map(async (file) => {
        const mepId = file.replace('.jpeg', '');
        const localPath = path.join(imgDir, file);
        const storagePath = `meps/${mepId}.jpeg`;

        // Check if file already exists
        const fileRef = bucket.file(storagePath);
        const [exists] = await fileRef.exists();

        if (exists) {
          skipped++;
          console.log(`${colors.yellow}  ⏭  Skipping ${mepId} - already exists${colors.reset}`);
          return;
        }

        // Upload file
        await bucket.upload(localPath, {
          destination: storagePath,
          metadata: {
            contentType: 'image/jpeg',
            metadata: {
              mepId: mepId
            }
          }
        });

        uploaded++;
        console.log(`${colors.green}  ✓ Uploaded ${mepId}${colors.reset}`);
      }));

      // Progress update
      const processed = Math.min(i + batchSize, files.length);
      console.log(`${colors.cyan}  Progress: ${processed}/${files.length}${colors.reset}`);
    }

    console.log(`\n${colors.green}${colors.bold}✓ Upload complete!${colors.reset}`);
    console.log(`${colors.cyan}Uploaded: ${uploaded}${colors.reset}`);
    console.log(`${colors.cyan}Skipped: ${skipped}${colors.reset}`);
    console.log(`${colors.cyan}Total: ${files.length}${colors.reset}\n`);

    // Next steps
    console.log(`${colors.yellow}${colors.bold}📋 Next Steps:${colors.reset}`);
    console.log(`${colors.yellow}1. In Firebase Console, go to Storage${colors.reset}`);
    console.log(`${colors.yellow}2. You should see a 'meps' folder with ${files.length} images${colors.reset}`);
    console.log(`${colors.yellow}3. Configure Storage security rules if needed${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the upload
uploadMepPhotos()
  .then(() => {
    console.log(`${colors.green}Done!${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
