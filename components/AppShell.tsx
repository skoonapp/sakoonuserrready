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

// --- Lazy Load Views for Code Splitting ---
const HomeView = lazy(() => import('./Listeners'));
const CallsView = lazy(() => import('./Services'));
const ChatsView = lazy(() => import('./LiveFeedback'));
const ProfileView = lazy(() => import('./About'));
const AICompanion = lazy(() => import('./AICompanion'));
const TermsAndConditions = lazy(() => import('./TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
const CancellationRefundPolicy = lazy(() => import('./CancellationRefundPolicy'));

// --- Icons for Install Banner ---
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

    // --- Centralized Payment State ---
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
    const [paymentDescription, setPaymentDescription] = useState('');
    const [foregroundNotification, setForegroundNotification] = useState<{ title: string; body: string } | null>(null);
    const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
    
    // --- Session State ---
    const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);
    const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
    
    // --- Navigation & Swipe State ---
    const [activeIndex, setActiveIndex] = useState(1);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null); // For vertical vs horizontal detection
    const [touchDeltaX, setTouchDeltaX] = useState(0);
    const [isSwiping, setIsSwiping] = useState<boolean | null>(null); // null: undecided, true: horizontal, false: vertical
    const viewsContainerRef = useRef<HTMLDivElement>(null);


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
    
    useEffect(() => {
        window.history.replaceState({ activeIndex: 0 }, '');
        window.history.pushState({ activeIndex: 1 }, '');
        const handlePopState = (event: PopStateEvent) => {
            const newIndex = event.state?.activeIndex ?? 0;
            setActiveIndex(newIndex);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (!user || !messaging) return;
        const setupNotifications = async () => {
            try {
                // FIX: Use `window.Notification` to access the browser's native Notification API.
                // The imported `Notification` component was shadowing the global API, causing the error.
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
                });
                setTimeout(() => setForegroundNotification(null), 6000);
            }
        });
        return () => {
            clearTimeout(timer);
            unsubscribeOnMessage();
        };
    }, [user]);

    // --- Handlers ---
    
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
        // --- CHAT SESSION LOGIC ---
        if (type === 'chat') {
            if (user && (user.freeMessagesRemaining || 0) > 0) {
                setActiveChatSession({ type: 'chat', listener, plan: { duration: 'Free Trial', price: 0 }, sessionDurationSeconds: 3 * 3600, associatedPlanId: `free_trial_${user.uid}`, isTokenSession: false, isFreeTrial: true });
                return;
            }
            
            const activePlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > Date.now());
            const dtPlan = activePlans.find(p => p.type === 'chat' && (p.messages || 0) > 0);
    
            if (dtPlan) {
                const session = { listener, plan: { duration: dtPlan.name || 'Plan', price: dtPlan.price || 0 }, associatedPlanId: dtPlan.id, isTokenSession: false };
                setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
            } else {
                // Token check for chat
                const canUseTokens = (wallet.tokens || 0) >= 0.5;
                if (canUseTokens) {
                    const session = { listener, plan: { duration: 'MT', price: 0 }, associatedPlanId: `mt_session_${Date.now()}`, isTokenSession: true };
                    setActiveChatSession({ ...session, type: 'chat', sessionDurationSeconds: 3 * 3600 });
                } else {
                    setShowRechargeModal(true);
                }
            }
        // --- CALL SESSION LOGIC ---
        } else if (type === 'call') {
            try {
                // Check microphone permission status first.
                if (navigator.permissions) {
                    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                    if (permissionStatus.state === 'denied') {
                        showNotification('Microphone Blocked', 'To make calls, please enable microphone access in your browser settings for this site.');
                        return;
                    }
                }
                
                // Request microphone access. This will prompt if not yet granted.
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Permission granted, stop the track immediately.
                stream.getTracks().forEach(track => track.stop());
    
            } catch (error) {
                console.error('Microphone permission was not granted:', error);
                showNotification('Microphone Required', 'Microphone access is required to make calls. Please allow access and try again.');
                return;
            }
    
            // --- Call plan logic (runs only if permission is granted) ---
            const activePlans = (wallet.activePlans || []).filter(p => p.expiryTimestamp > Date.now());
            const dtPlan = activePlans.find(p => p.type === 'call' && (p.minutes || 0) > 0);
    
            if (dtPlan) {
                const session = { listener, plan: { duration: dtPlan.name || 'Plan', price: dtPlan.price || 0 }, associatedPlanId: dtPlan.id, isTokenSession: false };
                const durationSeconds = (dtPlan.minutes || 0) * 60;
                setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: durationSeconds });
            } else {
                // Token check for call
                const canUseTokens = (wallet.tokens || 0) >= 2;
                if (canUseTokens) {
                    const session = { listener, plan: { duration: 'MT', price: 0 }, associatedPlanId: `mt_session_${Date.now()}`, isTokenSession: true };
                    const maxMinutes = Math.floor((wallet.tokens || 0) / 2); // 2 MT per minute
                    const durationSeconds = maxMinutes * 60;
                    setActiveCallSession({ ...session, type: 'call', sessionDurationSeconds: durationSeconds });
                } else {
                    setShowRechargeModal(true);
                }
            }
        }
    }, [wallet, user, showNotification]);
    
    const handleCallSessionEnd = useCallback(async (success: boolean, consumedSeconds: number) => {
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
                } catch (error) {
                    console.error("Error finalizing call session:", error);
                }
            }
        }
        setActiveCallSession(null);
    }, [user, activeCallSession]);

    const handleChatSessionEnd = useCallback(async (success: boolean, consumedMessages: number) => {
        if (user && activeChatSession) {
            if (success && consumedMessages > 0 && !activeChatSession.isFreeTrial) {
                try {
                    const finalizeChat = functions.httpsCallable('finalizeChatSession');
                    await finalizeChat({
                        consumedMessages,
                        listenerName: activeChatSession.listener.name
                    });
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
    
    // --- Swipe Handlers ---
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (activeCallSession || activeChatSession || showAICompanion || showPolicy || showRechargeModal || paymentSessionId) {
            return;
        }
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
        setIsSwiping(null);
        setTouchDeltaX(0);
        if (viewsContainerRef.current) {
            viewsContainerRef.current.style.transition = 'none';
        }
    }, [activeCallSession, activeChatSession, showAICompanion, showPolicy, showRechargeModal, paymentSessionId]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStartX === null || touchStartY === null) return;

        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;
        
        let currentIsSwiping = isSwiping;

        if (currentIsSwiping === null) {
            // Decide direction based on the first significant movement
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                currentIsSwiping = Math.abs(deltaX) > Math.abs(deltaY);
                setIsSwiping(currentIsSwiping);
            }
        }
        
        if (currentIsSwiping === true) { // If it's a horizontal swipe
            e.preventDefault();
            if ((activeIndex === 0 && deltaX > 0) || (activeIndex === views.length - 1 && deltaX < 0)) {
                setTouchDeltaX(deltaX / 4); // Resistance at edges
            } else {
                setTouchDeltaX(deltaX);
            }
        }
    }, [touchStartX, touchStartY, activeIndex, isSwiping, views.length]);

    const handleTouchEnd = useCallback(() => {
        if (viewsContainerRef.current) {
            viewsContainerRef.current.style.transition = 'transform 0.3s ease-in-out';
        }

        if (isSwiping) { // Only process the end of a horizontal swipe
            const swipeThreshold = 50;
            if (touchDeltaX > swipeThreshold && activeIndex > 0) {
                navigateTo(activeIndex - 1);
            } else if (touchDeltaX < -swipeThreshold && activeIndex < views.length - 1) {
                navigateTo(activeIndex + 1);
            }
        }
        
        setTouchStartX(null);
        setTouchStartY(null);
        setTouchDeltaX(0);
        setIsSwiping(null);
    }, [isSwiping, touchDeltaX, activeIndex, navigateTo, views.length]);


    const renderViewByIndex = useCallback((index: number) => {
        switch (index) {
            case 0: return <HomeView currentUser={user} wallet={wallet} onPurchase={handlePurchase} loadingPlan={loadingPlan} />;
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
    }, [user, wallet, loadingPlan, handlePurchase, handleStartSession, deferredInstallPrompt, handleInstallClick, handleLogout, isDarkMode, toggleDarkMode, showNotification]);

    if (wallet.loading) return <SplashScreen />;
    if (activeCallSession) return <CallUI session={activeCallSession} user={user} onLeave={handleCallSessionEnd} />;
    if (activeChatSession) return <ChatUI session={activeChatSession} user={user} onLeave={handleChatSessionEnd} />;

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-100 dark:bg-slate-950 flex flex-col h-screen shadow-2xl transition-colors duration-300 overflow-hidden">
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
                <Suspense fallback={<ViewLoader />}>
                     <div
                        ref={viewsContainerRef}
                        className="flex h-full transition-transform duration-300 ease-in-out"
                        style={{ 
                            transform: `translateX(calc(-${activeIndex * 100}% + ${touchDeltaX}px))`
                        }}
                    >
                        {views.map((viewName, index) => (
                            <div 
                                key={viewName} 
                                className="w-full h-full flex-shrink-0"
                                aria-hidden={activeIndex !== index}
                            >
                                <div className="w-full h-full overflow-y-auto no-scrollbar">
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
            <AICompanionButton onClick={() => setShowAICompanion(true)} />
            
            <Suspense fallback={<div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center"><ViewLoader /></div>}>
                {showAICompanion && <AICompanion user={user} onClose={() => setShowAICompanion(false)} onNavigateToServices={() => { navigateTo(1); setShowAICompanion(false); }} />}
                {showPolicy === 'terms' && <TermsAndConditions onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'privacy' && <PrivacyPolicy onClose={() => setShowPolicy(null)} />}
                {showPolicy === 'cancellation' && <CancellationRefundPolicy onClose={() => setShowPolicy(null)} />}
            </Suspense>

            {showRechargeModal && (
                <RechargeModal onClose={() => setShowRechargeModal(false)} onNavigateHome={() => { navigateTo(0); setShowRechargeModal(false); }} />
            )}
            
            {paymentSessionId && <CashfreeModal paymentSessionId={paymentSessionId} onClose={handleModalClose} />}
        </div>
    );
};

export default AppShell;