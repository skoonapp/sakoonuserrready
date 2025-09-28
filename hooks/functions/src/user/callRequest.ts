// hooks/functions/src/user/callRequest.ts
import * as functions from 'firebase-functions/v1';
import * as crypto from 'crypto';
import { ZEGO_APP_ID, ZEGO_SERVER_SECRET } from '../config';

/**
 * Generates a Zego Cloud Kit Token. This logic is based on Zego's official token generation examples.
 *
 * @param {number} appId Your Zego App ID.
 * @param {string} serverSecret Your Zego Server Secret.
 * @param {string} userId The user's ID for whom the token is generated.
 * @param {string} roomId The room ID the user is joining.
 * @returns {string} The generated Kit Token.
 */
function generateKitToken(appId: number, serverSecret: string, userId: string, roomId: string): string {
    const effectiveTimeInSeconds = 3600; // Token is valid for 1 hour
    const createTime = Math.floor(Date.now() / 1000);
    const expireTime = createTime + effectiveTimeInSeconds;
    
    // FIX: The token payload now includes the room_id and privileges for joining and publishing streams,
    // which is a more secure and standard way to generate Zego tokens.
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
    
    // The server secret must be a 32-byte string.
    if (serverSecret.length !== 32) {
        throw new Error("Zego server secret must be 32 characters long.");
    }
    
    const key = Buffer.from(serverSecret, 'utf8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    cipher.setAutoPadding(true);
    
    const encryptedBuffer = Buffer.concat([cipher.update(Buffer.from(plainText)), cipher.final()]);

    // The final token buffer has a specific structure:
    // 8 bytes for expire time (big-endian)
    // 2 bytes for IV length (big-endian)
    // IV bytes (16 bytes)
    // 2 bytes for encrypted text length (big-endian)
    // Encrypted text bytes
    
    // Allocate buffer with the total required size
    const tokenBuffer = Buffer.alloc(8 + 2 + 16 + 2 + encryptedBuffer.length);
    
    let offset = 0;
    
    // Write expire time (64-bit BigInt)
    tokenBuffer.writeBigInt64BE(BigInt(expireTime), offset);
    offset += 8;
    
    // Write IV length
    tokenBuffer.writeUInt16BE(iv.length, offset);
    offset += 2;
    
    // Write IV
    iv.copy(tokenBuffer, offset);
    offset += iv.length;
    
    // Write encrypted text length
    tokenBuffer.writeUInt16BE(encryptedBuffer.length, offset);
    offset += 2;
    
    // Write encrypted text
    encryptedBuffer.copy(tokenBuffer, offset);
    
    // The final token string is '04' + base64(tokenBuffer)
    return '04' + tokenBuffer.toString('base64');
}

/**
 * Firebase Callable Function to generate a ZegoCloud Kit Token.
 */
export const generateZegoToken = functions
  .region('asia-south1')
  .https
  .onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const userId = context.auth.uid;
    
    // Extract roomId from request data
    const { roomId } = data;

    // FIXED: Correct error message for roomId validation
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
      functions.logger.error('Invalid roomId provided:', { roomId, type: typeof roomId });
      throw new functions.https.HttpsError('invalid-argument', 'roomId is required and must be a non-empty string');
    }

    // Additional userId validation (defensive programming)
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      functions.logger.error('Invalid userId from authentication:', { userId, type: typeof userId });
      throw new functions.https.HttpsError('invalid-argument', 'User authentication is invalid');
    }

    // Environment configuration check
    if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
      functions.logger.error('Zego App ID or Server Secret is not configured.');
      throw new functions.https.HttpsError('failed-precondition', 'The server is not configured for calling services.');
    }
    
    if (typeof ZEGO_SERVER_SECRET !== 'string' || ZEGO_SERVER_SECRET.length !== 32) {
        functions.logger.error(`Invalid Zego Server Secret length. Expected 32, got ${ZEGO_SERVER_SECRET ? ZEGO_SERVER_SECRET.length : 'undefined'}.`);
        throw new functions.https.HttpsError('failed-precondition', 'Server configuration for calling services is invalid.');
    }

    try {
      // Log the attempt for debugging
      functions.logger.info('Generating Zego token:', { userId, roomId });
      
      // Generate the token
      const token = generateKitToken(ZEGO_APP_ID, ZEGO_SERVER_SECRET, userId, roomId);
      
      functions.logger.info(`Successfully generated Zego token for user: ${userId} for room: ${roomId}`);
      return { token };
    } catch (error: any) {
      functions.logger.error(`Error generating Zego token for user ${userId}:`, error);
      throw new functions.https.HttpsError('internal', 'An error occurred while generating the call token.', error.message);
    }
  });