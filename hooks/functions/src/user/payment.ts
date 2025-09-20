import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import cors from "cors";
import * as crypto from "crypto";
import { db, cashfree, CASHFREE_WEBHOOK_SECRET } from "../config";
import { PaymentNotes, PlanDetails, TokenPlanDetails } from "./types";

const corsHandler = cors({ origin: true });

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload: string, signature: string, timestamp: string): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_WEBHOOK_SECRET)
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
  const { userId, planType, planDetails } = paymentNotes;

  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "Payment notes में User ID नहीं है।");
  }

  const paymentRef = db.collection("processedPayments").doc(paymentId);
  const userRef = db.collection("users").doc(userId);

  await db.runTransaction(async (transaction) => {
    const paymentDoc = await transaction.get(paymentRef);
    if (paymentDoc.exists) {
      functions.logger.warn(`Payment ${paymentId} पहले ही प्रोसेस हो चुका है।`);
      return;
    }

    let details;
    try {
      details = JSON.parse(planDetails);
    } catch (error) {
      throw new Error(`Invalid plan details JSON: ${planDetails}`);
    }

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
      customer_phone: userData.mobile || "9999999999",
    },
    order_meta: {
      return_url: `https://sakoonapp-9574c.web.app/return?order_id={order_id}`,
    },
    order_note: JSON.stringify({ 
      userId: context.auth.uid, 
      planType, 
      planDetails: JSON.stringify(planDetails) 
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
    // Check if cashfree is properly initialized
    if (!cashfree) {
      functions.logger.error("Cashfree client not initialized");
      throw new functions.https.HttpsError("internal", "Payment service not available");
    }

    functions.logger.info("Sending request to Cashfree API...");
    const response = await (cashfree as any).orders.create(orderRequest);
    
    // Log successful response (without sensitive data)
    functions.logger.info("Cashfree order created successfully:", {
      orderId: orderRequest.order_id,
      amount: amount,
      userId: context.auth.uid,
      paymentSessionId: response.data?.payment_session_id ? "present" : "missing",
      responseKeys: Object.keys(response.data || {})
    });
    
    return { 
      success: true, 
      paymentSessionId: response.data.payment_session_id,
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
      cashfreeConfigured: !!cashfree
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

// FIX: Explicitly typed the 'req' and 'res' parameters to ensure TypeScript uses the correct types from firebase-functions,
// which include properties like `method`, `headers`, `body`, and methods like `status()` and `send()`.
// This resolves all errors related to unrecognized properties on the request and response objects.
export const cashfreeWebhook = functions.region('asia-south1').https.onRequest((req: functions.https.Request, res: functions.Response) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-webhook-signature, x-webhook-timestamp');
    res.status(204).send('');
    return;
  }

  // Handle GET requests for health check - simplified for Cashfree verification
  if (req.method === 'GET') {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send('OK');
    return;
  }

  // Only allow POST for actual webhooks
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      message: "Method Not Allowed. Use POST for webhooks.",
      allowedMethods: ["GET", "POST", "OPTIONS"]
    });
    return;
  }

  corsHandler(req, res, async () => {
    try {
      // Log incoming webhook for debugging
      functions.logger.info("Webhook received:", {
        headers: req.headers,
        bodyType: typeof req.body,
        hasRawBody: !!req.rawBody
      });

      // Handle Cashfree TEST events
      if (req.body && req.body.type === "TEST") {
        functions.logger.info("Received Cashfree TEST webhook for endpoint verification.");
        res.status(200).json({
          success: true,
          message: "Test webhook received successfully",
          timestamp: Date.now()
        });
        return;
      }

      // Validate webhook has body
      if (!req.body) {
        functions.logger.warn("Webhook received with empty body");
        res.status(400).json({
          success: false,
          message: "Bad Request: Empty body"
        });
        return;
      }

      const signature = req.headers["x-webhook-signature"] as string;
      const timestamp = req.headers["x-webhook-timestamp"] as string;
      
      // Get payload - prefer rawBody over stringified body
      const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

      // For test requests or verification, don't require signature verification
      const isTestRequest = !signature && !timestamp;
      
      if (isTestRequest) {
        functions.logger.info("Webhook verification request received (no signature headers)");
        res.status(200).send('OK');
        return;
      }

      // Validate required headers for actual webhooks
      if (!signature || !timestamp) {
        functions.logger.warn("Missing webhook headers:", {
          hasSignature: !!signature,
          hasTimestamp: !!timestamp,
          allHeaders: Object.keys(req.headers)
        });
        res.status(400).json({
          success: false,
          message: "Bad Request: Missing required webhook headers",
          required: ["x-webhook-signature", "x-webhook-timestamp"]
        });
        return;
      }

      // Verify webhook signature
      if (!verifyWebhookSignature(payload, signature, timestamp)) {
        functions.logger.error("Webhook signature verification failed");
        res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid webhook signature"
        });
        return;
      }

      const eventData = req.body;
      
      // Log successful webhook verification
      functions.logger.info("Webhook verified successfully:", {
        type: eventData.type,
        orderId: eventData.data?.order?.order_id,
        paymentStatus: eventData.data?.order?.order_status
      });

      // Process payment if status is PAID
      if (eventData.data && 
          eventData.data.order && 
          eventData.data.order.order_status === "PAID" &&
          eventData.data.payment) {
        
        try {
          const paymentNotes = JSON.parse(eventData.data.order.order_note) as PaymentNotes;
          const paymentId = eventData.data.payment.cf_payment_id.toString();
          
          await processPurchase(paymentNotes, paymentId, eventData);
          
          functions.logger.info(`Payment processed successfully:`, {
            paymentId,
            userId: paymentNotes.userId,
            planType: paymentNotes.planType,
            orderId: eventData.data.order.order_id
          });
        } catch (error: any) {
          functions.logger.error("Payment processing failed:", error);
          // Still return 200 to prevent webhook retries for processing errors
        }
      }

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
        timestamp: Date.now()
      });
      
    } catch (error: any) {
      functions.logger.error("Webhook processing error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
        timestamp: Date.now()
      });
    }
  });
});