export interface Plan {
  type?: 'call' | 'chat';
  name?: string;
  duration?: string;
  minutes?: number;
  messages?: number;
  price: number;
}

// FIX: Added missing type definitions for payment processing.
export interface PaymentNotes {
  userId: string;
  planType: "mt" | "dt";
  planDetails: string; // This is a stringified JSON
}

export interface TokenPlanDetails {
    tokens: number;
    price: number;
}

export type PlanDetails = Plan;
