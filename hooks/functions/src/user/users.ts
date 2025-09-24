// functions/src/user/users.ts
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { db } from '../config';

// Example function with proper transaction typing
export const updateUserData = functions
  .region('asia-south1')
  .https
  .onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      // Authentication check
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'User must be authenticated'
        );
      }

      const userId = context.auth.uid;
      const { updateData } = data;

      // Example of using transaction with proper typing
      const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          throw new Error('User document not found');
        }

        const currentData = userDoc.data();
        const newData = { ...currentData, ...updateData, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

        transaction.update(userRef, newData);
        return newData;
      });

      return {
        success: true,
        data: result
      };

    } catch (error) {
      functions.logger.error('Error updating user data:', error);
      throw new functions.https.HttpsError('internal', 'Failed to update user data');
    }
  });

// Update user profile function (as required by index.ts)
export const updateMyProfile = functions
  .region('asia-south1')
  .https
  .onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      // Authentication check
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated', 
          'User must be authenticated'
        );
      }

      const userId = context.auth.uid;
      const { profileData } = data;

      // Input validation
      if (!profileData || typeof profileData !== 'object') {
        throw new functions.https.HttpsError(
          'invalid-argument', 
          'profileData is required and must be an object'
        );
      }

      // Sanitize profile data - only allow specific fields to be updated
      const allowedFields = [
        'displayName', 
        'age', 
        'gender', 
        'bio', 
        'interests',
        'profilePicture',
        'phoneNumber'
      ];

      const sanitizedData: any = {};
      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          sanitizedData[field] = profileData[field];
        }
      }

      // Add metadata
      sanitizedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      sanitizedData.updatedBy = userId;

      // Update user profile using transaction
      const result = await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists) {
          // Create new user document if it doesn't exist
          const newUserData = {
            uid: userId,
            email: context.auth?.token.email || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ...sanitizedData
          };
          transaction.set(userRef, newUserData);
          return newUserData;
        } else {
          // Update existing user document
          transaction.update(userRef, sanitizedData);
          const currentData = userDoc.data();
          return { ...currentData, ...sanitizedData };
        }
      });

      functions.logger.info(`Profile updated successfully for user: ${userId}`);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: result
      };

    } catch (error) {
      functions.logger.error('Error updating user profile:', error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        'internal', 
        'Failed to update profile'
      );
    }
  });

// Get user profile function
export const getUserProfile = functions
  .region('asia-south1')
  .https
  .onCall(async (data: any, context: functions.https.CallableContext) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
      }

      const userId = context.auth.uid;
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
      }

      return {
        success: true,
        data: userDoc.data()
      };

    } catch (error) {
      functions.logger.error('Error getting user profile:', error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'Failed to get user profile');
    }
  });