// functions/src/user/users.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { db } from '../config';

/**
 * Updates the user's profile via a Callable Function.
 * This is a critical step for new users to complete their profiles.
 */
export const updateMyProfile = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    // 1. Authentication Check: Callable functions automatically verify the token.
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;

    try {
        // 2. Input Validation: Data is the first argument, already parsed.
        const { name, city, mobile } = data;

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            throw new functions.https.HttpsError('invalid-argument', 'A valid name is required.');
        }
        if (!city || typeof city !== 'string' || city.trim().length < 2) {
            throw new functions.https.HttpsError('invalid-argument', 'A valid city is required.');
        }

        let normalizedMobile: string | undefined = undefined;

        // 3. Mobile Number Normalization & Validation
        if (mobile && typeof mobile === 'string' && mobile.trim()) {
            const digitsOnly = mobile.trim().replace(/\D/g, '');
            if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
                normalizedMobile = `+${digitsOnly}`;
            } else if (digitsOnly.length === 10) {
                normalizedMobile = `+91${digitsOnly}`;
            } else {
                throw new functions.https.HttpsError('invalid-argument', 'Please enter a valid 10-digit Indian mobile number.');
            }
        }

        const userRef = db.collection('users').doc(userId);

        // Explicitly check if the user document exists before updating.
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            functions.logger.error(`Attempted to update a non-existent user document for UID: ${userId}`);
            throw new functions.https.HttpsError('not-found', 'User profile could not be found to update.');
        }


        // 4. Mobile Uniqueness Check
        if (normalizedMobile) {
            const mobileQuery = await db.collection('users').where('mobile', '==', normalizedMobile).limit(1).get();
            if (!mobileQuery.empty && mobileQuery.docs[0].id !== userId) {
                throw new functions.https.HttpsError('already-exists', 'This mobile number is already linked to another account.');
            }
        }

        // 5. Prepare Data Payload
        const updatePayload: { [key: string]: any } = {
            name: name.trim(),
            city: city.trim(),
            hasSeenWelcome: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (normalizedMobile) {
            updatePayload.mobile = normalizedMobile;
        }

        // 6. Update Firestore
        // Switched from set({merge: true}) to update() as we've confirmed the document exists.
        // This is a more explicit operation for updating an existing document.
        await userRef.update(updatePayload);
        
        // 7. Return success response to the client.
        return { success: true, message: 'Profile updated successfully!' };

    } catch (error: any) {
        functions.logger.error(`Error updating profile for user ${userId}:`, error);
        // Re-throw HttpsError so the client gets it, or wrap other errors.
        if (error instanceof functions.https.HttpsError) {
            throw error;
        } else {
            throw new functions.https.HttpsError('internal', 'An internal server error occurred while updating the profile.');
        }
    }
  });