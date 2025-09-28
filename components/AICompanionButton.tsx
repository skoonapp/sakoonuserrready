import React from 'react';

interface AICompanionButtonProps {
    onClick: () => void;
}

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.315 7.584C10.021 6.46 11.494 6 13 6c1.506 0 2.979.46 3.685 1.584l.753 1.129l1.605.214C19.998 8.92 20.5 9.81 20.5 10.76c0 .736-.32 1.405-.838 1.838l-1.09 1.09l.214 1.605c.094.707-.153 1.411-.702 1.873c-.55.462-1.285.592-1.95.338l-1.492-.56L13 18.5l-1.129.753c-.664.444-1.48.314-1.95-.338c-.47-.62-.592-1.385-.338-1.95l.56-1.492l-1.09-1.09c-.518-.433-.838-1.102-.838-1.838c0-.95.502-1.84 1.234-2.176l1.605-.214l.753-1.129zM12.99 3.003c.754 0 1.499.15 2.193.433l.24.116l.248-.372c.473-.71 1.15-1.265 1.953-1.616c.802-.351 1.732-.276 2.463.208c.73.484 1.185 1.28 1.185 2.146c0 .41-.086.81-.253 1.185l-.116.24l.372.248c.71.473 1.265 1.15 1.616 1.953c.351.802.276 1.732-.208 2.463c-.484.73-1.28 1.185-2.146 1.185c-.41 0-.81-.086-1.185-.253l-.24-.116l-.248.372c-.473.71-1.15 1.265-1.953 1.616c-.802.351-1.732.276-2.463-.208c-.73-.484-1.185-1.28-1.185-2.146c0-.41.086.81.253-1.185l.116-.24l-.372-.248c-.71-.473-1.265-1.15-1.616-1.953c-.351-.802-.276-1.732.208-2.463c.484-.73 1.28-1.185 2.146-1.185z" clipRule="evenodd" />
    </svg>
);


const AICompanionButton: React.FC<AICompanionButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-6 z-30 bg-gradient-to-br from-purple-600 to-indigo-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300 animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-purple-400"
            aria-label="AI Companion से बात करें"
        >
            <SparkleIcon className="w-8 h-8"/>
        </button>
    );
};

export default React.memo(AICompanionButton);