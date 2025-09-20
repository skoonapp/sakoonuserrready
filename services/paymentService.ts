
// FIX: Replaced modular Firebase v9+ imports with the compat version from the shared firebase utility file to match the project's setup.
import { auth, functions } from "../utils/firebase";
import type { Plan } from '../types';

declare global {
  interface Window {
    Cashfree: any;
  }
}

class PaymentService {
  // 🟢 Buy Token Plan
  async buyTokens(tokens: number, price: number) {
    if (!auth.currentUser) {
      throw new Error("Please login first!");
    }
    const createOrder = functions.httpsCallable('createCashfreeOrder');
    const response = await createOrder({ 
        amount: price, 
        planType: 'mt', 
        planDetails: { tokens, price } 
    });
    return (response.data as any).paymentSessionId;
  }
  
  // 🟢 Buy DT Plan
  async buyDTPlan(planData: Plan) {
    if (!auth.currentUser) {
      throw new Error("Please login first!");
    }
    const createOrder = functions.httpsCallable('createCashfreeOrder');
    const response = await createOrder({ 
        amount: planData.price, 
        planType: 'dt', 
        planDetails: planData 
    });
    return (response.data as any).paymentSessionId;
  }
}

export const paymentService = new PaymentService();