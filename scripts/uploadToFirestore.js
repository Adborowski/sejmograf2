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

console.log(`${colors.cyan}${colors.bold}==== UPLOAD MEP DATA TO FIRESTORE ====${colors.reset}\n`);

// Initialize Firebase Admin with your project credentials
const serviceAccount = {
  projectId: "sejmograf-91428",
  // For now, we'll use the web config
  // You can get a service account key from Firebase Console later
};

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: serviceAccount.projectId,
  databaseURL: "https://sejmograf-91428-default-rtdb.europe-west1.firebasedatabase.app"
});

// Get Firestore instance
// Note: Database ID selection may not be fully supported in current Admin SDK version
// Using default database - you can configure the default database in Firebase Console
let db;
try {
  db = admin.firestore();

  // Try to set database settings if supported
  db.settings({
    databaseId: 'sejmograf-db'
  });

  console.log(`${colors.green}✓ Connected to Firestore (targeting sejmograf-db)${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error initializing Firestore: ${error.message}${colors.reset}`);
  console.log(`${colors.yellow}Falling back to default database...${colors.reset}`);
  db = admin.firestore();
}

// Helper function to remove undefined values from an object
function removeUndefined(obj) {
  const cleaned = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      if (obj[key] === null) {
        cleaned[key] = null;
      } else if (Array.isArray(obj[key])) {
        cleaned[key] = obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        cleaned[key] = removeUndefined(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  return cleaned;
}

// Upload data to Firestore
async function uploadMepData() {
  try {
    // Read the aggregated data
    const dataPath = path.resolve(__dirname, '../scraping/mep-voting-aggregated.json');
    console.log(`${colors.cyan}Reading ${dataPath}...${colors.reset}`);

    const mepsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`${colors.green}✓ Found ${mepsData.length} MEPs${colors.reset}\n`);

    // Get Firestore batch (reduced to avoid timeouts)
    const batchSize = 50;
    let batch = db.batch();
    let operationCount = 0;
    let totalUploaded = 0;

    console.log(`${colors.cyan}Uploading to Firestore...${colors.reset}\n`);

    for (let i = 0; i < mepsData.length; i++) {
      const mep = mepsData[i];

      // Use MEP ID as document ID
      const docRef = db.collection('meps').doc(String(mep.id));

      // Prepare data (remove undefined values)
      const mepData = removeUndefined({
        // Basic info
        id: mep.id,
        firstName: mep.firstName,
        lastName: mep.lastName,
        fullName: mep.firstLastName,
        club: mep.club,
        email: mep.email,
        active: mep.active,

        // Birth info
        birthDate: mep.birthDate,
        birthLocation: mep.birthLocation,

        // District info
        districtName: mep.districtName,
        districtNum: mep.districtNum,
        voivodeship: mep.voivodeship,

        // Other info
        educationLevel: mep.educationLevel,
        profession: mep.profession,
        numberOfVotes: mep.numberOfVotes,

        // Voting stats
        votingStats: mep.votingStats || [],

        // Pre-computed attendance totals (for leaderboard queries)
        totalVoted: mep.totalVoted ?? null,
        totalMissed: mep.totalMissed ?? null,
        totalVotings: mep.totalVotings ?? null,
        attendanceRate: mep.attendanceRate ?? null,

        // Metadata
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      batch.set(docRef, mepData);
      operationCount++;
      totalUploaded++;

      // Commit batch every 500 operations
      if (operationCount === batchSize) {
        await batch.commit();
        console.log(`${colors.green}  ✓ Uploaded ${totalUploaded}/${mepsData.length} MEPs${colors.reset}`);
        batch = db.batch();
        operationCount = 0;
      }
    }

    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`${colors.green}  ✓ Uploaded ${totalUploaded}/${mepsData.length} MEPs${colors.reset}`);
    }

    console.log(`\n${colors.green}${colors.bold}✓ Upload complete!${colors.reset}`);
    console.log(`${colors.cyan}Total MEPs uploaded: ${totalUploaded}${colors.reset}\n`);

    // Create indexes info
    console.log(`${colors.yellow}${colors.bold}📋 Next Steps:${colors.reset}`);
    console.log(`${colors.yellow}1. In Firebase Console, go to Firestore Database${colors.reset}`);
    console.log(`${colors.yellow}2. You should see a 'meps' collection with ${totalUploaded} documents${colors.reset}`);
    console.log(`${colors.yellow}3. Create composite indexes for common queries (optional)${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}${colors.bold}Error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the upload
uploadMepData()
  .then(() => {
    console.log(`${colors.green}Done!${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
