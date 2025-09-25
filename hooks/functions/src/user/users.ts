// functions/src/user/users.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { db } from '../config';

/**
 * Updates the user's profile with information from the welcome/onboarding screen.
 * This is a critical step for new users to complete their profiles.
 */
export const updateMyProfile = functions
  .region('asia-south1')
  .https
  .onCall(async (data: { name: string, city: string, mobile?: string }, context) => {
    // 1. Authentication Check: Ensure the user is logged in.
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'User must be authenticated to update their profile.'
      );
    }
    const userId = context.auth.uid;

    // 2. Input Validation: Check if the received data is valid and clean.
    const { name, city, mobile } = data;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid name is required.');
    }
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid city is required.');
    }
    // Mobile is optional, but if provided, it must be a valid 10-digit number.
    if (mobile && (typeof mobile !== 'string' || !/^\d{10}$/.test(mobile.trim()))) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid 10-digit mobile number is required.');
    }

    const userRef = db.collection('users').doc(userId);

    // 3. (NEW) Mobile Uniqueness Check: If a mobile number is provided, ensure it's not already in use by another user.
    if (mobile) {
        const trimmedMobile = mobile.trim();
        const mobileQuery = await db.collection('users').where('mobile', '==', trimmedMobile).limit(1).get();
        
        // If the query finds a user AND that user's ID is different from the current user's ID, then the number is taken.
        if (!mobileQuery.empty && mobileQuery.docs[0].id !== userId) {
            throw new functions.https.HttpsError(
                'already-exists',
                'This mobile number is already linked to another account. Please use a different one.'
            );
        }
    }

    // 4. Prepare Data Payload for Firestore
    const updatePayload: { [key: string]: any } = {
      name: name.trim(),
      city: city.trim(),
      hasSeenWelcome: true, // This is crucial to mark the onboarding as complete.
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (mobile) {
      updatePayload.mobile = mobile.trim();
    }

    // 5. Update Firestore Document
    try {
      // Use 'set' with merge:true to make the operation more robust.
      // It will update the document if it exists, or create it if it doesn't,
      // preventing errors from potential race conditions on user creation.
      await userRef.set(updatePayload, { merge: true });
      functions.logger.info(`Profile completed and updated for user: ${userId}`);
      return {
        success: true,
        message: 'Profile updated successfully!',
      };
    } catch (error) {
      functions.logger.error('Error updating user profile in Firestore:', error, { userId });
      throw new functions.https.HttpsError('internal', 'Failed to save your information. Please try again.');
    }
  });
