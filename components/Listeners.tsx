import React from 'react';
import PlanCard from './PlanCard';
import { CALL_PLANS, CHAT_PLANS } from '../constants';
import type { User, Plan as PlanType } from '../types';
import HomeHistory from './HomeHistory';


interface HomeViewProps {
  currentUser: User;
  onPurchase: (plan: PlanType | { tokens: number; price: number }) => void;
  loadingPlan: string | null;
}

// --- Icons ---
const MTCoinIcon: React.FC<{ className?: string; idSuffix?: string }> = ({ className, idSuffix = '1' }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
            <defs><linearGradient id={`gold-gradient-${idSuffix}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="24" cy="24" r="22" fill={`url(#gold-gradient-${idSuffix})`} stroke="#DAA520" strokeWidth="2"/><circle cx="24" cy="24" r="18" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="16" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);

// New icons for the secure checkout section
const ShieldCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M9.661 2.231a.75.75 0 01.678 0 11.947 11.947 0 007.078 2.751.75.75 0 01.715.523 12.003 12.003 0 01-7.792 11.75.75.75 0 01-.542 0A12.003 12.003 0 012 5.505a.75.75 0 01.715-.523 11.947 11.947 0 007.078-2.751zM10.47 12.14a.75.75 0 00-1.06 0l-2.25 2.25a.75.75 0 101.06 1.06L10 13.768l1.72 1.72a.75.75 0 101.06-1.06l-2.25-2.25z" clipRule="evenodd" />
    </svg>
);
const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M15.5 2.5a3 3 0 00-3-3h-5a3 3 0 00-3 3v1.658a2.978 2.978 0 00-1.226 2.548 2.5 2.5 0 002.5 2.5h8.452a2.5 2.5 0 002.5-2.5A2.978 2.978 0 0016.5 4.158V2.5zM10 6a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0V6zM3.5 12.5a3 3 0 00-3 3v1.5a3 3 0 003 3h13a3 3 0 003-3v-1.5a3 3 0 00-3-3h-3.414a1.5 1.5 0 01-1.061-.44L10 10.51l-1.025 1.05a1.5 1.5 0 01-1.06.44H3.5z" clipRule="evenodd" />
    </svg>
);
const PadlockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
    </svg>
);
// --- End Icons ---

// Moved outside the component to prevent re-creation on every render.
const tokenOptions = [
    { tokens: 10, price: 50 },
    { tokens: 20, price: 99, discount: 1 },
    { tokens: 50, price: 230, discount: 8, isPopular: true },
    { tokens: 100, price: 450, isPopular: true, discount: 10 },
    { tokens: 250, price: 1125, discount: 10 },
    { tokens: 500, price: 2250, discount: 10 },
];

const planPairs = CALL_PLANS.map((callPlan, index) => ({
    callPlan,
    chatPlan: CHAT_PLANS[index],
    tierName: callPlan.tierName || '',
    isPopular: callPlan.tierName === 'Platinum Pack' || callPlan.tierName === 'Gold Pack'
}));

const HomeView: React.FC<HomeViewProps> = ({ currentUser, onPurchase, loadingPlan }) => {
  return (
    <div className="container mx-auto px-4 pt-2 pb-6">
      <HomeHistory onPurchase={onPurchase} currentUser={currentUser} />
      
      {/* Token Purchase Section */}
      <section>
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm px-4 py-2 shadow-md rounded-lg">
              MT Plans से कॉल या चैट कर सकते हैं।
            </div>
          </div>
          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>

          <div>
               <div className="text-center pt-2 mb-2">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    📞 कॉल = 2 MT/मिनट  •  💬 चैट = 1 MT/2 मैसेज
                  </p>
              </div>
              
              <div className="max-w-3xl mx-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-x-2 divide-y-2 divide-slate-200 dark:divide-slate-800">
                      {tokenOptions.map((option, index) => {
                        const isPopular = option.isPopular ?? false;
                        const popularContainerStyles = isPopular
                            ? 'bg-gradient-to-br from-cyan-50 to-blue-200 dark:from-cyan-950/60 dark:to-blue-950/60 z-10'
                            : 'bg-white dark:bg-slate-900';
                        const isLoadingThisPlan = loadingPlan === `mt_${option.tokens}`;

                        return (
                          <div key={option.tokens} className={`relative ${popularContainerStyles} p-3 flex flex-col items-center justify-between transition-all hover:shadow-lg hover:-translate-y-1 min-h-[145px]`}>
                              {isPopular && (
                                  <div className="absolute top-0 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-lg animate-pulse z-10">
                                      Popular
                                  </div>
                              )}
                              <div className="text-center">
                                  <div className="flex justify-center items-center gap-2">
                                      <MTCoinIcon className="w-5 h-5" idSuffix={String(index)} />
                                      <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{option.tokens}</span>
                                  </div>
                                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Money Token</p>
                                  {option.discount && (
                                    <div className="mt-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md inline-block">
                                        बचत {option.discount}%
                                    </div>
                                  )}
                              </div>
                              <button
                                  onClick={() => !loadingPlan && onPurchase({ tokens: option.tokens, price: option.price })}
                                  className={`w-full text-white font-bold py-2 px-3 rounded-lg transition-colors shadow-md text-base mt-3 ${
                                    isLoadingThisPlan
                                      ? 'bg-amber-500 cursor-wait'
                                      : `bg-indigo-600 hover:bg-indigo-700 ${loadingPlan ? 'cursor-not-allowed' : ''}`
                                  }`}
                                >
                                  {isLoadingThisPlan ? 'प्रोसेसिंग...' : `₹${option.price} Buy`}
                                </button>
                          </div>
                        )
                      })}
                  </div>
              </div>
          </div>
      </section>

      {/* DT Plans Section Header */}
      <section className="mt-4">
        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
        <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-cyan-400 to-emerald-500 text-white font-semibold text-sm px-4 py-2 shadow-md rounded-lg">
              DT Plans में Fix मिनट और मैसेज मिलते हैं।
            </div>
        </div>
        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
      </section>

      {/* Plan Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-2 border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-200 dark:divide-slate-800">
        {planPairs.map((pair) => (
          <PlanCard 
            key={pair.tierName}
            tierName={pair.tierName}
            callPlan={pair.callPlan}
            chatPlan={pair.chatPlan}
            isPopular={pair.isPopular}
            onPurchase={onPurchase}
            loadingPlan={loadingPlan}
          />
        ))}
      </div>

      {/* Secure Payments Section */}
      <section className="mt-4 text-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">सुरक्षित पेमेंट</h3>

        <div className="my-4 flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-cyan-500"/>
                <span className="font-semibold text-xs">Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-amber-500"/>
                <span className="font-semibold text-xs">Satisfaction Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
                <PadlockIcon className="w-5 h-5 text-slate-500"/>
                <span className="font-semibold text-xs">Privacy Protected</span>
            </div>
        </div>

        <div className="flex flex-col items-center gap-y-2 my-3">
          <div className="flex justify-center items-center gap-x-6 sm:gap-x-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-5 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_(standalone).svg" alt="Paytm" className="h-5 object-contain" />
          </div>
          <div className="flex justify-center items-center gap-x-6 sm:gap-x-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-5 object-contain" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-5 object-contain" />
          </div>
        </div>
        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
          सभी लेन-देन 100% सुरक्षित और गोपनीय हैं।
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          यदि किसी कारण से आपका भुगतान असफल हो जाता है, तो रिफंड की राशि 5-7 व्यावसायिक दिनों के भीतर आपके मूल खाते में वापस जमा कर दी जाएगी।
        </p>
      </section>
    </div>
  );
};

export default React.memo(HomeView);