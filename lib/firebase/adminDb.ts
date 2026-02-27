import * as admin from 'firebase-admin';

// Cached Firestore instance — settings() must only be called once per instance.
let _db: admin.firestore.Firestore | null = null;

// Returns the Admin Firestore instance for server-side use (API routes).
// Credentials come from GOOGLE_APPLICATION_CREDENTIALS_JSON (base64-encoded service account JSON).
export function getAdminDb(): admin.firestore.Firestore {
  if (_db) return _db;

  let app: admin.app.App;
  try {
    app = admin.app('sejmograf-server');
  } catch {
    const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credJson) throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON is not set');
    const serviceAccount = JSON.parse(Buffer.from(credJson, 'base64').toString('utf8'));
    app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'sejmograf-server');
  }

  _db = admin.firestore(app);
  _db.settings({ databaseId: 'sejmograf-db' });
  return _db;
}
