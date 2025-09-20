import React from 'react';

interface BottomNavBarProps {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

// --- Icon components updated to accept className and with new size ---

const HomeIcon: React.FC<{ active: boolean; className?: string }> = ({ active, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 24 24">
        {active ? (
            <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
        ) : (
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
        )}
    </svg>
);

const CallIcon: React.FC<{ active: boolean; className?: string }> = ({ active, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 24 24">
        {active ? (
            <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
        ) : (
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        )}
    </svg>
);

const ChatIcon: React.FC<{ active: boolean; className?: string }> = ({ active, className }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 24 24">
        {active ? (
             <path fill="currentColor" d="M4 2h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-4l-4 4-4-4H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm3 5h10v2H7V7zm0 4h7v2H7v-2z" />
        ) : (
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        )}
    </svg>
);

const ProfileIcon: React.FC<{ active: boolean; className?: string }> = ({ active, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 24 24">
        {active ? (
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        ) : (
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        )}
    </svg>
);


const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeIndex, setActiveIndex }) => {
  const navItems = [
    { index: 0, label: 'Home', icon: HomeIcon },
    { index: 1, label: 'Calls', icon: CallIcon },
    { index: 2, label: 'Chats', icon: ChatIcon },
    { index: 3, label: 'Profile', icon: ProfileIcon },
  ];

  return (
    <footer className="absolute bottom-0 left-0 right-0 h-16 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-40">
      <div className="h-full flex justify-around items-center">
        {navItems.map(item => {
            const isActive = activeIndex === item.index;
            const Icon = item.icon;
            
            return (
                 <button 
                    key={item.index}
                    onClick={() => setActiveIndex(item.index)} 
                    className="relative flex-1 flex flex-col items-center justify-center h-full transition-colors duration-200 focus:outline-none"
                    aria-label={`Go to ${item.label} page`}
                    aria-current={isActive ? 'page' : undefined}
                >
                    <div className={`transition-all duration-300 rounded-full flex items-center justify-center mb-0.5 ${isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 px-6 py-1.5' : 'px-6 py-1.5'}`}>
                        <Icon 
                            active={isActive} 
                            className={isActive ? 'text-slate-800 dark:text-emerald-200' : 'text-slate-500 dark:text-slate-400'} 
                        />
                    </div>
                    <span className={`transition-all duration-300 ${isActive ? 'font-bold text-sm text-slate-800 dark:text-emerald-200' : 'font-medium text-xs text-slate-500 dark:text-slate-400'}`}>
                        {item.label}
                    </span>
                </button>
            )
        })}
      </div>
    </footer>
  );
};

export default React.memo(BottomNavBar);