

import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Switched to ES module imports for Express to resolve module resolution issues.
// And explicitly import Request, Response, NextFunction to avoid type conflicts.
// FIX: Using NextFunction from express, but Request/Response will come from firebase-functions to avoid type conflicts.
import express, { NextFunction } from "express";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { getCashfreeClient, getCashfreeWebhookSecret, db } from "../config";
import { setCORSHeaders } from "../common/cors";

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload: string, signature: string, timestamp: string): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", getCashfreeWebhookSecret())
      .update(`${timestamp}${payload}`)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    functions.logger.error("Signature verification error:", error);
    return false;
  }
};

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

  await db.runTransaction(async (transaction) => {
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

  const { amount, planType, planDetails } = data;

  // Enhanced logging for debugging
  functions.logger.info("Order creation request received:", {
    userId: context.auth.uid,
    amount,
    planType,
    planDetails,
    timestamp: Date.now()
  });

  // Input validation
  if (!amount || amount <= 0) {
    functions.logger.error("Invalid amount provided:", amount);
    throw new functions.https.HttpsError("invalid-argument", "Invalid amount");
  }

  if (!planType || !["mt", "dt"].includes(planType)) {
    functions.logger.error("Invalid plan type:", planType);
    throw new functions.https.HttpsError("invalid-argument", "Invalid plan type");
  }

  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists) {
    functions.logger.error("User not found:", context.auth.uid);
    throw new functions.https.HttpsError("not-found", "User नहीं मिला।");
  }

  const userData = userDoc.data()!;
  functions.logger.info("User data retrieved:", {
    userId: context.auth.uid,
    hasName: !!userData.name,
    hasEmail: !!userData.email,
    hasMobile: !!userData.mobile
  });

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
    order_note: JSON.stringify({
      userId: context.auth.uid,
      planType,
      planDetails: planDetails
    }),
  };

  // Log the complete order request (without sensitive data)
  functions.logger.info("Cashfree order request prepared:", {
    orderId: orderRequest.order_id,
    amount: orderRequest.order_amount,
    currency: orderRequest.order_currency,
    customerId: orderRequest.customer_details.customer_id,
    customerName: orderRequest.customer_details.customer_name,
    customerEmail: orderRequest.customer_details.customer_email,
    customerPhone: orderRequest.customer_details.customer_phone,
    returnUrl: orderRequest.order_meta.return_url
  });

  try {
    const cashfree = getCashfreeClient();
    functions.logger.info("Sending request to Cashfree API...");

    const response = await cashfree.orders.create(orderRequest);

    // Log successful response (without sensitive data)
    functions.logger.info("Cashfree order created successfully:", {
      orderId: orderRequest.order_id,
      amount: amount,
      userId: context.auth.uid,
      paymentSessionId: response.payment_session_id ? "present" : "missing",
      responseKeys: Object.keys(response || {})
    });

    return {
      success: true,
      paymentSessionId: response.payment_session_id,
      orderId: orderRequest.order_id
    };
  } catch (error: any) {
    // Enhanced error logging
    functions.logger.error("Cashfree order creation failed:", {
      userId: context.auth.uid,
      orderId: orderRequest.order_id,
      amount: amount,
      errorMessage: error.message,
      errorCode: error.code,
      errorStatus: error.status,
      errorResponse: error.response?.data,
      errorStack: error.stack,
      cashfreeConfigured: !!getCashfreeClient
    });

    // Different error handling based on error type
    if (error.response?.status === 401) {
      throw new functions.https.HttpsError("internal", "Payment service authentication failed");
    } else if (error.response?.status === 400) {
      throw new functions.https.HttpsError("invalid-argument", `Invalid request: ${error.response?.data?.message || 'Unknown validation error'}`);
    } else {
      throw new functions.https.HttpsError("internal", "पेमेंट शुरू करने में विफल। कृपया अपनी इंटरनेट कनेक्शन की जांच करें और फिर से प्रयास करें।");
    }
  }
});

// CORS-enabled webhook with Express app
// FIX: Explicitly typing the express app instance to resolve type conflicts with firebase-functions.
const webhookApp: express.Express = express();

// Enable CORS for all origins using our custom CORS function
// FIX: Using types from firebase-functions directly to resolve type conflicts.
webhookApp.use((req: functions.https.Request, res: functions.Response, next: NextFunction) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    setCORSHeaders(res as any, req.get('Origin'));
    res.status(204).send('');
    return;
  }
  
  // Set CORS headers for all requests
  setCORSHeaders(res as any, req.get('Origin'));
  next();
});

// Define a GET route for health checks and Cashfree endpoint verification
// FIX: Using types from firebase-functions directly to resolve type conflicts.
webhookApp.get("/", (req: functions.https.Request, res: functions.Response) => {
  res.status(200).send("OK");
});

// Raw body parser for signature verification
// FIX: Explicitly use the express raw parser.
webhookApp.use(express.raw({ type: "application/json" }));

// Define the POST route for the webhook handler
// FIX: Using types from firebase-functions directly to resolve type conflicts.
webhookApp.post("/", async (req: functions.https.Request, res: functions.Response) => {
  try {
    // Log incoming webhook for debugging
    functions.logger.info("Webhook received:", {
      headers: req.headers,
      bodyLength: req.body.length,
    });

    // The payload is the raw request body buffer converted to a string
    const payload = req.body.toString();
    const eventData = JSON.parse(payload);

    // Handle Cashfree TEST events for endpoint verification
    if (eventData.type === "TEST") {
      functions.logger.info("Received Cashfree TEST webhook.");
      res.status(200).json({ success: true, message: "Test webhook received" });
      return;
    }

    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;

    if (!signature || !timestamp) {
      functions.logger.warn("Missing webhook headers.");
      res.status(400).json({ success: false, message: "Missing required webhook headers." });
      return;
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      functions.logger.error("Webhook signature verification failed.");
      res.status(401).json({ success: false, message: "Invalid webhook signature." });
      return;
    }

    functions.logger.info("Webhook verified successfully:", { 
      type: eventData.type, 
      orderId: eventData.data?.order?.order_id 
    });

    // Process payment if status is PAID
    if (eventData.data && 
        eventData.data.order && 
        eventData.data.order.order_status === "PAID" && 
        eventData.data.payment) {
      try {
        const paymentNotes = JSON.parse(eventData.data.order.order_note);
        const paymentId = eventData.data.payment.cf_payment_id.toString();
        await processPurchase(paymentNotes, paymentId, eventData);
        functions.logger.info(`Payment processed successfully for order: ${eventData.data.order.order_id}`);
      } catch (procError) {
        functions.logger.error("Payment processing failed inside webhook:", procError);
        // Still return 200 to Cashfree to prevent webhook retries
      }
    }

    res.status(200).json({ success: true, message: "Webhook processed." });
  } catch (error: any) {
    functions.logger.error("Webhook handler outer error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

// FIX: Cast the express app to 'any' to work around a known issue with firebase-functions type definitions, which don't have an overload for an Express app.
export const cashfreeWebhook = functions.region('asia-south1').https.onRequest(webhookApp as any);