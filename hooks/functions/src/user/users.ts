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

    // 2. Input Validation
    const { name, city } = data;
    const { mobile } = data;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid name is required.');
    }
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid city is required.');
    }

    let normalizedMobile: string | undefined = undefined;

    // 3. Mobile Number Normalization & Validation
    if (mobile && typeof mobile === 'string' && mobile.trim()) {
        // Remove all non-digit characters to get the raw number
        const digitsOnly = mobile.trim().replace(/\D/g, '');

        // Standardize to E.164 format for India (+91XXXXXXXXXX)
        if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
            // Handles numbers like 919876543210
            normalizedMobile = `+${digitsOnly}`;
        } else if (digitsOnly.length === 10) {
            // Handles numbers like 9876543210
            normalizedMobile = `+91${digitsOnly}`;
        } else {
            // If it doesn't match a valid format, throw an error.
            throw new functions.https.HttpsError('invalid-argument', 'Please enter a valid 10-digit Indian mobile number.');
        }
    }

    const userRef = db.collection('users').doc(userId);

    // 4. Mobile Uniqueness Check (using normalized number)
    if (normalizedMobile) {
        const mobileQuery = await db.collection('users').where('mobile', '==', normalizedMobile).limit(1).get();
        if (!mobileQuery.empty && mobileQuery.docs[0].id !== userId) {
            throw new functions.https.HttpsError(
                'already-exists',
                'This mobile number is already linked to another account.'
            );
        }
    }

    // 5. Prepare Data Payload for Firestore
    const updatePayload: { [key: string]: any } = {
      name: name.trim(),
      city: city.trim(),
      hasSeenWelcome: true, // Mark onboarding as complete.
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (normalizedMobile) {
      updatePayload.mobile = normalizedMobile;
    }

    // 6. Update Firestore Document
    try {
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
