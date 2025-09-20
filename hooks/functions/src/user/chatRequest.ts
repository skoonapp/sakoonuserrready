// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
import { db, admin } from "../config";

export const useFreeMessage = functions.region("asia-south1").https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const userId = context.auth.uid;
    const userRef = db.collection("users").doc(userId);

    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "User not found.");
        }
        const freeMessages = userDoc.data()?.freeMessagesRemaining || 0;
        if (freeMessages <= 0) {
            throw new functions.https.HttpsError("failed-precondition", "You have no free messages remaining.");
        }
        transaction.update(userRef, {
            freeMessagesRemaining: admin.firestore.FieldValue.increment(-1),
        });
        return { success: true, remaining: freeMessages - 1 };
    });
});