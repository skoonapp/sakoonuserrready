
export type ActiveView = 'home' | 'calls' | 'chats' | 'profile';

export interface ActivePlan {
  id: string;
  type: 'call' | 'chat';
  name: string;
  minutes?: number;
  messages?: number;
  price: number;
  purchaseTimestamp: number;
  expiryTimestamp: number;
}

export interface User {
  uid: string;
  name: string;
  email: string | null;
  mobile?: string;
  city?: string;
  role?: 'admin' | 'listener';
  listenerId?: string;
  favoriteListeners?: string[];
  tokens?: number; // Replaces tokenBalance
  activePlans?: ActivePlan[]; // Replaces purchasedPlans subcollection
  freeMessagesRemaining?: number;
  hasSeenWelcome?: boolean;
  fcmToken?: string;
}

export interface Listener {
  id: string;
  name: string;
  image: string;
  online: boolean;
  rating: number;
  reviewsCount: number;
  gender: 'Male' | 'Female';
  age: number;
  languages?: string[];
}

export interface Plan {
  duration: string;
  price: number;
  tierName?: string;
  // For the new DT plan structure
  type?: 'call' | 'chat';
  name?: string;
  minutes?: number;
  messages?: number;
  discount?: number;
}

export interface ChatMessageSender {
    uid: string;
    name: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatMessageSender;
  timestamp: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface BaseSession {
    listener: Listener;
    plan: Plan; // This can be a simplified object now
    sessionDurationSeconds: number; // Max duration, not tied to a specific plan
    associatedPlanId: string;
    isTokenSession: boolean;
}

export interface CallSession extends BaseSession {
    type: 'call';
}

export interface ChatSession extends BaseSession {
    type: 'chat';
    isFreeTrial?: boolean;
}

export interface FaqItem {
    question: string;
    answer: string;
    isPositive: boolean;
}

export type RechargeStatus = 'Success' | 'Failed' | 'Pending';

export interface RechargeHistoryItem {
  id: string; // Document ID
  timestamp: number;
  amount: number;
  planType: string; // 'MT' or 'DT'
  planDetails: string; // e.g., "10 MT" or "10 min Calling"
  status: RechargeStatus;
  paymentId: string;
  // Make plan optional as it's for "Buy Again"
  plan?: Plan | { tokens: number; price: number };
}

export interface UsageHistoryItem {
  id: string; // Document ID
  timestamp: number;
  type: 'Call' | 'Chat';
  consumed: number; // For calls, duration in seconds. For chats, number of messages.
  deduction: string; // e.g., "DT Plan" or "10 MT"
  balanceAfter: string; // e.g., "6 Min Left" or "42 MT"
  listenerName: string;
}
