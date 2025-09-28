// hooks/functions/src/user/callRequest.ts
import * as functions from 'firebase-functions/v1';
import { ZegoServerAssistant } from 'zego-express-engine-serverless';
import { ZEGO_APP_ID, ZEGO_SERVER_SECRET } from '../config'; // Import from central config

/**
 * Production Firebase Callable Function - ZegoCloud Token Generator
 */
export const generateZegoToken = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    
    // Step 1: Authentication Check
    if (!context.auth || !context.auth.uid) {
      functions.logger.error('Authentication failed - no user context');
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'User must be authenticated to generate a token.'
      );
    }
    const userId = context.auth.uid;
    functions.logger.info(`Token request from user: ${userId}`);

    // Step 2: Validate roomId from client data
    const { roomId } = data;
    if (typeof roomId !== 'string' || !roomId.trim()) {
      functions.logger.error('Invalid roomId provided', { dataReceived: data });
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'A valid roomId is required and must be a non-empty string.'
      );
    }

    // Step 3: Server Configuration Check
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      functions.logger.error('Zego service is not configured correctly on the server.');
      throw new functions.https.HttpsError(
        'failed-precondition', 
        'Service configuration error on the server. Please contact support.'
      );
    }

    // Step 4: Generate Token using the official Zego library
    try {
      const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
      const payload = ''; // No specific payload is needed for this use case

      functions.logger.info(`Generating Zego token for user: ${userId}, room: ${roomId}`);
      
      // Use the official library to generate a token
      const token = ZegoServerAssistant.generateToken04(
          ZEGO_APP_ID, 
          userId, 
          ZEGO_SERVER_SECRET, 
          effectiveTimeInSeconds, 
          payload
      );
      
      functions.logger.info(`Zego token generated successfully for user: ${userId}`);
      
      return { 
        token,
        userId,
        roomId,
      };
      
    } catch (error: any) {
      functions.logger.error(`Zego token generation failed for user ${userId}:`, {
        error: error.message,
        stack: error.stack
      });
      
      throw new functions.https.HttpsError(
        'internal', 
        'Failed to generate the call token due to a library error.',
        error.message
      );
    }
  });
