import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Import Cashfree and CFEnvironment correctly for v4+ SDK
import { Cashfree, CFEnvironment } from "cashfree-pg";

// Initialize Firebase Admin SDK, but only if it hasn't been initialized yet.
if (!admin.apps.length) {
    admin.initializeApp();
}
export const db = admin.firestore();
export { admin };

// --- LAZY INITIALIZATION FOR SERVICES ---

let cashfreeInstance: any | null = null;

/**
 * Lazily initializes and returns the Cashfree client instance.
 * This avoids calling functions.config() at the module's top level and
 * uses the modern approach for the cashfree-pg SDK.
 */
export const getCashfreeClient = () => {
    // If already initialized, return it.
    if (cashfreeInstance) {
        return cashfreeInstance;
    }
    
    // If not initialized, try to initialize it.
    try {
        const cfg = functions.config().cashfree;
        if (!cfg || !cfg.environment || !cfg.client_id || !cfg.client_secret) {
            throw new Error("Cashfree configuration is missing or incomplete in Firebase function config.");
        }

        // The env property for the SDK instance expects CFEnvironment.PRODUCTION or CFEnvironment.SANDBOX
        const env = cfg.environment.toLowerCase() === 'production' 
            ? CFEnvironment.PRODUCTION 
            : CFEnvironment.SANDBOX;

        // Initialize Cashfree using the correct approach with CFEnvironment
        cashfreeInstance = new Cashfree(env, cfg.client_id, cfg.client_secret);

        functions.logger.info("Cashfree SDK instance initialized successfully.");
        return cashfreeInstance;
    } catch (e: any) {
        functions.logger.error("FATAL: Failed to initialize Cashfree SDK.", e);
        throw new functions.https.HttpsError('internal', `Payment service is not configured: ${e.message}`);
    }
};

// --- LAZY GETTERS FOR SECRETS ---

export const getCashfreeWebhookSecret = (): string => {
    return functions.config().cashfree?.webhook_secret ?? "";
};

export const getZegoAppId = (): number => {
    return parseInt(functions.config().zego?.appid ?? "0", 10);
};

export const getZegoServerSecret = (): string => {
    return functions.config().zego?.secret ?? "";
};

export const getGeminiApiKey = (): string => {
    return functions.config().gemini?.apikey ?? "";
};