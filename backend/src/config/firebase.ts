import * as admin from 'firebase-admin';

const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'odoo-final-99107.firebasestorage.app';

if (!admin.apps.length) {
    const base64Creds = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (base64Creds) {
        const serviceAccount = JSON.parse(Buffer.from(base64Creds, 'base64').toString('utf-8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: FIREBASE_STORAGE_BUCKET,
        });
    } else {
        admin.initializeApp({
            storageBucket: FIREBASE_STORAGE_BUCKET,
        });
    }
}

export const storage: admin.storage.Storage = admin.storage();
export const bucket = storage.bucket();

export default admin;
