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

        const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
            unsubscribeUser(); // Unsubscribe from previous user's listener
            if (firebaseUser) {
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                
                try {
                    // First, check if the user document exists.
                    const doc = await userDocRef.get();
                    
                    if (!doc.exists) {
                        // If it doesn't exist, create it. Await this operation.
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
                        await userDocRef.set(newUser);
                        // Set user state immediately for a faster UI response for new users,
                        // before the snapshot listener is even attached.
                        setUser(newUser);
                    }
                    
                    // Now that we're sure the document exists, attach the realtime listener.
                    unsubscribeUser = userDocRef.onSnapshot(
                        (snapshot) => {
                            if (snapshot.exists) {
                                setUser(snapshot.data() as User);
                            }
                            setIsInitializing(false);
                        },
                        (error) => {
                            console.error("Error fetching user document with onSnapshot:", error);
                            setUser(null);
                            setIsInitializing(false);
                        }
                    );
                } catch (error) {
                    console.error("Error getting or creating user document:", error);
                    setUser(null);
                    setIsInitializing(false);
                }

            } else {
                setUser(null);
                setIsInitializing(false);
            }
        });
        
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