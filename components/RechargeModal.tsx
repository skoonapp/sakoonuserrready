import React from 'react';

// --- Icons for the banner ---
const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);
// --- End Icons ---

interface RechargeModalProps {
  onClose: () => void;
  onNavigateHome: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ onClose, onNavigateHome }) => {
  return (
    // The banner is now centered vertically and horizontally in the app.
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1.5rem)] max-w-md z-50 animate-fade-in-down">
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/50 dark:to-orange-950/50 rounded-2xl shadow-2xl p-4 flex items-center gap-4 border-2 border-amber-300 dark:border-amber-700">
            <div className="flex-shrink-0">
                <WarningIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-grow text-left min-w-0">
                <h3 className="font-bold text-amber-800 dark:text-amber-200 text-base">अपर्याप्त बैलेंस</h3>
                {/* Text now wraps and is fully visible */}
                <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-normal">
                    कॉल करने के लिए आपके पास कोई DT या MT प्लान नहीं है।
                </p>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <button 
                    onClick={onNavigateHome} 
                    className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-cyan-700 transition-colors shadow whitespace-nowrap"
                >
                    रिचार्ज करें
                </button>
                <button 
                    onClick={onClose} 
                    className="text-xs text-slate-600 dark:text-slate-400 hover:underline" 
                    aria-label="Close"
                >
                    बाद में
                </button>
            </div>
        </div>
    </div>
  );
};

export default RechargeModal;