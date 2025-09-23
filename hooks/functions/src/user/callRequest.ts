// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
// FIX: Corrected Zego config import names to match the exports in config.ts.
import { getZegoAppId, getZegoServerSecret } from "../config";
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
    const payload = "";

    const token = RtcTokenBuilder.buildTokenWithUid(
        getZegoAppId(),
        getZegoServerSecret(),
        planId,
        userId, // Use string UID
        RtcRole.PUBLISHER,
        effectiveTimeInSeconds,
        payload
    );
    
    return { token };
});
