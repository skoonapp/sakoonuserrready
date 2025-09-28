import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react';
import type { User, Listener, CallSession, ChatSession, ActiveView, Plan } from '../types';
import { auth, db, functions, messaging } from '../utils/firebase';
import { useWallet } from '../hooks/useWallet';
import { paymentService } from '../services/paymentService';

// Import Components
import SplashScreen from './SplashScreen';
import Header from './Header';
import Footer from './Footer';
import AICompanionButton from './AICompanionButton';
import CallUI from './CallUI';
import ChatUI from './ChatUI';
import RechargeModal from './RechargeModal';
import ViewLoader from './ViewLoader';
import CashfreeModal from './CashfreeModal';
import Notification from './Notification';
import PullToRefresh from './PullToRefresh';
import PresenceManager from './PresenceManager';

// --- Lazy Load Views for Code Splitting ---
const HomeView = lazy(() => import('./Listeners'));
const CallsView = lazy(() => import('./Services'));
const ChatsView = lazy(() => import('./LiveFeedback'));
const ProfileView = lazy(() => import('./About'));
const AICompanion = lazy(() => import('./AICompanion'));
const TermsAndConditions = lazy(() => import('./TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
const CancellationRefundPolicy = lazy(() => import('./CancellationRefundPolicy'));
const RatingModal = lazy(() => import('./RatingModal'));


// --- Icons for Install Banner & Notifications ---
const InstallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 1.5a.75.75 0 01.75.75V12h-1.5V2.25A.75.75 0 0112 1.5z" />
        <path fillRule="evenodd" d="M3.75 13.5a.75.75 0 00-1.5 0v4.5a3 3 0 003 3h10.5a3 3 0 003-3v-4.5a.75.75 0 00-1.5 0v4.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-4.5zm5.03-3.03a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l2.25-2.25a.75.75 0 10-1.06-1.06L12 12.69 8.78 9.47z" clipRule="evenodd" />
    </svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);

interface AppShellProps {
    user: User;
}

const views: ActiveView[] = ['home', 'calls', 'chats', 'profile'];

const AppShell: React.FC<AppShellProps> = ({ user }) => {
    const wallet = useWallet(user);

    // --- PWA & Layout State ---
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // --- UI State ---
    const [showAICompanion, setShowAICompanion] = useState(false);
    const [showPolicy, setShowPolicy] = useState<'terms' | 'privacy' | 'cancellation' | null>(null);
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [rechargeContextListener, setRechargeContextListener] = useState<Listener | null>(null);
    const [sessionToRate, setSessionToRate] = useState<Listener | null>(null);


    // --- Centralized Payment State ---
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
    const [paymentDescription, setPaymentDescription] = useState('');
    const [foregroundNotification, setForegroundNotification] = useState<{ title: string; body: string; type?: string } | null>(null);
    const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
    
    // --- Session State ---
    const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
    
    // --- Navigation & Swipe State ---
    const [activeIndex, setActiveIndex] = useState(1);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [isSwiping, setIsSwiping] = useState<boolean | null>(null);
    const touchDeltaXRef = useRef(0);
    const viewsContainerRef = useRef<HTMLDivElement>(null);

    // --- Pull to Refresh State ---
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullStart, setPullStart] = useState<number | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const PULL_THRESHOLD = 80;


    // --- Effects ---
    
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    useEffect(() => {
        const expiryString = localStorage.getItem('pwaInstallDismissedExpiry');
        if (expiryString && new Date().getTime() > Number(expiryString)) {
            localStorage.removeItem('pwaInstallDismissed');
            localStorage.removeItem('pwaInstallDismissedExpiry');
        }
        const isDismissed = localStorage.getItem('pwaInstallDismissed');
        setShowInstallBanner(!!deferredInstallPrompt && !isDismissed);
    }, [deferredInstallPrompt]);
    
    useEffect(() => {
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && prefersDarkMode)) {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        }
    }, []);

    // Effect for FCM Notifications
    useEffect(() => {
        if (!user || !messaging) return;
        const setupNotifications = async () => {
            try {
                // Use `window.Notification` to access the browser's native Notification API.
                if (window.Notification.permission === 'granted') {
                    const currentToken = await messaging.getToken();
                    if (currentToken && user.fcmToken !== currentToken) {
                        await db.collection('users').doc(user.uid).update({ fcmToken: currentToken });
                    }
                } else if (window.Notification.permission !== 'denied') {
                    const permission = await window.Notification.requestPermission();
                    if (permission === 'granted') {
                       const currentToken = await messaging.getToken();
                       await db.collection('users').doc(user.uid).update({ fcmToken: currentToken });
                    }
                }
            } catch (err) {
                console.error('An error occurred while setting up notifications.', err);
            }
        };
        const timer = setTimeout(setupNotifications, 5000);
        const unsubscribeOnMessage = messaging.onMessage((payload) => {
            if (payload.notification) {
                setForegroundNotification({
                    title: payload.notification.title || 'New Notification',
                    body: payload.notification.body || '',
                    type: payload.data?.type,
                });
                setTimeout(() => setForegroundNotification(null), 6000);
            }
        });
        return () => {
            clearTimeout(timer);
            unsubscribeOnMessage();
        };
    }, [user]);

    // Effect to play sound for foreground notifications
    useEffect(() => {
        if (foregroundNotification) {
            let soundUrl;
            if (foregroundNotification.type === 'call') {
                soundUrl = 'https://actions.google.com/sounds/v1/communication/voip_call_tone.ogg';
            } else if (foregroundNotification.type === 'chat') {
                soundUrl = 'https://actions.google.com/sounds/v1/notifications/light_touch.ogg';
            }

            if (soundUrl) {
                const audio = new Audio(soundUrl);
                audio.play().catch(e => console.error("Error playing notification sound:", e));
            }
        }
    }, [foregroundNotification]);
    
    const navigateTo = useCallback((newIndex: number) => {
        const currentIndex = activeIndex;
        if (newIndex === currentIndex) return;

        if (currentIndex === 0 && newIndex > 0) {
            window.history.pushState({ activeIndex: newIndex }, '');
        } else if (currentIndex > 0 && newIndex > 0) {
            window.history.replaceState({ activeIndex: newIndex }, '');
        } else if (currentIndex > 0 && newIndex === 0) {
            window.history.back();
            return;
        }
        setActiveIndex(newIndex);
    }, [activeIndex]);

    // --- History Management for Back Button ---
    const historyDidSetup = useRef(false);
    useEffect(() => {
        // This setup runs only ONCE.
        if (!historyDidSetup.current) {
            window.history.replaceState({ activeIndex: 0 }, ''); // Base state
            window.history.pushState({ activeIndex: 1 }, ''); // Initial view state
            historyDidSetup.current = true;
        }

        const handlePopState = (event: PopStateEvent) => {
            // The listener's closure has the latest `showAICompanion` value because the effect re-runs when it changes.
            if (showAICompanion) {
                setShowAICompanion(false); // Close the modal.
                navigateTo(1); // Navigate to the 'Calls' view as requested.
                return; // Prevent the default view navigation logic from running.
            }
            
            // Default logic for view navigation.
            const newIndex = event.state?.activeIndex ?? 0;
            setActiveIndex(newIndex);
        };
        
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
        
    }, [showAICompanion, navigateTo]);


    // --- Handlers ---
    
    // NEW: Handlers for AI Companion with history management.
    const handleOpenAICompanion = useCallback(() => {
        window.history.pushState({ modal: 'ai' }, '');
        setShowAICompanion(true);
    }, []);
    
    const handleCloseAICompanion = useCallback(() => {
        // If the modal state is in history, go back to trigger the popstate listener.
        if (window.history.state?.modal === 'ai') {
            window.history.back();
        } else {
            // Fallback just in case.
            setShowAICompanion(false);
        }
    }, []);

    const showNotification = useCallback((title: string, message: string) => {
        setNotification({ title, message });
    }, []);

    const handleInstallClick = useCallback(() => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then(() => {
                setDeferredInstallPrompt(null);
                setShowInstallBanner(false);
            });
        }
    }, [deferredInstallPrompt]);
    
    const handleInstallDismiss = useCallback(() => {
        const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('pwaInstallDismissed', 'true');
        localStorage.setItem('pwaInstallDismissedExpiry', String(expiry));
        setShowInstallBanner(false);
    }, []);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => {
            const newIsDark = !prev;
            if (newIsDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return newIsDark;
        });
    }, []);
    
    const handleLogout = useCallback(() => auth.signOut(), []);
    
    const handleStartSession = useCallback(async (type: 'call' | 'chat', listener: Listener) => {
        if (!user) return; // अगर यूज़र लॉग इन नहीं है, तो कुछ न करें।
        
        // --- चैट सेशन का लॉजिक ---
        if (type === 'chat') {
            // स्टेप 1: मुफ़्त मैसेज चेक करें।
            if ((user.freeMessagesRemaining || 0) > 0) {
                // अगर मुफ़्त मैसेज हैं, तो सीधे चैट शुरू करें।
                setActiveChatSession({ type: 'chat', listener, plan: { duration: 'Free Trial', price: 0 }, sessionDurationSeconds: 3 * 3600, associatedPlanId: `free_trial_${user.uid}`, isTokenSession: false, isFreeTrial: true });
                return;
            }
            
            // स्टेप 2: खरीदे हुए DT चैट प्लान चेक करें।
            const activePlans = (user.activePlans || []).filter(p => p.expiryTimestamp > Date.now());
            const dtPlan = activePlans.find(p => p.type === 'chat' && (p.messages || 0) > 0);
    
            if (dtPlan) {
                // अगर DT प्लान है, तो उससे चैट शुरू करें।
                const session = { listener, plan: { duration: dtPlan.name || 'Plan', price: dtPlan.price || 0 }, associatedPlanId: dtPlan.id, isTokenSession: false };
                setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
            } else {
                // स्टेप 3: MT टोकन चेक करें। (1 MT में 2 मैसेज, तो 0.5 MT चाहिए)
                const canUseTokens = (user.tokens || 0) >= 0.5;
                if (canUseTokens) {
                    // अगर MT हैं, तो उनसे चैट शुरू करें।
                    const session = { listener, plan: { duration: 'MT', price: 0 }, associatedPlanId: `mt_session_${Date.now()}`, isTokenSession: true };
                    setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
                } else {
                    // स्टेप 4: अगर कुछ नहीं है, तो रिचार्ज का पॉप-अप दिखाएं।
                    setRechargeContextListener(listener);
                    setShowRechargeModal(true);
                }
            }
        // --- कॉल सेशन का लॉजिक ---
        } else if (type === 'call') {
            try {
                // कॉल करने से पहले, माइक्रोफोन की परमिशन मांगें।
                if (navigator.permissions) {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    if (permissionStatus.state === 'denied') {
                        showNotification('Microphone Blocked', 'कॉल करने के लिए, कृपया ब्राउज़र सेटिंग्स में माइक्रोफोन को अनुमति दें।');
                        return;
                    }
                }
                
                // परमिशन मांगें। अगर नहीं दी है तो पॉप-अप आएगा।
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // परमिशन मिलते ही उसे बंद कर दें, क्योंकि हमें सिर्फ परमिशन चाहिए थी।
                stream.getTracks().forEach(track => track.stop());
    
            } catch (error) {
                console.error('Microphone permission was not granted:', error);
                showNotification('Microphone Required', 'कॉल करने के लिए माइक्रोफोन की अनुमति ज़रूरी है।');
                return;
            }
    
            // --- कॉल प्लान का लॉजिक (सिर्फ परमिशन मिलने पर चलेगा) ---
            // स्टेप 1: खरीदे हुए DT कॉल प्लान चेक करें।
            const activePlans = (user.activePlans || []).filter(p => p.expiryTimestamp > Date.now());
            const dtPlan = activePlans.find(p => p.type === 'call' && (p.minutes || 0) > 0);
    
            if (dtPlan) {
                // अगर DT प्लान है, तो उससे कॉल शुरू करें।
                const session = { listener, plan: { duration: dtPlan.name || 'Plan', price: dtPlan.price || 0 }, associatedPlanId: dtPlan.id, isTokenSession: false };
                const durationSeconds = (dtPlan.minutes || 0) * 60;
                setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: durationSeconds });
            } else {
                // स्टेप 2: MT टोकन चेक करें। (1 मिनट के लिए 2 MT चाहिए)
                const canUseTokens = (user.tokens || 0) >= 2;
                if (canUseTokens) {
                    // अगर MT हैं, तो उनसे कॉल शुरू करें।
                    const session = { listener, plan: { duration: 'MT', price: 0 }, associatedPlanId: `mt_session_${Date.now()}`, isTokenSession: true };
                    const maxMinutes = Math.floor((user.tokens || 0) / 2); // 2 MT प्रति मिनट
                    const durationSeconds = maxMinutes * 60;
                    setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: durationSeconds });
                } else {
                    // स्टेप 3: अगर कुछ नहीं है, तो रिचार्ज का पॉप-अप दिखाएं।
                    setRechargeContextListener(listener);
                    setShowRechargeModal(true);
                }
            }
        }
    }, [user, showNotification]);
    
    const handleCallSessionEnd = useCallback(async (success: boolean, consumedSeconds: number, listener: Listener) => {
        if (user && activeCallSession) {
            if (success && consumedSeconds > 5) {
                try {
                    const finalizeCall = functions.httpsCallable('finalizeCallSession');
                    await finalizeCall({
                        consumedSeconds,
                        associatedPlanId: activeCallSession.associatedPlanId,
                        isTokenSession: activeCallSession.isTokenSession,
                        listenerName: activeCallSession.listener.name
                    });
                    setSessionToRate(listener);
                } catch (error) {
                    console.error("Error finalizing call session:", error);
                }
            }
        }
        setActiveCallSession(null);
    }, [user, activeCallSession]);

    const handleChatSessionEnd = useCallback(async (success: boolean, consumedMessages: number, listener: Listener) => {
        if (user && activeChatSession) {
            if (success && consumedMessages > 0 && !activeChatSession.isFreeTrial) {
                try {
                    const finalizeChat = functions.httpsCallable('finalizeChatSession');
                    await finalizeChat({
                        consumedMessages,
                        associatedPlanId: activeChatSession.associatedPlanId,
                        isTokenSession: activeChatSession.isTokenSession,
                        listenerName: activeChatSession.listener.name
                    });
                    setSessionToRate(listener);
                } catch(error) {
                    console.error("Error finalizing chat session:", error);
                }
            }
        }
        setActiveChatSession(null);
    }, [user, activeChatSession]);

    const handlePurchase = useCallback(async (plan: Plan | { tokens: number; price: number }) => {
        const isTokenPlan = 'tokens' in plan;
        const planKey = isTokenPlan ? `mt_${plan.tokens}` : `${plan.type}_${plan.name}`;
        
        setLoadingPlan(planKey);
        setFeedback(null);
        try {
            let sessionId;
            if (isTokenPlan) {
                sessionId = await paymentService.buyTokens(plan.tokens, plan.price);
                setPaymentDescription(`${plan.tokens} MT`);
            } else {
                sessionId = await paymentService.buyDTPlan(plan);
                setPaymentDescription(plan.name || 'Plan');
            }
            setPaymentSessionId(sessionId);
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Payment failed to start: ${error.message || 'Please check your connection and try again.'}` });
            setTimeout(() => setFeedback(null), 5000);
        } finally {
            setLoadingPlan(null);
        }
    }, []);
    
    const handleModalClose = useCallback((status: 'success' | 'failure' | 'closed') => {
        if (status === 'success') {
            setFeedback({ type: 'success', message: `Payment for ${paymentDescription} is processing! Your balance will update shortly.` });
        } else if (status === 'failure') {
            setFeedback({ type: 'error', message: 'Payment failed. Please try again.' });
        }
        setPaymentSessionId(null);
        setPaymentDescription('');
        setTimeout(() => setFeedback(null), 5000);
    }, [paymentDescription]);
    
    // --- Combined Gesture Handlers for Swipe and Pull-to-Refresh ---

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (activeCallSession || activeChatSession || showAICompanion || showPolicy || showRechargeModal || paymentSessionId || isRefreshing) {
            return;
        }

        // For PTR
        const isPtrEnabled = [0, 1, 2].includes(activeIndex);
        const activeScrollView = document.getElementById(`scroll-view-${activeIndex}`);
        if (isPtrEnabled && activeScrollView && activeScrollView.scrollTop === 0) {
            setPullStart(e.targetTouches[0].clientY);
        } else {
            setPullStart(null);
        }

        // For Swipe
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
        setIsSwiping(null);
        touchDeltaXRef.current = 0;
        if (viewsContainerRef.current) {
            viewsContainerRef.current.style.transition = 'none';
        }
    }, [activeIndex, activeCallSession, activeChatSession, showAICompanion, showPolicy, showRechargeModal, paymentSessionId, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStartX === null || touchStartY === null || isRefreshing) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;

        if (isSwiping === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
            setIsSwiping(Math.abs(deltaX) > Math.abs(deltaY));
        }
        
        if (isSwiping === true) {
            setPullStart(null);
            setPullDistance(0);
            
            let resistanceDelta = deltaX;
            if ((activeIndex === 0 && deltaX > 0) || (activeIndex === views.length - 1 && deltaX < 0)) {
                resistanceDelta = deltaX / 4;
            }
            touchDeltaXRef.current = resistanceDelta;
            if (viewsContainerRef.current) {
                viewsContainerRef.current.style.transform = `translateX(calc(-${activeIndex * 100}% + ${resistanceDelta}px)) translateY(0px)`;
            }
        } else if (isSwiping === false && pullStart !== null) {
            const isPtrEnabled = [0, 1, 2].includes(activeIndex);
            if (isPtrEnabled && deltaY > 0) {
                const resistedDistance = Math.pow(deltaY, 0.85);
                setPullDistance(resistedDistance);
            } else {
                 setPullStart(null);
                 setPullDistance(0);
            }
        }
    }, [touchStartX, touchStartY, activeIndex, isSwiping, pullStart, isRefreshing, views.length]);

    const handleTouchEnd = useCallback(() => {
        // Apply transition for animations after the gesture ends.
        if (viewsContainerRef.current) {
            viewsContainerRef.current.style.transition = 'transform 0.3s ease-in-out';
        }
    
        // --- Pull-to-Refresh End Logic ---
        // Check if the user pulled down far enough and wasn't swiping horizontally.
        if (pullStart !== null && pullDistance > PULL_THRESHOLD && isSwiping === false) {
            setIsRefreshing(true);
            
            // Simulate a refresh. Since the app's data is already real-time via Firestore's
            // onSnapshot listeners, this provides the user with the expected visual feedback
            // of a refresh without a jarring full-page reload.
            setTimeout(() => {
                setIsRefreshing(false);
                setPullDistance(0); // Animate the view back to its original position.
            }, 1500); // A 1.5-second delay feels like a real refresh.
    
        } else {
            // If not refreshing, ensure the view snaps back to its original vertical position.
            setPullDistance(0);
        }
    
        // --- Swipe Navigation End Logic ---
        if (isSwiping === true) {
            const swipeThreshold = viewsContainerRef.current ? viewsContainerRef.current.clientWidth / 4 : 50;
            const finalDeltaX = touchDeltaXRef.current;
    
            if (finalDeltaX > swipeThreshold && activeIndex > 0) {
                // Swipe right to go to the previous view.
                navigateTo(activeIndex - 1);
            } else if (finalDeltaX < -swipeThreshold && activeIndex < views.length - 1) {
                // Swipe left to go to the next view.
                navigateTo(activeIndex + 1);
            } else {
                // If the swipe was not far enough, snap back to the current view.
                if (viewsContainerRef.current) {
                    viewsContainerRef.current.style.transform = `translateX(-${activeIndex * 100}%)`;
                }
            }
        }
        
        // Reset all gesture tracking states for the next interaction.
        setTouchStartX(null);
        setTouchStartY(null);
        setIsSwiping(null);
        setPullStart(null);
        touchDeltaXRef.current = 0;
    }, [isSwiping, pullStart, pullDistance, activeIndex, navigateTo, views.length]);


    const renderViewByIndex = useCallback((index: number) => {
        switch (index) {
            case 0: return <HomeView currentUser={user} onPurchase={handlePurchase} loadingPlan={loadingPlan} />;
            case 1: return <CallsView onStartSession={handleStartSession} currentUser={user} showNotification={showNotification} />;
            case 2: return <ChatsView onStartSession={handleStartSession} currentUser={user} showNotification={showNotification} />;
            case 3: return <ProfileView 
                            currentUser={user}
                            onShowTerms={() => setShowPolicy('terms')}
                            onShowPrivacyPolicy={() => setShowPolicy('privacy')}
                            onShowCancellationPolicy={() => setShowPolicy('cancellation')}
                            deferredPrompt={deferredInstallPrompt}
                            onInstallClick={handleInstallClick}
                            onLogout={handleLogout}
                            isDarkMode={isDarkMode}
                            toggleDarkMode={toggleDarkMode}
                        />;
            default: return null;
        }
    }, [user, loadingPlan, handlePurchase, handleStartSession, deferredInstallPrompt, handleInstallClick, handleLogout, isDarkMode, toggleDarkMode, showNotification]);

    if (activeCallSession) return <CallUI session={activeCallSession} user={user} onLeave={handleCallSessionEnd} />;
    if (activeChatSession) return <ChatUI session={activeChatSession} user={user} onLeave={handleChatSessionEnd} onStartCall={(listener) => handleStartSession('call', listener)} />;

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-950 flex flex-col h-screen shadow-2xl transition-colors duration-300 overflow-hidden">
            <PresenceManager user={user} />
            <Header wallet={wallet} />
            
            {notification && (
                <Notification
                    title={notification.title}
                    message={notification.message}
                    onClose={() => setNotification(null)}
                />
            )}
            
            {feedback && (
                <div className={`fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 p-3 rounded-lg text-center font-semibold animate-fade-in-down ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
                    {feedback.message}
                </div>
            )}

            {foregroundNotification && (
                 <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 p-4 rounded-xl text-left animate-fade-in-down bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setForegroundNotification(null)}>
                    <div className="flex items-start gap-3">
                        <div className="bg-cyan-100 dark:bg-cyan-900/50 p-2 rounded-full mt-1 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{foregroundNotification.title}</h3>
                            <p className="font-normal text-sm text-slate-600 dark:text-slate-300">{foregroundNotification.body}</p>
                        </div>
                         <button onClick={(e) => { e.stopPropagation(); setForegroundNotification(null); }} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" aria-label="Close notification"><CloseIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            )}

            <main 
                className="relative flex-grow overflow-hidden pt-16 pb-16"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={PULL_THRESHOLD} />
                <Suspense fallback={<ViewLoader />}>
                     <div
                        ref={viewsContainerRef}
                        className="flex h-full"
                        style={{ 
                            transform: `translateX(-${activeIndex * 100}%) translateY(${isRefreshing ? PULL_THRESHOLD : pullDistance}px)`,
                            transition: pullStart === null || isRefreshing === false ? 'transform 0.3s ease-in-out' : 'none',
                        }}
                    >
                        {views.map((viewName, index) => (
                            <div 
                                key={viewName} 
                                className="w-full h-full flex-shrink-0"
                                aria-hidden={activeIndex !== index}
                            >
                                <div id={`scroll-view-${index}`} className="w-full h-full overflow-y-auto no-scrollbar">
                                    {renderViewByIndex(index)}
                                </div>
                            </div>
                        ))}
                    </div>
                </Suspense>
            </main>
            
            <Footer activeIndex={activeIndex} setActiveIndex={navigateTo} />
            
            {/* --- Modals and Overlays --- */}
            {showInstallBanner && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40 animate-fade-in-up">
                    <button onClick={handleInstallClick} className="w-full text-left bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-2xl p-2.5 flex items-center gap-3 text-white relative transition-transform hover:scale-105">
                        <div className="bg-white/20 p-2 rounded-full shrink-0"><InstallIcon className="w-5 h-5" /></div>
                        <div className="flex-grow">
                            <p className="font-bold text-sm">Install SakoonApp</p>
                            <p className="text-xs opacity-90">Add to home screen for quick access.</p>
                        </div>
                        <span className="bg-white text-cyan-700 font-bold py-1.5 px-3 rounded-lg text-xs shrink-0">Install</span>
                        <button onClick={(e) => { e.stopPropagation(); handleInstallDismiss(); }} className="absolute -top-2 -right-2 bg-slate-800/50 rounded-full p-1 hover:bg-slate-800/80 transition-colors" aria-label="Dismiss install banner"><CloseIcon className="w-4 h-4 text-white" /></button>
                    </button>
                </div>
            )}
            <AICompanionButton onClick={handleOpenAICompanion} />
            
            <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><ViewLoader /></div>}>
                {showAICompanion && <AICompanion user={user} onClose={handleCloseAICompanion} onNavigateToServices={() => { handleCloseAICompanion(); navigateTo(1); }} />}
                {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
                {sessionToRate && <RatingModal listener={sessionToRate} onClose={() => setSessionToRate(null)} />}
            </Suspense>

            {showRechargeModal && (
                <RechargeModal 
                    listener={rechargeContextListener}
                    onClose={() => {
                        setShowRechargeModal(false);
                        setRechargeContextListener(null);
                    }} 
                    onNavigateHome={() => { 
                        navigateTo(0); 
                        setShowRechargeModal(false);
                        setRechargeContextListener(null);
                    }} 
                />
            )}
            
            {paymentSessionId && <CashfreeModal paymentSessionId={paymentSessionId} onClose={handleModalClose} />}
        </div>
    );
};

export default AppShell;