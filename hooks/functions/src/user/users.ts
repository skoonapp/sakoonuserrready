import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {db} from "../config";
import { FREE_MESSAGES_ON_SIGNUP } from "./constants";

// --- Update User's Own Profile Information ---
// This function ensures a user can only update their own details.
export const updateMyProfile = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    
    functions.logger.info('updateMyProfile called', { data, authPresent: !!context.auth });
    
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
      }

      const auth = context.auth;
      const {name, city, mobile} = data || {};
     
      // Input validation
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Name is required and must be valid.");
      }
      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "City is required and must be valid.");
      }
      if (mobile && (typeof mobile !== 'string' || !/^\d{10}$/.test(mobile.trim()))) {
          throw new functions.https.HttpsError("invalid-argument", "Mobile number must be 10 digits.");
      }
      
      // FIX: Moved mobile uniqueness check OUTSIDE the transaction.
      // Firestore transactions do not allow collection queries like .where().get().
      if (mobile && typeof mobile === 'string' && mobile.trim().length === 10) {
          const formattedMobile = `+91${mobile.trim()}`;
          const usersWithMobileQuery = db.collection("users").where('mobile', '==', formattedMobile).limit(1);
          const snapshot = await usersWithMobileQuery.get();

          if (!snapshot.empty) {
              const existingUser = snapshot.docs[0];
              if (existingUser.id !== auth.uid) {
                  functions.logger.warn(`Mobile ${formattedMobile} already registered to user ${existingUser.id}`);
                  throw new functions.https.HttpsError(
                      "already-exists",
                      "This mobile number is already registered. Please sign in with your mobile number to access that account."
                  );
              }
          }
      }
      
      const userRef = db.collection("users").doc(auth.uid);
     
      // Use transaction for the atomic read/write operation
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        const profileData: { [key: string]: any } = {
          name: name.trim(),
          city: city.trim(),
          hasSeenWelcome: true,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          ...(mobile && { mobile: `+91${mobile.trim()}` })
        };
       
        if (!userDoc.exists) {
          functions.logger.info(`Creating new user document for ${auth.uid}`);
         
          const newFullUser = {
            uid: auth.uid,
            email: auth.token?.email || null,
            name: name.trim(),
            city: city.trim(),
            hasSeenWelcome: true,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            mobile: mobile ? `+91${mobile.trim()}` : '',
            favoriteListeners: [],
            tokens: 0,
            activePlans: [],
            freeMessagesRemaining: FREE_MESSAGES_ON_SIGNUP || 5,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          transaction.set(userRef, newFullUser);
        } else {
          transaction.update(userRef, profileData);
        }
        
        return {
          success: true,
          message: "Profile updated successfully."
        };
      });
      
      functions.logger.info(`Profile updated successfully for user: ${auth.uid}`);
      return result;
      
    } catch (error: any) {
      functions.logger.error(`Error in updateMyProfile for user ${context.auth?.uid}:`, {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Re-throw specific Firebase Function errors
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      // Convert other errors to HttpsError
      throw new functions.https.HttpsError("internal", `Profile update failed: ${error.message}`);
    }
  });