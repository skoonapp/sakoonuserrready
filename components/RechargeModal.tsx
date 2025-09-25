import React from 'react';

// --- Icons for the banner ---
const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
// --- End Icons ---

interface RechargeModalProps {
  onClose: () => void;
  onNavigateHome: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ onClose, onNavigateHome }) => {
  return (
    // This is now a banner that appears at the top, not a full-screen modal.
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md z-50 animate-fade-in-down">
        <div className="bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/50 dark:to-orange-950/50 rounded-xl shadow-lg p-3 flex items-center gap-3 border border-amber-300 dark:border-amber-700">
            <div className="flex-shrink-0">
                <WarningIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-grow text-left min-w-0">
                <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm">अपर्याप्त बैलेंस</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 truncate">
                    कॉल करने के लिए आपके पास कोई DT या MT प्लान नहीं है।
                </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                <button 
                    onClick={onNavigateHome} 
                    className="bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs hover:bg-cyan-700 transition-colors shadow whitespace-nowrap"
                >
                    रिचार्ज करें
                </button>
                <button 
                    onClick={onClose} 
                    className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-1 transition-colors" 
                    aria-label="Close"
                >
                    <CloseIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default RechargeModal;