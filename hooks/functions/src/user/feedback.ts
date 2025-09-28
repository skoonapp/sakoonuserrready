// hooks/functions/src/user/feedback.ts
import * as functions from 'firebase-functions/v1';
import { db, admin } from '../config';

export const submitListenerReview = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to submit a review.');
    }
    const { listenerId, rating, text } = data;
    const userId = context.auth.uid;

    if (!listenerId || typeof listenerId !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'A valid listenerId is required.');
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      throw new functions.https.HttpsError('invalid-argument', 'Rating must be a number between 1 and 5.');
    }
    if (text && typeof text !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Review text must be a string.');
    }

    const listenerRef = db.collection('listeners').doc(listenerId);
    const userRef = db.collection('users').doc(userId);

    try {
      await db.runTransaction(async (transaction) => {
        const listenerDoc = await transaction.get(listenerRef);
        const userDoc = await transaction.get(userRef);

        if (!listenerDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Listener not found.');
        }
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User submitting review not found.');
        }

        const listenerData = listenerDoc.data()!;
        const userData = userDoc.data()!;

        // Simple check to see if the user has a recent session (can be improved)
        // For now, we trust the client to show the modal only after a session.

        const currentRating = listenerData.rating || 0;
        const currentReviewsCount = listenerData.reviewsCount || 0;

        // Calculate new average rating
        const newTotalRating = (currentRating * currentReviewsCount) + rating;
        const newReviewsCount = currentReviewsCount + 1;
        const newAverageRating = parseFloat((newTotalRating / newReviewsCount).toFixed(2));

        // Update listener's main document
        transaction.update(listenerRef, {
          rating: newAverageRating,
          reviewsCount: admin.firestore.FieldValue.increment(1),
        });

        // Add the new review to a subcollection
        const reviewRef = listenerRef.collection('reviews').doc();
        transaction.set(reviewRef, {
          userId: userId,
          userName: userData.name || 'Anonymous User',
          rating: rating,
          text: text || '',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true, message: 'Thank you for your feedback!' };
    } catch (error) {
      functions.logger.error(`Error submitting review for listener ${listenerId} by user ${userId}:`, error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', 'An error occurred while submitting your review.');
    }
  });
