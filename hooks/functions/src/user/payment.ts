import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
// FIX: Re-introduced explicit { Request, Response } imports from 'express' to resolve type conflicts with firebase-functions.
// Using fully qualified 'express.Request' and 'express.Response' to avoid type collision with firebase-functions.
import express from "express";
import cors from "cors";
import * as crypto from "crypto";
// FIX: Import `Buffer` from the 'buffer' module to resolve 'Cannot find name 'Buffer'' TypeScript errors. This makes the Node.js global type available for signature verification.
import { Buffer } from "buffer";
import { db, getCashfreeClient, getCashfreeWebhookSecret } from "../config";
import { PaymentNotes, PlanDetails, TokenPlanDetails } from "./constants";

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload: string, signature: string, timestamp: string): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha264", getCashfreeWebhookSecret())
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
const processPurchase = async (paymentNotes: PaymentNotes, paymentId: string, eventData: any) => {
  const { userId, planType, planDetails: rawPlanDetails } = paymentNotes;

  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "Payment notes में User ID नहीं है।");
  }

  // FIX: Robustly handle planDetails which might be a string (from older functions) or an object.
  const planDetails: PlanDetails | TokenPlanDetails = typeof rawPlanDetails === 'string'
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
      const tokenDetails = details as TokenPlanDetails;
      if (!tokenDetails.tokens || tokenDetails.tokens <= 0) {
        throw new Error(`Invalid token amount: ${tokenDetails.tokens}`);
      }
      transaction.set(userRef, { 
        tokens: admin.firestore.FieldValue.increment(tokenDetails.tokens) 
      }, { merge: true });
    } else if (planType === "dt") {
      const dtDetails = details as PlanDetails;
      
      const newPlan: any = {
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: dtDetails.type,
        name: dtDetails.name,
        price: dtDetails.price,
        purchaseTimestamp: Date.now(),
        expiryTimestamp: Date.now() + (30 * 24 * 60 * 60 * 1000),
        paymentId: paymentId,
      };

      if (dtDetails.minutes !== undefined && dtDetails.minutes > 0) {
        newPlan.minutes = dtDetails.minutes;
      }
      if (dtDetails.messages !== undefined && dtDetails.messages > 0) {
        newPlan.messages = dtDetails.messages;
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
      planDetails: planType === "mt" ? `${(details as TokenPlanDetails).tokens} MT` : (details as PlanDetails).name,
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

export const createCashfreeOrder = functions.region('asia-south1').https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
    // FIX: Use the instance-based `orders.create` method for cashfree-pg v4+
    const response = await cashfree.orders.create(orderRequest);
    
    // Log successful response (without sensitive data)
    functions.logger.info("Cashfree order created successfully:", {
      orderId: orderRequest.order_id,
      amount: amount,
      userId: context.auth.uid,
      // FIX: The payment_session_id is directly on the response object, not in `data`.
      paymentSessionId: response.payment_session_id ? "present" : "missing",
      responseKeys: Object.keys(response || {})
    });
    
    return { 
      success: true, 
      // FIX: Access payment_session_id directly from the response
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
      throw new functions.https.HttpsError("invalid-argument", 
        `Invalid request: ${error.response?.data?.message || 'Unknown validation error'}`);
    } else {
      throw new functions.https.HttpsError("internal", "पेमेंट शुरू करने में विफल। कृपया अपनी इंटरनेट कनेक्शन की जांच करें और फिर से प्रयास करें।");
    }
  }
});

// FIX: Refactor webhook to use a minimal Express app. This resolves all type errors
// with the request/response objects and provides a standard way to handle CORS
// and raw request bodies for signature verification.
const webhookApp = express();

// Enable CORS for all origins
webhookApp.use(cors({ origin: true }));

// Define a GET route for health checks and Cashfree endpoint verification.
// FIX: Added explicit type annotations to resolve ambiguity.
// FIX: Use express.Request and express.Response to avoid type conflicts.
webhookApp.get("/", (req: express.Request, res: express.Response) => {
    res.status(200).send("OK");
});

// A raw body parser is needed to verify webhook signatures.
// It must be placed before any JSON body parsers.
webhookApp.use(express.raw({ type: "application/json" }));

// Define the POST route for the webhook handler.
// FIX: Added explicit type annotations to resolve ambiguity.
// FIX: Use express.Request and express.Response to avoid type conflicts.
webhookApp.post("/", async (req: express.Request, res: express.Response) => {
    try {
        // Log incoming webhook for debugging
        functions.logger.info("Webhook received:", {
            headers: req.headers,
            // req.body is a Buffer here due to express.raw()
            bodyLength: req.body.length,
        });

        // The payload is the raw request body buffer converted to a string.
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

        functions.logger.info("Webhook verified successfully:", { type: eventData.type, orderId: eventData.data?.order?.order_id });
        
        // Process payment if status is PAID
        if (eventData.data && eventData.data.order && eventData.data.order.order_status === "PAID" && eventData.data.payment) {
            try {
                const paymentNotes = JSON.parse(eventData.data.order.order_note) as PaymentNotes;
                const paymentId = eventData.data.payment.cf_payment_id.toString();
                
                await processPurchase(paymentNotes, paymentId, eventData);
                
                functions.logger.info(`Payment processed successfully for order: ${eventData.data.order.order_id}`);
            } catch (procError: any) {
                functions.logger.error("Payment processing failed inside webhook:", procError);
                // Still return 200 to Cashfree to prevent webhook retries for our own processing errors.
            }
        }

        res.status(200).json({ success: true, message: "Webhook processed." });
    
    } catch (error: any) {
        functions.logger.error("Webhook handler outer error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
});

export const cashfreeWebhook = functions.region('asia-south1').https.onRequest(webhookApp);