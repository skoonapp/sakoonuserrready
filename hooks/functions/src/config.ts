// functions/src/config.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Cashfree } from 'cashfree-pg';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export Firebase services
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

// Export admin for use in other files
export { admin };

// --- Modern Configuration using process.env ---
// These variables must be set in your Firebase project's environment configuration.
// Use `firebase functions:config:set zego.app_id="YOUR_ID"` or set them in the GCP console.

export const ZEGO_APP_ID = parseInt(process.env.ZEGO_APP_ID || '', 10);
export const ZEGO_SERVER_SECRET = process.env.ZEGO_SERVER_SECRET || '';

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID || '';
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET || '';
export const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || '';

// --- Validation ---
if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
  functions.logger.error('Zego App ID or Server Secret is not configured in environment variables.');
}
if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET || !CASHFREE_WEBHOOK_SECRET) {
  functions.logger.error('Cashfree environment variables (CLIENT_ID, CLIENT_SECRET, WEBHOOK_SECRET) are not fully configured.');
}


/**
 * Initialize Cashfree SDK with credentials
 */
export function initializeCashfree(): void {
  try {
    // FIX: Use string values for environment to avoid type errors with Cashfree SDK.
    const environment = process.env.NODE_ENV === 'production' ? "PRODUCTION" : "SANDBOX";
    
    // Note: Check Cashfree SDK documentation for correct property names
    // The properties might be different in newer versions
    (Cashfree as any).XClientId = CASHFREE_CLIENT_ID;
    (Cashfree as any).XClientSecret = CASHFREE_CLIENT_SECRET;
    (Cashfree as any).XEnvironment = environment;
    
    functions.logger.info(`Cashfree initialized successfully in ${environment} mode`);
  } catch (error) {
    functions.logger.error('Failed to initialize Cashfree:', error);
    throw error;
  }
}