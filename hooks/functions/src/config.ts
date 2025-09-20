import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Cashfree } from "cashfree-pg";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firestore database instance
export const db = admin.firestore();

// FIX: Export admin module for use in other functions.
export { admin };

// FIX: Initialize the Cashfree v4 SDK by creating an instance with the correct property names.
// The previous property names (env, clientId, clientSecret) were incorrect.
const cashfree = new Cashfree({
    // Hardcoding to SANDBOX for testing purposes, as requested.
    xEnvironment: "SANDBOX",
    xClientId: functions.config().cashfree.client_id,
    xClientSecret: functions.config().cashfree.client_secret,
} as any);

// Export the configured instance for use in other functions.
export { cashfree };

// Export secrets from Firebase config for use in other files.
export const CASHFREE_WEBHOOK_SECRET = functions.config().cashfree.webhook_secret;
export const ZEGO_APP_ID = parseInt(functions.config().zego.appid, 10);
export const ZEGO_SERVER_SECRET = functions.config().zego.secret;

// Gemini AI API Key
export const GEMINI_API_KEY = functions.config().gemini.apikey;