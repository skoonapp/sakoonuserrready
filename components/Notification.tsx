import React, { useEffect } from 'react';

interface NotificationProps {
  title: string;
  message: string;
  onClose: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
  </svg>
);

const Notification: React.FC<NotificationProps> = ({ title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 p-4 rounded-xl text-left animate-fade-in-down bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full mt-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="font-normal text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" 
            aria-label="Close notification"
        >
            <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Notification;
