import React, { useState, useEffect } from 'react';
import { useAuthHandler } from '../hooks/useAuthHandler';

// --- Icon Components ---
const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);
const LockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);
const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.534-11.082-8.464l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 31.134 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
);
// --- Icons for the new security batch ---
const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.661 2.231a.75.75 0 01.678 0 11.947 11.947 0 007.078 2.751.75.75 0 01.715.523 12.003 12.003 0 01-7.792 11.75.75.75 0 01-.542 0A12.003 12.003 0 012 5.505a.75.75 0 01.715-.523 11.947 11.947 0 007.078-2.751zM10.47 12.14a.75.75 0 00-1.06 0l-2.25 2.25a.75.75 0 101.06 1.06L10 13.768l1.72 1.72a.75.75 0 101.06-1.06l-2.25-2.25z" clipRule="evenodd" />
    </svg>
);
const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M11.983 1.904a3.003 3.003 0 00-3.966 0L7.43 2.525a3 3 0 00-1.59 2.319l-.366 3.24-2.887 1.238a3 3 0 00-1.68 2.534v.373a3 3 0 001.58 2.653l2.84 1.638-.59 2.946a3 3 0 002.23 3.328l3.125.625a3 3 0 003.328-2.23l.59-2.946 2.84-1.638a3 3 0 001.58-2.653v-.373a3 3 0 00-1.68-2.534l-2.887-1.238-.366-3.24a3 3 0 00-1.59-2.319L11.983 1.904zM10 6a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0v-.01A.75.75 0 0110 6zm.354 2.646a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.06-1.06L8.94 9.06a.75.75 0 011.06 0l.354.354z" />
    </svg>
);
const PadlockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);
// --- End Icon Components ---


const LoginScreen: React.FC = () => {
    const [step, setStep] = useState<'form' | 'otp'>('form');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    
    // Resend OTP State
    const [resendTimer, setResendTimer] = useState(60);
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [resendAttempts, setResendAttempts] = useState(0);
    
    const { loading, error, signInWithGoogle, sendOtpToPhone, verifyOtp, clearError } = useAuthHandler();
    
    // OTP Countdown Timer Effect
    useEffect(() => {
        let interval: number;
        if (step === 'otp' && resendTimer > 0) {
            setCanResendOtp(false);
            interval = window.setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        } else if (step === 'otp' && resendTimer === 0) {
            setCanResendOtp(true);
        }

        return () => {
            if (interval) {
                window.clearInterval(interval);
            }
        };
    }, [step, resendTimer]);


    const onPhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Reset resend state for a new submission attempt
        setResendTimer(60);
        setCanResendOtp(false);
        setResendAttempts(0);

        const success = await sendOtpToPhone(phoneNumber);
        if (success) {
            setStep('otp');
        }
    };

    const onOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await verifyOtp(otp);
    };

    const handleResendOtp = async () => {
        if (!canResendOtp || resendAttempts >= 2 || loading) return;

        setCanResendOtp(false);
        const success = await sendOtpToPhone(phoneNumber);

        if (success) {
            const newAttempts = resendAttempts + 1;
            setResendAttempts(newAttempts);
            // Set next timer duration: 180s for the second attempt
            setResendTimer(newAttempts === 1 ? 180 : 0); 
        } else {
            // If sending fails, allow user to try again without waiting
            setCanResendOtp(true);
        }
    };
    
    const maskedPhoneNumber = phoneNumber.length > 3 ? `XXXXXXX${phoneNumber.slice(-3)}` : phoneNumber;

    const renderContent = () => {
        if (step === 'otp') {
            return (
                <div className="w-full max-w-sm text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">OTP दर्ज करें</h2>
                    
                    <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl mb-6 text-cyan-200 text-sm">
                        हमने आपके नंबर +91 {maskedPhoneNumber} पर 6 अंकों का OTP भेजा है।
                    </div>

                    <form onSubmit={onOtpSubmit} className="bg-slate-900/60 backdrop-blur-sm border border-white/20 p-6 md:p-8 rounded-2xl">
                        
                        <div className="relative flex justify-center items-center mb-6">
                            <label htmlFor="otp-input" className="sr-only">Enter OTP</label>
                            <input
                                id="otp-input"
                                type="tel"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                className="absolute w-full h-full opacity-0 z-10 tracking-[28px] md:tracking-[35px] indent-3 md:indent-4"
                                maxLength={6}
                                autoFocus
                                autoComplete="one-time-code"
                                inputMode="numeric"
                            />
                            <div className="flex gap-2" aria-hidden="true" onClick={() => document.getElementById('otp-input')?.focus()}>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`w-10 h-12 md:w-12 md:h-14 bg-slate-800/50 border-2 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                        otp.length === i ? 'border-cyan-400' : 'border-slate-700'
                                    }`}>
                                        <span className="text-white text-2xl font-bold">
                                            {otp[i] ? '•' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mb-4">{error}</p>}
                        
                        <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800 disabled:opacity-70">
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        
                        <div className="mt-6 text-center text-sm text-slate-400">
                            {resendAttempts < 2 ? (
                                canResendOtp ? (
                                    <span>
                                        OTP नहीं आया?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="font-semibold text-cyan-300 hover:text-white disabled:text-slate-500 underline"
                                            disabled={loading}
                                        >
                                            Resend OTP
                                        </button>
                                    </span>
                                ) : (
                                    <span>
                                        OTP नहीं आया? Resend in{' '}
                                        <span className="font-semibold text-white">
                                            {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                                        </span>
                                    </span>
                                )
                            ) : (
                                <div className="text-center text-cyan-200 bg-slate-800/50 p-4 rounded-lg text-sm">
                                    <p className="mb-3">OTP resend limit reached.</p>
                                    <button
                                        type="button"
                                        onClick={signInWithGoogle}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-2 rounded-lg transition-colors hover:bg-slate-200 disabled:bg-slate-300 text-sm"
                                    >
                                        <GoogleIcon />
                                        <span>Sign in with Google instead</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                    <button onClick={() => { setStep('form'); clearError(); setOtp(''); }} className="mt-6 text-cyan-200 hover:text-white text-sm">गलत नंबर? वापस जाएं</button>
                </div>
            );
        }

        return (
             <div className="w-full max-w-sm">
                <div className="mb-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-3 rounded-xl shadow-lg text-center relative overflow-hidden animate-shimmer">
                    <h2 className="text-base font-bold">नए यूज़र्स को मिलते हैं</h2>
                    <p className="text-xl font-extrabold">5 मुफ़्त मैसेज!</p>
                </div>

                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-white animate-title-glow">SakoonApp</h1>
                    <p className="mt-2 text-base md:text-lg text-cyan-200">User Portal Login</p>
                    <p className="mt-1 text-slate-300">
                        अकेलापन अब बीतेगा, सकून से जी पाएगा
                    </p>
                </div>

                <div className="w-full bg-slate-900/60 backdrop-blur-sm border border-white/20 p-6 md:p-8 rounded-2xl">
                     <form onSubmit={onPhoneSubmit}>
                        <div className="relative mb-4">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400"><PhoneIcon className="w-5 h-5" /><span className="ml-2">+91</span></div>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="मोबाइल नंबर" className="w-full bg-slate-800/30 border border-white/20 text-white placeholder-cyan-300/50 text-lg rounded-xl block pl-20 p-3.5 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:bg-cyan-800">
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-white/20" />
                        <span className="px-4 text-slate-400">OR</span>
                        <hr className="flex-grow border-white/20" />
                    </div>

                    <button onClick={signInWithGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white text-slate-800 font-bold py-3.5 rounded-xl transition-colors hover:bg-slate-200 disabled:bg-slate-300">
                        <GoogleIcon/>
                        <span>Sign in with Google</span>
                    </button>
                    
                    {error && <p className="text-red-300 bg-red-900/50 p-3 rounded-lg text-center mt-6 text-sm">{error}</p>}
                    
                    <div className="text-center text-slate-400 text-xs mt-6 pt-6 border-t border-white/10">
                        <p>🔐 Secure Login with OTP Authentication • App Version: 1.0.0 (Beta)</p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-slate-950 flex flex-col p-4 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div 
                    className="absolute inset-0 bg-cover bg-no-repeat opacity-20 animate-ken-burns" 
                    style={{backgroundImage: `url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto-format&fit=crop')`}}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>

            <main className="relative z-10 flex flex-col items-center justify-center w-full flex-grow py-8">
                {renderContent()}
            </main>
            
            <div className="relative z-10 w-full max-w-lg mx-auto mt-auto mb-4 px-4">
                <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5 text-xs">
                        <ShieldCheckIcon className="w-5 h-5 text-cyan-400"/>
                        <span className="whitespace-nowrap">Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <TrophyIcon className="w-5 h-5 text-amber-400"/>
                        <span className="whitespace-nowrap">Satisfaction Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <PadlockIcon className="w-5 h-5 text-slate-400"/>
                        <span className="whitespace-nowrap">Privacy Protected</span>
                    </div>
                </div>
            </div>

            <footer className="relative z-10 shrink-0 text-center text-xs text-slate-500 px-4 pb-2">
                <p>SakoonApp by Metxfitt Pvt. Ltd. | © 2025 All Rights Reserved</p>
                <p>Contact: support@sakoonapp.com | Follow us: @SakoonApp</p>
            </footer>
        </div>
    );
};

export default React.memo(LoginScreen);