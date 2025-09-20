// FIX: Using v1 functions to match the syntax used in the project (e.g., .region(...)).
import * as functions from "firebase-functions/v1";
import { cashfree, db, admin } from "../config";
import type { Plan } from "./types";

// Helper to create a consistent order ID
const generateOrderId = () => `SAKOON-${Date.now()}`;

// Helper to add recharge history
const addRechargeHistory = async (
  userId: string,
  orderId: string,
  amount: number,
  planType: string,
  planDetails: string,
  status: 'Success' | 'Pending' | 'Failed'
) => {
  await db.collection("users").doc(userId).collection("rechargeHistory").add({
    timestamp: Date.now(),
    amount: amount,
    planType: planType,
    planDetails: planDetails,
    status: status,
    paymentId: orderId,
  });
};

/**
 * Creates a Cashfree order session for a user to purchase plans or tokens.
 */
export const createCashfreeOrder = functions.region("asia-south1").https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a purchase.");
    }

    const { amount, planType, planDetails } = data;
    const userId = context.auth.uid;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      throw new functions.https.HttpsError("invalid-argument", "A valid amount is required.");
    }
    if (!planType || !planDetails) {
        throw new functions.https.HttpsError("invalid-argument", "Plan details are missing.");
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const user = userDoc.data()!;

    const orderId = generateOrderId();
    
    const detailsString = planType === 'mt' ? `${(planDetails as {tokens: number}).tokens} MT` : (planDetails as Plan).name || 'DT Plan';

    try {
        const orderRequest = {
            order_id: orderId,
            order_amount: amount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_phone: user.mobile?.replace('+91', '') || "",
                customer_name: user.name || "Sakoon User",
                customer_email: user.email || `${userId}@example.com`,
            },
            order_meta: {
                return_url: `https://sakoonapp.in/?order_id={order_id}&order_status={order_status}`,
            },
            order_note: `Purchase of ${detailsString} for SakoonApp.`,
        };

        // FIX: Switched to Cashfree SDK v3 method PGCreateOrder. Using `as any` to bypass
        // potential TypeScript type definition issues. The API version is set globally in config.
        const response = await (cashfree as any).PGCreateOrder(orderRequest);

        await db.collection("orders").doc(orderId).set({
            userId: userId,
            orderId: orderId,
            amount: amount,
            planType: planType,
            planDetails: planDetails,
            status: "PENDING",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        await addRechargeHistory(userId, orderId, amount, planType, detailsString, 'Pending');

        return { paymentSessionId: response.data.payment_session_id };

    } catch (error: any) {
        functions.logger.error("Cashfree order creation failed:", error.response?.data || error.message);
        throw new functions.https.HttpsError("internal", "Could not create payment session.", error.message);
    }
});

/**
 * Handles webhook notifications from Cashfree to confirm payment status.
 */
export const cashfreeWebhook = functions.region("asia-south1").https.onRequest(async (request, response) => {
    try {
        const signature = request.headers["x-webhook-signature"] as string;
        const timestamp = request.headers["x-webhook-timestamp"] as string;
        const payload = request.rawBody;

        // FIX: Switched to Cashfree SDK v3 method PGVerifyWebhookSignature.
        // The rawBody (Buffer) is passed directly, not as a string.
        const isVerified = (cashfree as any).PGVerifyWebhookSignature(signature, payload, timestamp);
        if (!isVerified) {
            functions.logger.warn("Cashfree webhook signature verification failed.");
            response.status(401).send("Unauthorized");
            return;
        }

        const eventData = request.body.data;
        const orderId = eventData.order.order_id;
        const paymentStatus = eventData.payment.payment_status;

        const orderRef = db.collection("orders").doc(orderId);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
            functions.logger.error(`Order ${orderId} not found in Firestore.`);
            response.status(404).send("Order not found");
            return;
        }
        
        const orderData = orderDoc.data()!;
        const userId = orderData.userId;
        const userRef = db.collection("users").doc(userId);
        const historyQuery = db.collection("users").doc(userId).collection("rechargeHistory").where("paymentId", "==", orderId).limit(1);

        if (paymentStatus === "SUCCESS") {
            const batch = db.batch();

            if (orderData.planType === 'mt') {
                const tokensToAdd = orderData.planDetails.tokens;
                batch.update(userRef, {
                    tokens: admin.firestore.FieldValue.increment(tokensToAdd),
                });
            } else {
                const plan: Plan = orderData.planDetails;
                const newPlan = {
                    id: orderId,
                    type: plan.type,
                    name: plan.name,
                    minutes: plan.minutes || 0,
                    messages: plan.messages || 0,
                    price: plan.price,
                    purchaseTimestamp: Date.now(),
                    expiryTimestamp: Date.now() + 30 * 24 * 60 * 60 * 1000,
                };
                batch.update(userRef, {
                    activePlans: admin.firestore.FieldValue.arrayUnion(newPlan),
                });
            }
            
            batch.update(orderRef, { status: "SUCCESS" });
            
            const historySnapshot = await historyQuery.get();
            if (!historySnapshot.empty) {
                batch.update(historySnapshot.docs[0].ref, { status: "Success" });
            }

            await batch.commit();
            functions.logger.info(`Successfully processed payment for order ${orderId}.`);

        } else {
            await orderRef.update({ status: "FAILED" });
            const historySnapshot = await historyQuery.get();
            if (!historySnapshot.empty) {
                await historySnapshot.docs[0].ref.update({ status: "Failed" });
            }
            functions.logger.warn(`Payment for order ${orderId} was not successful. Status: ${paymentStatus}`);
        }

        response.status(200).send("Webhook processed successfully.");

    } catch (error: any) {
        functions.logger.error("Error handling Cashfree webhook:", error);
        response.status(500).send("Internal Server Error");
    }
});