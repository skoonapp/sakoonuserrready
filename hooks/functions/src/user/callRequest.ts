// functions/src/user/callRequest.ts
import * as functions from 'firebase-functions/v1';
import * as crypto from 'crypto';

// Configuration - Environment variables से लेंगे
const ZEGO_APP_ID = parseInt(functions.config().zegocloud?.appid || "0", 10);
const ZEGO_SERVER_SECRET = functions.config().zegocloud?.secret || "";

/**
 * Generates a Zego Cloud Kit Token for production use
 */
function generateKitToken(appId: number, serverSecret: string, userId: string, roomId: string): string {
    const effectiveTimeInSeconds = 3600; // 1 hour validity
    const createTime = Math.floor(Date.now() / 1000);
    const expireTime = createTime + effectiveTimeInSeconds;
    
    const payloadObject = {
        room_id: roomId,
        privilege: {
            1: 1, // login room
            2: 1, // publish stream
        },
        stream_id_list: null,
    };

    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce: crypto.randomBytes(8).toString('hex'),
        ctime: createTime,
        expire: expireTime,
        payload: JSON.stringify(payloadObject)
    };

    const plainText = JSON.stringify(tokenInfo);
    
    if (serverSecret.length !== 32) {
        throw new Error("Zego server secret must be 32 characters long.");
    }
    
    const key = Buffer.from(serverSecret, 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    cipher.setAutoPadding(true);
    
    const encryptedBuffer = Buffer.concat([cipher.update(Buffer.from(plainText)), cipher.final()]);
    
    const tokenBuffer = Buffer.alloc(8 + 2 + 16 + 2 + encryptedBuffer.length);
    
    let offset = 0;
    
    tokenBuffer.writeBigInt64BE(BigInt(expireTime), offset);
    offset += 8;
    
    tokenBuffer.writeUInt16BE(iv.length, offset);
    offset += 2;
    
    iv.copy(tokenBuffer, offset);
    offset += iv.length;
    
    tokenBuffer.writeUInt16BE(encryptedBuffer.length, offset);
    offset += 2;
    
    encryptedBuffer.copy(tokenBuffer, offset);
    
    return '04' + tokenBuffer.toString('base64');
}

/**
 * Production Firebase Callable Function - ZegoCloud Token Generator
 */
export const generateZegoToken = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    
    // Step 1: Authentication and User ID Check
    if (!context.auth || !context.auth.uid) {
      functions.logger.error('Authentication failed - no user context');
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'User must be authenticated to generate token'
      );
    }
    // SECURELY get userId from context, not from client data
    const userId = context.auth.uid;
    functions.logger.info(`Token request from user: ${userId}`);

    // Step 2: Extract and validate roomId from client data
    if (!data || typeof data.roomId !== 'string' || data.roomId.trim().length === 0) {
      functions.logger.error('Invalid roomId provided', { dataReceived: data });
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'roomId is required and must be a non-empty string'
      );
    }
    const roomId = data.roomId.trim();

    // Step 3: Environment Configuration Check
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET || ZEGO_SERVER_SECRET.length !== 32) {
      functions.logger.error('Zego service is not configured correctly on the server.');
      throw new functions.https.HttpsError(
        'failed-precondition', 
        'Service configuration error. Please contact support.'
      );
    }

    // Step 4: Generate Token
    try {
      functions.logger.info(`Generating token for user: ${userId}, room: ${roomId}`);
      
      const token = generateKitToken(ZEGO_APP_ID, ZEGO_SERVER_SECRET, userId, roomId);
      
      functions.logger.info(`Token generated successfully for user: ${userId}`);
      
      return { 
        token,
        userId,
        roomId,
        expires: Date.now() + (3600 * 1000) // 1 hour from now
      };
      
    } catch (error: any) {
      functions.logger.error(`Token generation failed for user ${userId}:`, {
        error: error.message,
        stack: error.stack
      });
      
      throw new functions.https.HttpsError(
        'internal', 
        'Failed to generate call token',
        error.message
      );
    }
  });