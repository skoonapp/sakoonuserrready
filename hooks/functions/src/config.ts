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

/**
 * Get ZegoCloud App ID from Firebase Functions config or environment variables
 */
export function getZegoAppId(): number {
  // First try Firebase Functions config
  const config = functions.config();
  let appId = config.zego?.app_id;
  
  // Fallback to environment variable
  if (!appId) {
    appId = process.env.ZEGO_APP_ID;
  }
  
  if (!appId) {
    throw new Error('ZegoCloud App ID not configured. Please set it using Firebase Functions config or ZEGO_APP_ID environment variable');
  }
  
  return parseInt(appId, 10);
}

/**
 * Get ZegoCloud Server Secret from Firebase Functions config or environment variables
 */
export function getZegoServerSecret(): string {
  // First try Firebase Functions config
  const config = functions.config();
  let serverSecret = config.zego?.server_secret;
  
  // Fallback to environment variable
  if (!serverSecret) {
    serverSecret = process.env.ZEGO_SERVER_SECRET;
  }
  
  if (!serverSecret) {
    throw new Error('ZegoCloud Server Secret not configured. Please set it using Firebase Functions config or ZEGO_SERVER_SECRET environment variable');
  }
  
  return serverSecret;
}

/**
 * Get Cashfree Client ID from Firebase Functions config or environment variables
 */
export function getCashfreeClientId(): string {
  const config = functions.config();
  let clientId = config.cashfree?.client_id;
  
  // Fallback to environment variable
  if (!clientId) {
    clientId = process.env.CASHFREE_CLIENT_ID;
  }
  
  if (!clientId) {
    throw new Error('Cashfree Client ID not configured. Please set it using Firebase Functions config or CASHFREE_CLIENT_ID environment variable');
  }
  
  return clientId;
}

/**
 * Get Cashfree Client Secret from Firebase Functions config or environment variables
 */
export function getCashfreeClientSecret(): string {
  const config = functions.config();
  let clientSecret = config.cashfree?.client_secret;
  
  // Fallback to environment variable
  if (!clientSecret) {
    clientSecret = process.env.CASHFREE_CLIENT_SECRET;
  }
  
  if (!clientSecret) {
    throw new Error('Cashfree Client Secret not configured. Please set it using Firebase Functions config or CASHFREE_CLIENT_SECRET environment variable');
  }
  
  return clientSecret;
}

/**
 * Get Cashfree Webhook Secret from Firebase Functions config or environment variables
 */
export function getCashfreeWebhookSecret(): string {
  const config = functions.config();
  let webhookSecret = config.cashfree?.webhook_secret;
  
  // Fallback to environment variable
  if (!webhookSecret) {
    webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
  }
  
  if (!webhookSecret) {
    throw new Error('Cashfree Webhook Secret not configured. Please set it using Firebase Functions config or CASHFREE_WEBHOOK_SECRET environment variable');
  }
  
  return webhookSecret;
}

/**
 * Initialize Cashfree SDK with credentials
 */
export function initializeCashfree(): void {
  try {
    const clientId = getCashfreeClientId();
    const clientSecret = getCashfreeClientSecret();
    
    // Determine environment (sandbox for development, production for live)
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    
    // Note: Check Cashfree SDK documentation for correct property names
    // The properties might be different in newer versions
    (Cashfree as any).XClientId = clientId;
    (Cashfree as any).XClientSecret = clientSecret;
    (Cashfree as any).XEnvironment = environment;
    
    functions.logger.info(`Cashfree initialized successfully in ${environment} mode`);
  } catch (error) {
    functions.logger.error('Failed to initialize Cashfree:', error);
    throw error;
  }
}

// Optional: Add other configuration getters as needed
export function getProjectConfig() {
  return {
    zegoAppId: getZegoAppId(),
    zegoServerSecret: getZegoServerSecret(),
  };
}