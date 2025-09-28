import React from 'react';
import type { Listener } from '../types';

// --- Icons for the banner ---
const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);
// --- End Icons ---

interface RechargeModalProps {
  listener: Listener | null;
  onClose: () => void;
  onNavigateHome: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ listener, onClose, onNavigateHome }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
        <div 
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 text-center animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
            {listener ? (
                <>
                    <img src={listener.image} alt={listener.name} className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white dark:border-slate-800 shadow-lg -mt-16" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-4">
                        {listener.name} से बात करें?
                    </h3>
                </>
            ) : (
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg -mt-16">
                    <WarningIcon className="w-10 h-10 text-white" />
                </div>
            )}
            
            <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">
                कॉल या चैट करने के लिए आपके पास पर्याप्त बैलेंस नहीं है। कृपया पहले रिचार्ज करें।
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={onClose} 
                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                    बाद में
                </button>
                <button 
                    onClick={onNavigateHome} 
                    className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors shadow-lg"
                >
                    रिचार्ज करें
                </button>
            </div>
        </div>
    </div>
  );
};

export default RechargeModal;