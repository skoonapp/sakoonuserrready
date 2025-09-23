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

    const auth = context.auth;
    const {name, city, mobile} = data;
   
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "Name is required and must be valid.");
    }
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new functions.https.HttpsError("invalid-argument", "City is required and must be valid.");
    }
    if (mobile && (typeof mobile !== 'string' || !/^\d{10}$/.test(mobile.trim()))) {
        throw new functions.https.HttpsError("invalid-argument", "Mobile number must be 10 digits.");
    }
    
    const userRef = db.collection("users").doc(auth.uid);
   
    try {
      await db.runTransaction(async (transaction) => {
        // --- CRITICAL FIX: Mobile uniqueness check is now INSIDE the transaction ---
        if (mobile && typeof mobile === 'string' && mobile.trim().length === 10) {
            const formattedMobile = `+91${mobile.trim()}`;
            const usersWithMobileQuery = db.collection("users").where('mobile', '==', formattedMobile).limit(1);
            
            // Use transaction.get() for all reads within the transaction.
            const snapshot = await transaction.get(usersWithMobileQuery);

            if (!snapshot.empty) {
                const existingUser = snapshot.docs[0];
                if (existingUser.id !== auth.uid) {
                    functions.logger.warn(`User ${auth.uid} attempted to use mobile ${formattedMobile}, which is already registered to user ${existingUser.id}.`);
                    // This throw will automatically roll back the transaction.
                    throw new functions.https.HttpsError(
                        "already-exists",
                        "This mobile number is already registered. Please sign in with your mobile number to access that account."
                    );
                }
            }
        }
        // --- END OF FIX ---

        const userDoc = await transaction.get(userRef);
        
        const profileData: { [key: string]: any } = {
          name: name.trim(),
          city: city.trim(),
          hasSeenWelcome: true,
          lastUpdated: Date.now(),
          ...(mobile && { mobile: `+91${mobile.trim()}` })
        };
       
        if (!userDoc.exists) {
          functions.logger.warn(`User document for ${auth.uid} not found during profile update. Creating it now.`);
         
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
          transaction.update(userRef, profileData);
        }
      });
      
      functions.logger.info(`Profile updated for user: ${auth.uid}`);
     
      return {
        success: true,
        message: "Profile updated successfully."
      };
    } catch (error: any) {
      if (error.code === 'already-exists') {
          throw error;
      }
      functions.logger.error(`Error in transaction for user ${auth.uid}:`, error);
      throw new functions.https.HttpsError("internal", "An internal error occurred while updating your profile.");
    }
  });