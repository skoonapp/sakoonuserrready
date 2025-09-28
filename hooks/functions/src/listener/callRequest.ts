// hooks/functions/src/listener/callRequest.ts
import * as functions from 'firebase-functions/v1';
import { ZegoServerAssistant } from 'zego-express-engine-serverless';
import { db, ZEGO_APP_ID, ZEGO_SERVER_SECRET } from '../config';

/**
 * Generates a Zego token specifically for authenticated listeners.
 */
export const generateTokenForListener = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to generate a token.');
    }
    const listenerId = context.auth.uid;
    functions.logger.info(`Token request from listener: ${listenerId}`);

    // 2. Authorization Check: Verify the user is an active listener
    try {
      const listenerDoc = await db.collection('listeners').doc(listenerId).get();
      // Also check the user document for a listener role for robustness
      const userDoc = await db.collection('users').doc(listenerId).get();

      if (!listenerDoc.exists && userDoc.data()?.role !== 'listener') {
         functions.logger.warn(`Authorization failed for UID: ${listenerId}. Not a listener.`);
         throw new functions.https.HttpsError('permission-denied', 'Only authorized listeners can perform this action.');
      }
    } catch (error) {
        functions.logger.error(`Authorization check failed for listener ${listenerId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to verify listener status.');
    }

    // 3. Validate roomId from client data
    const { roomId } = data;
    if (typeof roomId !== 'string' || !roomId.trim()) {
      functions.logger.error('Invalid roomId provided for listener token', { dataReceived: data });
      throw new functions.https.HttpsError('invalid-argument', 'A valid roomId is required.');
    }

    // 4. Server Configuration Check
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      functions.logger.error('Zego service is not configured correctly on the server.');
      throw new functions.https.HttpsError('failed-precondition', 'Service configuration error on the server.');
    }

    // 5. Generate Token using the official Zego library
    try {
      const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
      const payload = '';

      const token = ZegoServerAssistant.generateToken04(
          ZEGO_APP_ID,
          listenerId,
          ZEGO_SERVER_SECRET,
          effectiveTimeInSeconds,
          payload
      );
      
      functions.logger.info(`Zego token generated successfully for listener: ${listenerId}`);
      
      return { token };
      
    } catch (error: any) {
      functions.logger.error(`Zego token generation failed for listener ${listenerId}:`, {
        error: error.message,
      });
      throw new functions.https.HttpsError('internal', 'Failed to generate the call token.');
    }
  });
