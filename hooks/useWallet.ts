import type { ActivePlan, User } from "../types";

interface WalletState {
    tokens: number;
    activePlans: ActivePlan[];
    freeMessagesRemaining: number;
}

/**
 * A simple selector hook that derives wallet state from the user object.
 * It no longer fetches data itself, eliminating a redundant Firestore listener
 * and improving application performance.
 * @param user The authenticated user object from the main app state.
 * @returns The user's wallet state.
 */
export const useWallet = (user: User | null): WalletState => {
  if (!user) {
    return {
      tokens: 0,
      activePlans: [],
      freeMessagesRemaining: 0,
    };
  }

  return {
    tokens: user.tokens || 0,
    activePlans: user.activePlans || [],
    freeMessagesRemaining: user.freeMessagesRemaining || 0,
  };
};
