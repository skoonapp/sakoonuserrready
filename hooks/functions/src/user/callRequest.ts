// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
// FIX: Use modern environment variables from the updated config file.
import { ZEGO_APP_ID, ZEGO_SERVER_SECRET } from "../config";
import { RtcTokenBuilder, RtcRole } from "zego-express-engine-serverless";

export const generateZegoToken = functions.region("asia-south1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }

    const { planId } = data; // planId is used as the room/channel ID
    const userId = context.auth.uid;
    
    if (!planId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'planId'.");
    }

    const effectiveTimeInSeconds = 3600; // Token valid for 1 hour
    // FIX: Calculate the expiration timestamp instead of passing a duration.
    // The Zego SDK requires the expiration time as a UNIX timestamp (seconds since epoch).
    const expirationTimestamp = Math.floor(Date.now() / 1000) + effectiveTimeInSeconds;
    const payload = "";

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            ZEGO_APP_ID,
            ZEGO_SERVER_SECRET,
            planId,
            userId, // Use string UID
            RtcRole.PUBLISHER,
            expirationTimestamp, // Pass the correct expiration timestamp
            payload
        );
        
        return { token };
    } catch (error) {
        functions.logger.error("Error generating Zego token:", {
            error,
            planId,
            userId,
            appId: ZEGO_APP_ID,
        });
        // Throw a generic error to the client to avoid exposing internal details.
        throw new functions.https.HttpsError("internal", "Failed to generate session token.");
    }
});
