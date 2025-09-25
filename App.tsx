import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { auth, db } from './utils/firebase';
import type { User } from './types';
import { FREE_MESSAGES_ON_SIGNUP } from './constants';

// Import Core Components
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';

// Lazy load the main application shell and policy components
const AppShell = lazy(() => import('./components/AppShell'));
const WelcomeModal = lazy(() => import('./components/WelcomeModal'));
const TermsAndConditions = lazy(() => import('./components/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));


const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | null>(null);
    // Use a ref to track the onboarding process. This is the key fix.
    // A ref's value can be changed without causing a component re-render or
    // making the useEffect hook re-run, which solves the race condition.
    const isCompletingOnboardingRef = useRef(false);

    // Hide initial static splash screen once React app is ready
    useEffect(() => {
        const splashElement = document.getElementById('static-splash-screen');
        if (splashElement) {
            splashElement.style.opacity = '0';
            splashElement.addEventListener('transitionend', () => splashElement.remove());
        }
    }, []);

    // Auth state and user data listener. Runs only ONCE on component mount.
    useEffect(() => {
        let unsubscribeUser: () => void = () => {};

        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
            unsubscribeUser(); // Always clean up previous listener first.

            if (firebaseUser) {
                // A user is authenticated, set up a real-time listener for their profile.
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                
                unsubscribeUser = userDocRef.onSnapshot(
                    async (snapshot) => {
                        if (snapshot.exists) {
                            const data = snapshot.data() as User;
                            
                            // If the onboarding ref is set (meaning the user just submitted the form)
                            // and the data from Firestore is still stale (`hasSeenWelcome` is false),
                            // we must IGNORE this snapshot and wait for the next one with the correct data.
                            if (isCompletingOnboardingRef.current && (data.hasSeenWelcome === false || data.hasSeenWelcome === undefined)) {
                                return; // This is the definitive fix: Wait for the correct data.
                            }

                            // If we receive the correct data (`hasSeenWelcome` is true) after submission,
                            // we reset our ref so this logic doesn't run on subsequent snapshots.
                            if (isCompletingOnboardingRef.current && data.hasSeenWelcome === true) {
                                isCompletingOnboardingRef.current = false;
                            }

                            setUser(data);

                        } else {
                            // This is a new user (or their doc was deleted). Create their document.
                            const newUser: User = {
                                uid: firebaseUser.uid,
                                name: firebaseUser.displayName || 'New User',
                                email: firebaseUser.email,
                                mobile: firebaseUser.phoneNumber || '',
                                favoriteListeners: [],
                                tokens: 0,
                                activePlans: [],
                                freeMessagesRemaining: FREE_MESSAGES_ON_SIGNUP,
                                hasSeenWelcome: false,
                            };
                            try {
                                // The onSnapshot listener will automatically receive this new data.
                                await userDocRef.set(newUser);
                                setUser(newUser);
                            } catch (error) {
                                console.error("Failed to create new user document:", error);
                                auth.signOut();
                                setUser(null);
                            }
                        }
                        // Stop initializing as soon as we have the first bit of data.
                        setIsInitializing(false);
                    },
                    (error) => {
                        console.error("Firestore onSnapshot listener error:", error);
                        auth.signOut();
                        setUser(null);
                        setIsInitializing(false);
                    }
                );
            } else {
                // No user is authenticated.
                setUser(null);
                setIsInitializing(false);
            }
        });

        // Cleanup function for when the App component unmounts.
        return () => {
            unsubscribeAuth();
            unsubscribeUser();
        };
    }, []); // The empty dependency array ensures this effect runs only ONCE.
    
    const handleOnboardingComplete = () => {
        // Set the ref to true. This tells our stable onSnapshot listener to
        // start watching for the `hasSeenWelcome: true` update.
        isCompletingOnboardingRef.current = true;
    };

    // --- Render Logic ---
    if (isInitializing) {
        return <SplashScreen />;
    }

    if (!user) {
        return <LoginScreen />;
    }

    // Enforce mandatory onboarding flow
    const needsOnboarding = user.hasSeenWelcome === false || user.hasSeenWelcome === undefined;
    if (needsOnboarding) {
        return (
            <div className="w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-950 h-screen overflow-hidden">
                 <Suspense fallback={<SplashScreen />}>
                    <WelcomeModal 
                        user={user} 
                        onShowTerms={() => setShowPolicy('terms')}
                        onShowPrivacyPolicy={() => setShowPolicy('privacy')}
                        onOnboardingComplete={handleOnboardingComplete}
                    />
                    {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
                    {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
                </Suspense>
            </div>
        );
    }
    
    // Once authenticated and onboarded, show the main application.
    return (
        <Suspense fallback={<SplashScreen />}>
            <AppShell user={user} />
        </Suspense>
    );
};

export default App;