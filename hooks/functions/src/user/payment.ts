// FIX: Use a namespace import for firebase-functions to avoid global type pollution and conflicts with Express types.
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Using a default import for the express app and specific type imports to resolve conflicts with firebase-functions types.
import express from "express";
// FIX: Aliased express types to prevent conflicts with global types from firebase-functions.
import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { Cashfree } from "cashfree-pg";
// FIX: Use an ES module import for 'axios' instead of 'require' to resolve the type error and maintain code consistency.
import axios from "axios";
import { initializeCashfree, CASHFREE_WEBHOOK_SECRET, db } from "../config";
import { setCORSHeaders } from "../common/cors";

// Enhanced purchase processing with better error handling
const processPurchase = async (paymentNotes: any, paymentId: string, eventData: any) => {
  const { userId, planType, planDetails: rawPlanDetails } = paymentNotes;

  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "Payment notes में User ID नहीं है।");
  }

  // Handle planDetails which might be a string or an object
  const planDetails = typeof rawPlanDetails === 'string'
    ? JSON.parse(rawPlanDetails)
    : rawPlanDetails;

  const paymentRef = db.collection("processedPayments").doc(paymentId);
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
    const paymentDoc = await transaction.get(paymentRef);
    if (paymentDoc.exists) {
      functions.logger.warn(`Payment ${paymentId} पहले ही प्रोसेस हो चुका है।`);
      return;
    }

    const details = planDetails;

    if (planType === "mt") {
      const tokenDetails = details;
      if (!tokenDetails.tokens || tokenDetails.tokens <= 0) {
        throw new Error(`Invalid token amount: ${tokenDetails.tokens}`);
      }

      transaction.set(userRef, {
        tokens: admin.firestore.FieldValue.increment(tokenDetails.tokens)
      }, { merge: true });
    } else if (planType === "dt") {
      const dtDetails = details;
      const newPlan = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: dtDetails.type,
        name: dtDetails.name,
        price: dtDetails.price,
        purchaseTimestamp: Date.now(),
        expiryTimestamp: Date.now() + (30 * 24 * 60 * 60 * 1000),
        paymentId: paymentId,
      };

      if (dtDetails.minutes !== undefined && dtDetails.minutes > 0) {
        (newPlan as any).minutes = dtDetails.minutes;
      }

      if (dtDetails.messages !== undefined && dtDetails.messages > 0) {
        (newPlan as any).messages = dtDetails.messages;
      }

      transaction.set(userRef, {
        activePlans: admin.firestore.FieldValue.arrayUnion(newPlan)
      }, { merge: true });
    } else {
      throw new Error(`Unknown plan type: ${planType}`);
    }

    // Enhanced recharge history with more details
    const rechargeHistoryRef = userRef.collection("rechargeHistory").doc();
    transaction.set(rechargeHistoryRef, {
      timestamp: Date.now(),
      amount: details.price,
      planType: planType.toUpperCase(),
      planDetails: planType === "mt" ? `${details.tokens} MT` : details.name,
      status: "Success",
      paymentId: paymentId,
      orderId: eventData.data?.order?.order_id,
      paymentMethod: eventData.data?.payment?.payment_method,
      gatewayResponse: {
        cf_payment_id: eventData.data?.payment?.cf_payment_id,
        payment_status: eventData.data?.payment?.payment_status,
        payment_amount: eventData.data?.payment?.payment_amount,
      }
    });

    // Mark payment as processed with full event data
    transaction.set(paymentRef, {
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      eventType: eventData.type,
      orderId: eventData.data?.order?.order_id,
    });
  });
};

// CORS-enabled createCashfreeOrder function
export const createCashfreeOrder = functions.region('asia-south1').https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "आपको लॉग इन होना चाहिए।");

  initializeCashfree();

  const { amount, planType, planDetails } = data;

  functions.logger.info("Order creation request received:", { userId: context.auth.uid, amount, planType });

  if (!amount || amount <= 0) throw new functions.https.HttpsError("invalid-argument", "Invalid amount");
  if (!planType || !["mt", "dt"].includes(planType)) throw new functions.https.HttpsError("invalid-argument", "Invalid plan type");

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User नहीं मिला।");

  const userData = userDoc.data()!;

  const orderRequest = {
    order_id: `SAKOONAPP_ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order_amount: amount,
    order_currency: "INR",
    customer_details: {
      customer_id: context.auth.uid,
      customer_name: userData.name || "SakoonApp User",
      customer_email: userData.email || "user@example.com",
      customer_phone: (userData.mobile || "9999999999").replace('+91', ''),
    },
    order_meta: {
      return_url: `https://sakoonapp-9574c.web.app/return?order_id={order_id}`,
    },
    order_tags: {
      userId: context.auth.uid,
      planType,
      planDetails: JSON.stringify(planDetails)
    },
  };

  try {
    // Fixed: Use the correct method name based on Cashfree SDK version
    let response;
    
    // Try different method names based on SDK version
    if (typeof (Cashfree as any).PGCreateOrder === 'function') {
      response = await (Cashfree as any).PGCreateOrder("2023-08-01", orderRequest);
    } else if (typeof (Cashfree as any).createOrder === 'function') {
      response = await (Cashfree as any).createOrder("2023-08-01", orderRequest);
    } else if (typeof (Cashfree as any).Orders === 'object' && typeof (Cashfree as any).Orders.create === 'function') {
      response = await (Cashfree as any).Orders.create("2023-08-01", orderRequest);
    } else {
      // Fallback: try direct API call
      const baseURL = process.env.NODE_ENV === 'production' 
        ? 'https://api.cashfree.com/pg/orders' 
        : 'https://sandbox.cashfree.com/pg/orders';
        
      response = await axios.post(baseURL, orderRequest, {
        headers: {
          'x-client-id': (Cashfree as any).XClientId,
          'x-client-secret': (Cashfree as any).XClientSecret,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      });
    }
    
    functions.logger.info("Cashfree order created successfully:", { orderId: orderRequest.order_id, userId: context.auth.uid });
    
    return {
      success: true,
      paymentSessionId: response.data.payment_session_id,
      orderId: response.data.order_id
    };
  } catch (error: any) {
    functions.logger.error("Cashfree order creation failed:", {
      userId: context.auth.uid,
      errorMessage: error.message,
      errorResponse: error.response?.data,
    });
    throw new functions.https.HttpsError("internal", error.response?.data?.message || "पेमेंट शुरू करने में विफल। कृपया फिर से प्रयास करें।");
  }
});

const webhookApp = express();

webhookApp.use((req: any, res: any, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res, req.get('Origin'));
    res.status(204).send('');
    return;
  }
  setCORSHeaders(res, req.get('Origin'));
  next();
});

webhookApp.get("/", (req: any, res: any) => res.status(200).send("OK"));

// FIX: The raw body parser is now applied directly to the POST route. This resolves a TypeScript
// overload error on `app.use()` and ensures the raw payload is available for webhook signature verification.
// The raw body is needed for webhook signature verification.
webhookApp.post("/", express.raw({ type: "application/json" }), async (req: any, res: any) => {
  try {
    const payloadBuffer = req.body as Buffer;
    const eventData = JSON.parse(payloadBuffer.toString());

    if (eventData.type === "TEST") {
      functions.logger.info("Received Cashfree TEST webhook.");
      return res.status(200).json({ success: true, message: "Test webhook received" });
    }

    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;

    if (!signature || !timestamp) {
      functions.logger.warn("Missing webhook headers.");
      return res.status(400).json({ success: false, message: "Missing required webhook headers." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_WEBHOOK_SECRET)
      .update(timestamp + payloadBuffer.toString())
      .digest("base64");

    if (!crypto.timingSafeEqual(Buffer.from(signature, 'base64'), Buffer.from(expectedSignature, 'base64'))) {
      functions.logger.error("Webhook signature verification failed.");
      return res.status(401).json({ success: false, message: "Invalid webhook signature." });
    }
    
    functions.logger.info("Webhook verified successfully:", { type: eventData.type, orderId: eventData.data?.order?.order_id });

    if (eventData.data?.order?.order_status === "PAID") {
      try {
        const orderTags = eventData.data.order.order_tags;
        const paymentNotes = {
          userId: orderTags.userId,
          planType: orderTags.planType,
          planDetails: orderTags.planDetails,
        };
        const paymentId = eventData.data.payment.cf_payment_id.toString();
        await processPurchase(paymentNotes, paymentId, eventData);
        functions.logger.info(`Payment processed successfully for order: ${eventData.data.order.order_id}`);
      } catch (procError) {
        functions.logger.error("Payment processing failed inside webhook:", procError);
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed." });
  } catch (error: any) {
    functions.logger.error("Webhook handler outer error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

// FIX: Cast express app to 'any' to satisfy the Firebase Functions onRequest type signature.
export const cashfreeWebhook = functions.region('asia-south1').https.onRequest(webhookApp as any);