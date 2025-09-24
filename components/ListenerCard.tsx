import React from 'react';
import type { Listener } from '../types';

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.134-.662 1.456 0l1.86 3.844 4.242.617c.727.106 1.018.995.494 1.505l-3.07 2.992.724 4.225c.124.724-.63.1.277-1.188.354L12 15.011l-3.766 1.979c-.618.324-1.312-.24-1.188-.938l.724-4.225-3.07-2.992c-.524-.51-.233-1.399.494-1.505l4.242-.617 1.86-3.844z" clipRule="evenodd" />
    </svg>
);

const HeartIcon: React.FC<{ active?: boolean, className?: string }> = ({ active, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        {active ?
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /> :
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656zM10 4.343L8.828 3.172a6 6 0 00-8.485 8.485L10 21.657l9.657-9.657a6 6 0 00-8.485-8.485L10 4.343z" clipRule="evenodd" />
        }
    </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);

const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
    </svg>
);

const AgeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12c-2.31 0-4.438.784-6.131 2.095a1.23 1.23 0 00-.404.404z" />
    </svg>
);


const OnlineIndicator: React.FC = () => (
    <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-green-400 ring-2 ring-white dark:ring-slate-900"></span>
);

interface ListenerCardProps {
  listener: Listener;
  variant: 'compact' | 'full' | 'chat-list';
  onCallClick?: () => void;
  onChatClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  hasActiveDtCallPlan?: boolean;
  hasActiveDtChatPlan?: boolean;
}

const ListenerCard: React.FC<ListenerCardProps> = ({ listener, variant, onCallClick, onChatClick, isFavorite = false, onToggleFavorite, hasActiveDtCallPlan, hasActiveDtChatPlan }) => {
    
    if (variant === 'chat-list') {
        return (
            <button
                onClick={onChatClick}
                disabled={!listener.online}
                className="w-full text-left p-2.5 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-50 disabled:hover:bg-transparent"
                aria-label={`Chat with ${listener.name}`}
            >
                <div className="relative flex-shrink-0">
                    <img src={listener.image} alt={listener.name} className="w-14 h-14 rounded-full object-cover" />
                    {listener.online && <OnlineIndicator />}
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{listener.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 dark:text-slate-400">
                         <AgeIcon className="w-4 h-4" />
                        <span>{listener.age} years old</span>
                    </div>
                </div>
            </button>
        );
    }
    
    // Default to 'compact' or 'full' variant
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 transition-all duration-300 ${!listener.online ? 'opacity-60' : ''}`}>
            <div className="relative flex-shrink-0">
                <img src={listener.image} alt={listener.name} className="w-16 h-16 rounded-full object-cover" />
                {listener.online && <OnlineIndicator />}
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{listener.name}</h3>
                    {onToggleFavorite && (
                        <button onClick={onToggleFavorite} className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1">
                            <HeartIcon active={isFavorite} className={`w-6 h-6 ${isFavorite ? 'text-red-500' : ''}`} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <StarIcon className="w-4 h-4 text-amber-400" />
                    <span>{listener.rating.toFixed(1)}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{listener.reviewsCount} reviews</span>
                </div>
                 <div className="mt-1 flex flex-wrap gap-1">
                    {listener.languages?.slice(0, 3).map(lang => (
                        <span key={lang} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{lang}</span>
                    ))}
                </div>
            </div>
            <div className="flex-shrink-0 flex flex-col gap-2">
                {onCallClick && (
                    <button onClick={onCallClick} disabled={!listener.online} className="flex items-center justify-center gap-2 w-28 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:from-slate-400 disabled:scale-100 disabled:cursor-not-allowed">
                        <PhoneIcon className="w-5 h-5" />
                        <span>Call</span>
                    </button>
                )}
                 {onChatClick && (
                    <button onClick={onChatClick} disabled={!listener.online} className="flex items-center justify-center gap-2 w-28 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:from-slate-400 disabled:scale-100 disabled:cursor-not-allowed">
                        <ChatIcon className="w-5 h-5" />
                        <span>Chat</span>
                    </button>
                )}
                {onCallClick && hasActiveDtCallPlan && <span className="text-xs text-center text-green-600 dark:text-green-400 font-semibold">DT Plan Active</span>}
                {onChatClick && hasActiveDtChatPlan && <span className="text-xs text-center text-cyan-600 dark:text-cyan-400 font-semibold">DT Plan Active</span>}
            </div>
        </div>
    );
};

export default React.memo(ListenerCard);