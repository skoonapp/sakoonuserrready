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
   
    try {
      // Use a transaction for a safe read-modify-write operation.
      // This robustly handles the case where the user document might not exist yet
      // due to a race condition between client-side creation and this function call.
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const profileData = {
          name: name.trim(),
          city: city.trim(),
          hasSeenWelcome: true,
          lastUpdated: Date.now(),
          mobile: mobile ? `+91${mobile.trim()}` : (userDoc.data()?.mobile || ''),
        };
       
        if (!userDoc.exists) {
          // This case handles the race condition. If the client-side document creation
          // hasn't completed, we create the full user document here to avoid partial data.
          functions.logger.warn(`User document for ${auth.uid} not found during profile update. Creating it now.`);
         
          const newFullUser = {
            uid: auth.uid,
            email: auth.token.email || null,
            ...profileData, // Includes name, city, mobile, hasSeenWelcome, lastUpdated
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
    } catch (error) {
      functions.logger.error(`Error updating profile for user ${auth.uid}:`, error);
      throw new functions.https.HttpsError("internal", "Error updating profile. Please try again.");
    }
  });