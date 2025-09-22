// कॉल के लिए प्रति मिनट कितने MT लगेंगे
export const CALL_COST_MT_PER_MINUTE = 2;

// चैट के लिए प्रति मैसेज कितने MT लगेंगे (1 MT में 2 मैसेज)
export const CHAT_COST_MT_PER_MESSAGE = 0.5;

// नए यूज़र्स को मिलने वाले मुफ़्त मैसेज
export const FREE_MESSAGES_ON_SIGNUP = 5;

// Backend में इस्तेमाल होने वाले डेटा का स्ट्रक्चर

// DT प्लान का विवरण
export interface PlanDetails {
  duration: string;
  price: number;
  tierName?: string;
  type?: 'call' | 'chat';
  name?: string;
  minutes?: number;
  messages?: number;
  discount?: number;
}

// MT प्लान का विवरण
export interface TokenPlanDetails {
  tokens: number;
  price: number;
}

// यह जानकारी Cashfree को भेजी जाएगी ताकि पेमेंट कन्फर्म होने पर पता चल सके कि किसने और क्या खरीदा है।
export interface PaymentNotes {
  userId: string;
  planType: "mt" | "dt";
  // FIX: Changed from string to a direct object to simplify data handling.
  planDetails: PlanDetails | TokenPlanDetails;
}
