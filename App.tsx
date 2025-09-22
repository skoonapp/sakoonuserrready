import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { auth, db } from './utils/firebase';
import type { User } from './types';

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
        const unsubscribeAuth = auth.onAuthStateChanged(firebaseUser => {
            unsubscribeUser();
            if (firebaseUser) {
                const userDocRef = db.collection('users').doc(firebaseUser.uid);
                unsubscribeUser = userDocRef.onSnapshot(doc => {
                    if (doc.exists) {
                        setUser(doc.data() as User);
                    } else {
                        // Create a new user document if it doesn't exist
                        const newUser: User = { uid: firebaseUser.uid, name: firebaseUser.displayName || 'New User', email: firebaseUser.email, mobile: firebaseUser.phoneNumber || '', favoriteListeners: [], tokens: 0, activePlans: [], freeMessagesRemaining: 5, hasSeenWelcome: false };
                        userDocRef.set(newUser, { merge: true });
                        setUser(newUser);
                    }
                    setIsInitializing(false);
                }, error => {
                    console.error("Error fetching user document:", error);
                    setUser(null);
                    setIsInitializing(false);
                });
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