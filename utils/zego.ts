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
 * @param roomId The ID of the session, used as the room/channel ID for Zego.
 * @returns A promise that resolves to the Zego Kit Token.
 */
export const fetchZegoToken = async (roomId: string): Promise<string> => {
    const generateToken = functions.httpsCallable('generateZegoToken');
    // FIX: The backend function expects the room identifier under the key 'roomId',
    // as indicated by the cloud function logs. This was previously sent as 'planId'.
    const result = await generateToken({ roomId });
    return (result.data as any).token;
};