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

// --- Configuration using functions.config() ---
// This reads the configuration you set with `firebase functions:config:set`
const config = functions.config();

// Zego configuration - Reads from the 'zegocloud' section in your config
// It now correctly looks for 'zegocloud' and 'appid'/'secret'
export const ZEGO_APP_ID = parseInt(config.zegocloud?.appid || '0', 10);
export const ZEGO_SERVER_SECRET = config.zegocloud?.secret || '';

// Cashfree configuration - Reads from the 'cashfree' section
const CASHFREE_CLIENT_ID = config.cashfree?.client_id || '';
const CASHFREE_CLIENT_SECRET = config.cashfree?.client_secret || '';
const CASHFREE_WEBHOOK_SECRET = config.cashfree?.webhook_secret || '';

// --- Getter function for the webhook secret ---
export function getCashfreeWebhookSecret(): string {
    if (!CASHFREE_WEBHOOK_SECRET) {
        functions.logger.warn('Cashfree webhook secret is not set in config.');
    }
    return CASHFREE_WEBHOOK_SECRET;
}

// --- Validation ---
if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
  functions.logger.error('Zego App ID or Server Secret is not configured. Check your `zegocloud.appid` and `zegocloud.secret` config.');
}
if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET || !CASHFREE_WEBHOOK_SECRET) {
  functions.logger.error('Cashfree environment variables are not fully configured. Check your `cashfree` config.');
}

/**
 * Initialize Cashfree SDK with credentials
 */
export function initializeCashfree(): void {
  try {
    // Correctly read the environment setting from your config
    const environment = config.cashfree?.env === 'TEST' ? "SANDBOX" : "PRODUCTION";
    
    (Cashfree as any).XClientId = CASHFREE_CLIENT_ID;
    (Cashfree as any).XClientSecret = CASHFREE_CLIENT_SECRET;
    (Cashfree as any).XEnvironment = environment;
    
    functions.logger.info(`Cashfree initialized successfully in ${environment} mode`);
  } catch (error) {
    functions.logger.error('Failed to initialize Cashfree:', error);
    throw error;
  }
}
