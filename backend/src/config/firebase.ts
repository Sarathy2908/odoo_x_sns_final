import * as admin from 'firebase-admin';
import path from 'path';

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'odoo-final-99107.firebasestorage.app';

// Initialize Firebase Admin with application default credentials or service account
if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (serviceAccountPath) {
        // Resolve relative paths from the project root (backend/)
        const absolutePath = path.resolve(serviceAccountPath);
        const serviceAccount = require(absolutePath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: FIREBASE_STORAGE_BUCKET,
        });
    } else {
        // Use default credentials (works in Cloud environments or with GOOGLE_APPLICATION_CREDENTIALS env var)
        admin.initializeApp({
            storageBucket: FIREBASE_STORAGE_BUCKET,
        });
    }
}

export const storage: admin.storage.Storage = admin.storage();
export const bucket = storage.bucket();

export default admin;
