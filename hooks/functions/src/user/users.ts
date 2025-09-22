import * as functions from "firebase-functions/v1";
import {db} from "../config";

// --- Update User's Own Profile Information ---
// This function ensures a user can only update their own details.
export const updateMyProfile = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
    }

    const {name, city, mobile} = data;
    
    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Name is required and must be valid.");
    }

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "City is required and must be valid.");
    }

    // Optional mobile validation
    if (mobile && (typeof mobile !== 'string' || !/^\d{10}$/.test(mobile.trim()))) {
        throw new functions.https.HttpsError("invalid-argument", "Mobile number must be 10 digits.");
    }

    const userRef = db.collection("users").doc(context.auth.uid);
    
    // Construct update object conditionally
    const updateData: { [key: string]: any } = {
        name: name.trim(),
        city: city.trim(),
        hasSeenWelcome: true, // Ensure welcome screen is not shown again
        lastUpdated: Date.now() // Track when profile was last updated
    };

    if (mobile) {
        updateData.mobile = `+91${mobile.trim()}`;
    }

    try {
      // FIX: Use .set with {merge: true} instead of .update().
      // This is an idempotent operation that will create the document if it's missing
      // (due to a race condition) or update it if it exists, preventing errors.
      await userRef.set(updateData, { merge: true });

      functions.logger.info(`Profile updated for user: ${context.auth.uid}`);
      
      return {
        success: true,
        message: "Profile updated successfully."
      };
    } catch (error) {
      functions.logger.error(`Error updating profile for user ${context.auth.uid}:`, error);
      throw new functions.https.HttpsError("internal", "Error updating profile. Please try again.");
    }
  });