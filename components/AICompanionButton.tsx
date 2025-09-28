import React from 'react';

interface AICompanionButtonProps {
    onClick: () => void;
}

// NEW: WhatsApp icon to replace the sparkle icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.68 15.34 3.7 16.78L2.05 22L7.31 20.35C8.71 21.29 10.33 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.39 20.28 11.91C20.28 16.43 16.56 20.15 12.04 20.15C10.46 20.15 8.96 19.68 7.67 18.89L7.52 18.8L4.41 19.82L5.45 16.78L5.3 16.63C4.43 15.22 3.8 13.61 3.8 11.91C3.8 7.39 7.52 3.67 12.04 3.67M9.21 7.63C9 7.93 8.68 8.08 8.38 8.13C8.08 8.18 7.75 8.31 7.46 8.55C7.17 8.79 6.91 9.11 6.81 9.43C6.71 9.75 6.61 10.11 6.61 10.49C6.61 10.87 6.71 11.23 6.81 11.55C6.91 11.87 7.14 12.22 7.46 12.53C7.78 12.84 8.18 13.21 8.64 13.61C9.1 14 9.63 14.41 10.23 14.8C10.83 15.19 11.41 15.48 12.01 15.68C12.61 15.88 13.19 15.98 13.75 15.98C14.16 15.98 14.55 15.91 14.89 15.76C15.23 15.61 15.58 15.33 15.83 14.93C16.08 14.53 16.23 14.03 16.25 13.43C16.28 12.83 16.21 12.33 16.05 11.93C15.89 11.53 15.63 11.23 15.28 11.03C14.93 10.83 14.56 10.73 14.18 10.73C13.93 10.73 13.69 10.78 13.46 10.88C13.23 10.98 13.01 11.13 12.83 11.33C12.65 11.53 12.48 11.75 12.33 12C12.18 12.25 12.06 12.45 11.88 12.55C11.7 12.65 11.51 12.7 11.31 12.63C11.11 12.56 10.66 12.39 9.96 11.69C9.26 10.99 8.78 10.15 8.58 9.75C8.38 9.35 8.56 9.05 8.68 8.88C8.8 8.71 8.91 8.56 9.01 8.43C9.11 8.3 9.18 8.18 9.23 8.08C9.28 7.98 9.26 7.83 9.21 7.63Z" />
    </svg>
);


const AICompanionButton: React.FC<AICompanionButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 z-30 bg-gradient-to-br from-green-500 to-teal-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-green-400"
            aria-label="@SakoonApp help से बात करें"
        >
            <WhatsAppIcon className="w-8 h-8"/>
        </button>
    );
};

export default React.memo(AICompanionButton);