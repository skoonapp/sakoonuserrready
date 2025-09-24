import React, { useState } from 'react';
import type { User } from '../types';
import { functions } from '../utils/firebase';

interface WelcomeModalProps {
  user: User;
  onShowTerms: () => void;
  onShowPrivacyPolicy: () => void;
  onOnboardingComplete: () => void;
}

// --- Icons ---
const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21,18V6A3,3,0,0,0,18,3H5A3,3,0,0,0,2,6V18A3,3,0,0,0,5,21H18A3,3,0,0,0,21,18ZM5,5H18a1,1,0,0,1,1,1V8H4V6A1,1,0,0,1,5,5ZM15,15a1,1,0,1,1,1-1A1,1,0,0,1,15,15Z" />
    </svg>
);
const CallChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.99988 18.2503C5.79988 17.0703 6.78988 16.0803 7.96988 15.2803C9.15988 14.4803 10.5399 14.0003 11.9999 14.0003C13.4599 14.0003 14.8399 14.4803 16.0299 15.2803C17.2099 16.0803 18.1999 17.0703 18.9999 18.2503C18.6099 18.9203 18.0699 19.5103 17.4099 20.0003C16.9999 20.3203 16.5199 20.5703 15.9899 20.7503C14.9399 21.1103 13.5699 21.3203 11.9999 21.3203C10.4299 21.3203 9.05988 21.1103 8.00988 20.7503C7.47988 20.5703 6.99988 20.3203 6.58988 20.0003C5.92988 19.5103 5.38988 18.9203 4.99988 18.2503Z" />
      <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2Z" />
    </svg>
);
const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 00-3 3v10.5a3 3 0 003 3h15a3 3 0 003-3V6.75a3 3 0 00-3-3h-15zm4.125 3.375a.75.75 0 000 1.5h6.75a.75.75 0 000-1.5h-6.75zm-3.375 9a.75.75 0 000 1.5h13.5a.75.75 0 000-1.5h-13.5z" clipRule="evenodd" />
        <path d="M9.75 12.75a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm5.625-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" />
    </svg>
);


const WelcomeModal: React.FC<WelcomeModalProps> = ({ user, onShowTerms, onShowPrivacyPolicy, onOnboardingComplete }) => {
  const [name, setName] = useState(user.name || '');
  const [city, setCity] = useState('');
  const [mobile, setMobile] = useState('');
  const [isChecked, setIsChecked] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const showMobileInput = !user.mobile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('कृपया अपना नाम दर्ज करें।');
      return;
    }
    if (!city.trim()) {
      setError('कृपया अपना शहर दर्ज करें।');
      return;
    }
    if (showMobileInput && !/^\d{10}$/.test(mobile.trim())) {
      setError('कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।');
      return;
    }
    if (!isChecked) {
      setError('आपको नियम और शर्तों से सहमत होना होगा।');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const updateData: { name: string; city: string; mobile?: string } = {
        name: name.trim(),
        city: city.trim(),
      };

      if (showMobileInput) {
        updateData.mobile = mobile.trim();
      }
      
      const updateProfile = functions.httpsCallable('updateMyProfile');
      await updateProfile(updateData);
      onOnboardingComplete();
      // Success! The modal will now disappear immediately because of the callback.
    } catch (err: any) {
      console.error("Error updating user profile:", err);
      // Provide specific, user-friendly error messages based on the error code from the backend.
      switch (err.code) {
        case 'already-exists':
        case 'invalid-argument':
          setError(err.message); // Backend provides user-friendly messages for these.
          break;
        case 'internal':
          setError("An internal error occurred. Please try again later or contact support."); // A more helpful message.
          break;
        case 'unavailable':
          setError("सर्वर से कनेक्ट नहीं हो सका। कृपया अपना इंटरनेट कनेक्शन जांचें और फिर से प्रयास करें।");
          break;
        default:
          setError("आपकी जानकारी सहेजने में विफल। कृपया पुन: प्रयास करें।"); // A generic fallback.
      }
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !name.trim() || !city.trim() || (showMobileInput && mobile.trim().length !== 10) || !isChecked || loading;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 pt-4 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg -mt-12 mb-4">
            <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          नमस्ते, {name || 'दोस्त'}!
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-4">
          SakoonApp में आपका स्वागत है! शुरू करने से पहले, कृपया अपनी जानकारी पूरी करें।
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input
                type="text"
                id="welcome-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="आपका पूरा नाम *"
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                required
            />
            <input
                type="text"
                id="welcome-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="आपका शहर *"
                className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                required
            />
            {showMobileInput && (
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                      +91
                  </div>
                  <input
                      type="tel"
                      id="welcome-mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                      placeholder="मोबाइल नंबर *"
                      className="w-full p-3 pl-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition"
                      required
                  />
              </div>
            )}
            
            <ul className="space-y-4 text-left">
                <li className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                        <WalletIcon className="w-6 h-6 text-indigo-500"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">प्लान खरीदें</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">'Home' टैब पर जाकर अपनी पसंद का प्लान खरीदें।</p>
                    </div>
                </li>
                 <li className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                        <CallChatIcon className="w-6 h-6 text-green-500"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">Listener से जुड़ें</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">'Calls' या 'Chats' टैब से किसी से भी बात करें।</p>
                    </div>
                </li>
                 <li className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                        <RobotIcon className="w-6 h-6 text-purple-500"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">@SakoonApp Help से पूछें</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">कोई सवाल है? नीचे AI बटन पर क्लिक करें।</p>
                    </div>
                </li>
            </ul>

            {error && <p className="text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-2 rounded-lg text-center text-sm mt-4">{error}</p>}
            
            <div className="pt-4">
                <label htmlFor="terms-consent" className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <input
                        id="terms-consent"
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-400 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="leading-tight">
                        मैं 
                        <button type="button" onClick={(e) => { e.preventDefault(); onShowTerms(); }} className="text-cyan-600 dark:text-cyan-400 hover:underline mx-1">नियम और शर्तों</button> 
                        और 
                        <button type="button" onClick={(e) => { e.preventDefault(); onShowPrivacyPolicy(); }} className="text-cyan-600 dark:text-cyan-400 hover:underline ml-1">गोपनीयता नीति</button> 
                        से सहमत हूँ।
                    </span>
                </label>
            </div>

            <button 
                type="submit"
                disabled={isButtonDisabled}
                className="w-full mt-4 bg-cyan-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-cyan-700 transition-colors shadow-lg transform hover:scale-105 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:scale-100"
            >
                {loading ? 'सहेज रहा है...' : 'चलिए शुरू करते हैं!'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeModal;