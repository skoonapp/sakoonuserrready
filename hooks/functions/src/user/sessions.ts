// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
import { db, admin } from "../config";
import { CALL_COST_MT_PER_MINUTE, CHAT_COST_MT_PER_MESSAGE } from "./constants";

const addUsageHistory = async (
    userId: string,
    type: 'Call' | 'Chat',
    consumed: number,
    deduction: string,
    balanceAfter: string,
    listenerName: string,
) => {
    await db.collection('users').doc(userId).collection('usageHistory').add({
        timestamp: Date.now(),
        type,
        consumed,
        deduction,
        balanceAfter,
        listenerName,
    });
};

export const finalizeCallSession = functions.region("asia-south1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { consumedSeconds, associatedPlanId, isTokenSession, listenerName } = data;
    const userId = context.auth.uid;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User not found.");
    
    const userData = userDoc.data()!;

    if (isTokenSession) {
        const consumedMinutes = Math.ceil(consumedSeconds / 60);
        const tokensToDeduct = consumedMinutes * CALL_COST_MT_PER_MINUTE;
        if (userData.tokens >= tokensToDeduct) {
            await userRef.update({ tokens: admin.firestore.FieldValue.increment(-tokensToDeduct) });
            await addUsageHistory(userId, 'Call', consumedSeconds, `${tokensToDeduct} MT`, `${userData.tokens - tokensToDeduct} MT Left`, listenerName);
        }
    } else {
        const activePlans = userData.activePlans || [];
        const planIndex = activePlans.findIndex((p: any) => p.id === associatedPlanId);
        if (planIndex > -1) {
            const plan = activePlans[planIndex];
            const consumedMinutes = Math.ceil(consumedSeconds / 60);
            plan.minutes -= consumedMinutes;
            if (plan.minutes < 0) plan.minutes = 0;
            activePlans[planIndex] = plan;
            await userRef.update({ activePlans });
            await addUsageHistory(userId, 'Call', consumedSeconds, 'DT Plan', `${plan.minutes} Min Left`, listenerName);
        }
    }
    return { success: true };
});

export const finalizeChatSession = functions.region("asia-south1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { consumedMessages, associatedPlanId, isTokenSession, listenerName } = data;
    const userId = context.auth.uid;
    
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User not found.");

    const userData = userDoc.data()!;
    
    if (isTokenSession) {
        const tokensToDeduct = consumedMessages * CHAT_COST_MT_PER_MESSAGE;
        if (userData.tokens >= tokensToDeduct) {
            await userRef.update({ tokens: admin.firestore.FieldValue.increment(-tokensToDeduct) });
            await addUsageHistory(userId, 'Chat', consumedMessages, `${tokensToDeduct} MT`, `${userData.tokens - tokensToDeduct} MT Left`, listenerName);
        }
    } else {
        const activePlans = userData.activePlans || [];
        const planIndex = activePlans.findIndex((p: any) => p.id === associatedPlanId);
        if (planIndex > -1) {
            const plan = activePlans[planIndex];
            plan.messages -= consumedMessages;
            if (plan.messages < 0) plan.messages = 0;
            activePlans[planIndex] = plan;
            await userRef.update({ activePlans });
            await addUsageHistory(userId, 'Chat', consumedMessages, 'DT Plan', `${plan.messages} Msgs Left`, listenerName);
        }
    }

    return { success: true };
});