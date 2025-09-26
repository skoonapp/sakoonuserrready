import React from 'react';
import type { Plan } from '../types';

interface PlanCardProps {
  tierName: string;
  callPlan: Plan;
  chatPlan: Plan;
  isPopular?: boolean;
  onPurchase: (planData: Plan) => void;
  loadingPlan: string | null;
}

const PhoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);

const ChatIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);

const StarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" />
    </svg>
);

const getTierStyles = (tierName: string): string => {
  const tier = tierName.split(' ')[0].toLowerCase();
  switch (tier) {
    case 'bronze':
      return 'text-amber-700 dark:text-amber-400';
    case 'silver':
      return 'text-slate-500 dark:text-slate-300';
    case 'gold':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'platinum':
      return 'text-cyan-600 dark:text-cyan-300';
    case 'diamond':
      return 'bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300 font-extrabold';
    case 'elite':
      return 'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 font-extrabold';
    default:
      return 'text-slate-800 dark:text-slate-100';
  }
};


const PlanCard: React.FC<PlanCardProps> = ({ tierName, callPlan, chatPlan, isPopular = false, onPurchase, loadingPlan }) => {
  
  const popularContainerStyles = isPopular 
    ? 'bg-gradient-to-br from-cyan-50 to-blue-200 dark:from-cyan-950/60 dark:to-blue-950/60' 
    : 'bg-white dark:bg-slate-900';

  const tierStyles = getTierStyles(tierName);
  
  const callPlanKey = `call_${callPlan.name}`;
  const chatPlanKey = `chat_${chatPlan.name}`;

  const isLoadingCallPlan = loadingPlan === callPlanKey;
  const isLoadingChatPlan = loadingPlan === chatPlanKey;

  return (
    <div className={`relative ${popularContainerStyles} p-3 flex flex-col text-center items-center hover:-translate-y-1 transition-all duration-300 min-h-[160px]`}>
      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-lg animate-pulse z-10">
          Popular
        </div>
      )}
      <div className="mb-3 w-full flex justify-between items-center">
        {/* Left side: Calling Discount */}
        <div className="flex-1 text-left pl-1">
            {callPlan.discount && !['Platinum Pack', 'Diamond Pack', 'Elite Pack'].includes(tierName) && (
              <div className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                  बचत {callPlan.discount}%
              </div>
            )}
        </div>
      
        {/* Center: Title and Popular stars */}
        <div className="flex items-center gap-1 shrink-0">
            {isPopular && <StarIcon className="w-5 h-5 text-amber-400" />}
            <p className={`text-lg font-bold ${tierStyles}`}>{tierName}</p>
            {isPopular && <StarIcon className="w-5 h-5 text-amber-400" />}
        </div>
    
        {/* Right side: Chat Discount */}
        <div className="flex-1 text-right pr-1">
            {chatPlan.discount && (
              <div className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                  बचत {chatPlan.discount}%
              </div>
            )}
        </div>
      </div>
      
      <div className="w-full grid grid-cols-2 gap-3 divide-x divide-slate-200 dark:divide-slate-800 flex-grow">
        {/* Call Option */}
        <div className="flex flex-col items-center px-2">
            <div className="flex-grow flex flex-col items-center text-center justify-center py-1 w-full">
                <div className="flex items-center justify-center gap-1.5 mb-1.5 h-6">
                    <PhoneIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <h4 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                        कॉलिंग
                    </h4>
                </div>
                <div className="mb-2">
                    <p className="text-xl">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{callPlan.minutes}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 ml-1 text-sm">मिनट</span>
                    </p>
                </div>
            </div>
             <button
                onClick={() => !loadingPlan && onPurchase(callPlan)}
                className={`w-full mt-auto text-white font-bold py-2 text-base rounded-lg transition-colors shadow-md ${
                    isLoadingCallPlan
                    ? 'bg-amber-500 cursor-wait'
                    : `bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 ${loadingPlan ? 'cursor-not-allowed' : ''}`
                }`}
              >
                {isLoadingCallPlan ? 'प्रोसेसिंग...' : `₹${callPlan.price} खरीदें`}
            </button>
        </div>

        {/* Chat Option */}
        <div className="flex flex-col items-center px-2">
            <div className="flex-grow flex flex-col items-center text-center justify-center py-1 w-full">
                <div className="flex items-center justify-center gap-1.5 mb-1.5 h-6">
                    <ChatIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="text-sm font-semibold text-teal-800 dark:text-teal-300">
                        चैट
                    </h4>
                </div>
                 <div className="mb-2">
                    <p className="text-xl">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100">{chatPlan.messages}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 ml-1 text-sm">मैसेज</span>
                    </p>
                </div>
            </div>
            <button
                onClick={() => !loadingPlan && onPurchase(chatPlan)}
                className={`w-full mt-auto text-white font-bold py-2 text-base rounded-lg transition-colors shadow-md ${
                    isLoadingChatPlan
                    ? 'bg-amber-500 cursor-wait'
                    : `bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 ${loadingPlan ? 'cursor-not-allowed' : ''}`
                }`}
              >
                {isLoadingChatPlan ? 'प्रोसेसिंग...' : `₹${chatPlan.price} खरीदें`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PlanCard);