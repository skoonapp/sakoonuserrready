
import { useState, useCallback, useRef, useEffect } from 'react';
import { auth } from '../utils/firebase';
import firebase from 'firebase/compat/app';

/**
 * A custom hook to encapsulate all Firebase authentication logic.
 * Manages loading and error states for a cleaner UI component.
 */
export const useAuthHandler = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const confirmationResultRef = useRef<firebase.auth.ConfirmationResult | null>(null);
    const appVerifierRef = useRef<firebase.auth.RecaptchaVerifier | null>(null);

    // On mount, check if an auth error was passed from a redirect
    useEffect(() => {
        const authError = sessionStorage.getItem('authError');
        if (authError) {
            setError(authError);
            sessionStorage.removeItem('authError');
        }
    }, []);

    const signInWithGoogle = useCallback(() => {
        setLoading(true);
        setError('');
        const provider = new firebase.auth.GoogleAuthProvider();
        // FIX: Switched to signInWithPopup to avoid environment errors in sandboxed iframes.
        auth.signInWithPopup(provider)
            .catch((err) => {
                console.error("Google Popup Auth Error:", err.code, err.message);
                // Don't show an error if the user intentionally closes the popup.
                if (err.code !== 'auth/popup-closed-by-user') {
                    setError('Failed to sign in with Google. Please try again.');
                }
            })
            .finally(() => {
                 // The onAuthStateChanged listener handles success, so we just need to stop loading.
                setLoading(false);
            });
    }, []);

    const sendOtpToPhone = useCallback(async (phoneNumber: string) => {
        setLoading(true);
        setError('');

        try {
            // Ensure reCAPTCHA container exists and is clean for each attempt
            let container = document.getElementById('recaptcha-container');
            if (container) {
                container.innerHTML = '';
            } else {
                container = document.createElement('div');
                container.id = 'recaptcha-container';
                document.body.appendChild(container);
            }
            
            // Create and render the verifier
            const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
            });
            appVerifierRef.current = appVerifier;

            // Explicitly render the verifier and wait for it to be ready.
            // This is crucial for preventing race conditions that cause errors.
            await appVerifier.render();

            const confirmationResult = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, appVerifier);
            confirmationResultRef.current = confirmationResult;
            return true; // Indicate success
        } catch (err: any) {
             console.error("SMS sending error:", err);
             const messages: { [key: string]: string } = {
                'auth/too-many-requests': 'Too many attempts from this device. Please try again later.',
                'auth/invalid-phone-number': 'The phone number you entered is not valid.',
                'auth/captcha-check-failed': 'reCAPTCHA verification failed. Please try again.',
                'auth/network-request-failed': 'Network error. Please check your connection and try again.'
             };
             setError(messages[err.code] || 'Failed to send OTP. Please try again.');

             // Cleanup verifier on error
             if (appVerifierRef.current) {
                appVerifierRef.current.clear();
             }
             return false; // Indicate failure
        } finally {
            setLoading(false);
        }
    }, []);

    const verifyOtp = useCallback(async (otp: string) => {
        if (!confirmationResultRef.current) {
            setError('Verification session expired. Please try again.');
            return false;
        }
        setLoading(true);
        setError('');
        try {
            await confirmationResultRef.current.confirm(otp);
            return true;
        } catch (err: any) {
             console.error("OTP verification error:", err);
             const messages: { [key: string]: string } = {
                'auth/invalid-verification-code': 'Invalid OTP. Please check again.'
             };
             setError(messages[err.code] || 'OTP verification failed. Please try again.');
             return false;
        } finally {
            setLoading(false);
        }
    }, []);

    // Clear error state manually
    const clearError = useCallback(() => setError(''), []);

    return { loading, error, signInWithGoogle, sendOtpToPhone, verifyOtp, clearError };
};
