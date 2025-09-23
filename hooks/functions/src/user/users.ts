import * as functions from "firebase-functions/v1";
import {db} from "../config";
import { FREE_MESSAGES_ON_SIGNUP } from "./constants";

// --- Update User's Own Profile Information ---
// This function ensures a user can only update their own details.
export const updateMyProfile = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
    }

    // Store auth in a constant to help TypeScript understand it's not null
    const auth = context.auth;
    
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
    
    const userRef = db.collection("users").doc(auth.uid);

    // --- NEW: Uniqueness Check for Mobile Number ---
    // If a mobile number is provided, check if it's already in use by another account.
    if (mobile && typeof mobile === 'string' && mobile.trim().length === 10) {
        const formattedMobile = `+91${mobile.trim()}`;
        const usersWithMobileQuery = db.collection("users").where('mobile', '==', formattedMobile).limit(1);
        
        const snapshot = await usersWithMobileQuery.get();

        if (!snapshot.empty) {
            const existingUser = snapshot.docs[0];
            // If a user document exists with this mobile number, but it has a different UID, then it's a duplicate.
            if (existingUser.id !== auth.uid) {
                functions.logger.warn(`User ${auth.uid} attempted to use mobile ${formattedMobile}, which is already registered to user ${existingUser.id}.`);
                // Throw a specific error code that the client can handle.
                throw new functions.https.HttpsError(
                    "already-exists",
                    "This mobile number is already registered. Please sign in with your mobile number to access that account."
                );
            }
        }
    }
    // --- END: Uniqueness Check ---
   
    try {
      // Use a transaction for a safe read-modify-write operation.
      // This robustly handles the case where the user document might not exist yet
      // due to a race condition between client-side creation and this function call.
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        // Prepare the base data for the update or creation.
        const profileData: { [key: string]: any } = {
          name: name.trim(),
          city: city.trim(),
          hasSeenWelcome: true, // Mark onboarding as complete.
          lastUpdated: Date.now(),
          // Conditionally add the mobile number if provided.
          ...(mobile && { mobile: `+91${mobile.trim()}` })
        };
       
        if (!userDoc.exists) {
          // This case handles the race condition. If the client-side document creation
          // hasn't completed, we create the full user document here to avoid partial data.
          functions.logger.warn(`User document for ${auth.uid} not found during profile update. Creating it now.`);
         
          // FIX: Explicitly construct the new user object to ensure all properties, including 'mobile', are defined, resolving the TypeScript error.
          const newFullUser = {
            uid: auth.uid,
            email: auth.token.email || null,
            name: name.trim(),
            city: city.trim(),
            hasSeenWelcome: true,
            lastUpdated: Date.now(),
            mobile: mobile ? `+91${mobile.trim()}` : '',
            favoriteListeners: [],
            tokens: 0,
            activePlans: [],
            freeMessagesRemaining: FREE_MESSAGES_ON_SIGNUP,
            createdAt: Date.now(),
          };
          transaction.set(userRef, newFullUser);
        } else {
          // The normal case: the document exists, so we just update it.
          transaction.update(userRef, profileData);
        }
      });
      
      functions.logger.info(`Profile updated for user: ${auth.uid}`);
     
      return {
        success: true,
        message: "Profile updated successfully."
      };
    } catch (error: any) {
      // Re-throw the specific "already-exists" error so the client can catch it.
      if (error.code === 'already-exists') {
          throw error;
      }
      functions.logger.error(`Error in transaction for user ${auth.uid}:`, error);
      throw new functions.https.HttpsError("internal", "An internal error occurred while updating your profile.");
    }
  });