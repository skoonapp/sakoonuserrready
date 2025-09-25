import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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

    // Hide initial static splash screen once React app is ready
    useEffect(() => {
        const splashElement = document.getElementById('static-splash-screen');
        if (splashElement) {
            splashElement.style.opacity = '0';
            splashElement.addEventListener('transitionend', () => splashElement.remove());
        }
    }, []);

    // Auth state and user data listener
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
                            // The user document exists, update our state.
                            setUser(snapshot.data() as User);
                        } else {
                            // This is a new user (or their doc was deleted).
                            // Create their document in Firestore.
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
                                // Create the document. The onSnapshot listener will automatically
                                // receive this new data and update the state.
                                await userDocRef.set(newUser);
                                setUser(newUser);
                            } catch (error) {
                                console.error("Failed to create new user document:", error);
                                // If creation fails, we can't proceed. Log the user out.
                                auth.signOut();
                                setUser(null);
                            }
                        }
                        // Crucially, we stop initializing as soon as we have the first bit of data.
                        setIsInitializing(false);
                    },
                    (error) => {
                        // Handle errors with the listener itself.
                        console.error("Firestore onSnapshot listener error:", error);
                        // Log out and stop initializing to show the login screen.
                        auth.signOut();
                        setUser(null);
                        setIsInitializing(false);
                    }
                );
            } else {
                // No user is authenticated. We can immediately stop initializing.
                setUser(null);
                setIsInitializing(false);
            }
        });

        // Cleanup function for when the App component unmounts.
        return () => {
            unsubscribeAuth();
            unsubscribeUser();
        };
    }, []);
    
    const handleOnboardingComplete = useCallback(() => {
        if (user) {
            // Perform a safe optimistic update.
            // This is called after the backend function successfully completes.
            // We can confidently update the UI now to provide instant feedback
            // and remove the welcome modal. The Firestore snapshot listener
            // will soon receive the same data, ensuring consistency.
            setUser(currentUser => currentUser ? { ...currentUser, hasSeenWelcome: true } : null);
        }
    }, [user]);

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