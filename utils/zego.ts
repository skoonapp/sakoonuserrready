
import { functions } from './firebase';

// ZegoUIKitPrebuilt is loaded from a script tag in index.html
declare global {
  interface Window {
    ZegoUIKitPrebuilt: any;
  }
}

/**
 * Fetches a ZegoCloud Kit Token from our secure Firebase Callable Function.
 * The function verifies the user's authentication before issuing a token.
 * @param planId The ID of the session, used as the channel ID for Zego.
 * @returns A promise that resolves to the Zego Kit Token.
 */
export const fetchZegoToken = async (planId: string): Promise<string> => {
    const generateToken = functions.httpsCallable('generateZegoToken');
    const result = await generateToken({ planId });
    return (result.data as any).token;
};