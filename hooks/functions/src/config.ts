import * as admin from "firebase-admin";
// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
import { Cashfree } from "cashfree-pg";

admin.initializeApp();

export const db = admin.firestore();
export { admin };

// महत्वपूर्ण: इन्हें अपनी फायरबेस एनवायरनमेंट कॉन्फ़िगरेशन में सेट करें
// firebase functions:config:set cashfree.client_id="YOUR_CLIENT_ID"
// firebase functions:config:set cashfree.client_secret="YOUR_CLIENT_SECRET"
// firebase functions:config:set zego.app_id="YOUR_ZEGO_APP_ID"
// firebase functions:config:set zego.server_secret="YOUR_ZEGO_SERVER_SECRET"

// FIX: Correctly configure Cashfree SDK v3. Using `as any` to bypass potential
// issues with outdated or incorrect TypeScript type definitions in the environment.
// This sets the necessary static properties for the SDK to function at runtime.
(Cashfree as any).XClientId = functions.config().cashfree.client_id;
(Cashfree as any).XClientSecret = functions.config().cashfree.client_secret;
(Cashfree as any).XApiVersion = "2022-09-01";
// FIX: Use string literal for environment to avoid type errors. Valid values are "PRODUCTION" or "SANDBOX".
(Cashfree as any).XEnvironment = "PRODUCTION";

export const cashfree = Cashfree;

export const zegoAppId = Number(functions.config().zego.app_id);
export const zegoServerSecret = functions.config().zego.server_secret;