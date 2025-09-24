import React, { useState } from 'react';
import type { Listener } from '../types';
import { LISTENER_IMAGES } from '../constants';

interface ListenerCardProps {
  listener: Listener;
  onCallClick?: () => void;
  onChatClick?: () => void;
  variant?: 'default' | 'compact';
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

// --- Icons for Compact Card ---
const StarIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.134-.662 1.456 0l1.492 3.083 3.4 1.258c.725.268 1.023 1.18.494 1.713l-2.46 2.398 1.02 3.385c.185.613-.541 1.083-1.08.775L12 14.143l-3.185 1.94c-.54.328-1.265-.162-1.08-.775l1.02-3.385-2.46-2.398c-.529-.533-.231-1.445.494-1.713l3.4-1.258 1.492-3.083z" clipRule="evenodd" />
    </svg>
);
const LanguageIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M7.5 2.75a.75.75 0 00-1.5 0v1.258a32.987 32.987 0 00-3.599.278.75.75 0 10.198 1.487A31.545 31.545 0 018.7 5.546.75.75 0 009 5.262V2.751z" />
      <path fillRule="evenodd" d="M9 6a.75.75 0 01.75.75v5.69l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V6.75A.75.75 0 019 6z" clipRule="evenodd" />
      <path d="M10.75 14.25a.75.75 0 00-1.5 0v1.599c1.22-.224 2.274-.69 3.122-1.284a.75.75 0 10-.884-1.206 29.623 29.623 0 00-2.238.99v-1.108z" />
      <path d="M12.447 16.518a31.115 31.115 0 01-4.895 0C6.54 15.93 2 13.538 2 9.992c0-2.454 2.545-4.439 5.686-4.943.14-.02.28-.035.42-.05a.75.75 0 01.838.838c-.015.14-.03.28-.05.42-2.858.46-4.944 2.227-4.944 4.175 0 2.23 3.034 4.051 6.75 4.555a.75.75 0 01.697.803z" />
    </svg>
);
const MTCoinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative inline-block ${className}`}>
        <svg viewBox="0 0 20 20" className="w-full h-full">
            <defs><linearGradient id="gold-gradient-card" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFD700" /><stop offset="100%" stopColor="#FFA500" /></linearGradient></defs>
            <circle cx="10" cy="10" r="9" fill="url(#gold-gradient-card)" stroke="#DAA520" strokeWidth="1"/><circle cx="10" cy="10" r="7.5" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.5"/>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="Poppins, sans-serif" fontSize="6" fontWeight="bold" fill="#8B4513">MT</text>
        </svg>
    </div>
);
// --- END Icons for Compact Card ---


const PlaceholderAvatar: React.FC<{className?: string}> = ({className}) => (
    <div className={`flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3/5 h-3/5 text-slate-400 dark:text-slate-500">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    </div>
);

const VerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

const HeartIcon: React.FC<{ className?: string, isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const CallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.298-.083.465a7.48 7.48 0 003.429 3.429c.167.081.364.052.465-.083l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C6.542 22.5 1.5 17.458 1.5 9.75V4.5z" clipRule="evenodd" />
    </svg>
);

const ChatBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
  </svg>
);



const ListenerCard: React.FC<ListenerCardProps> = ({ listener, onCallClick, onChatClick, variant = 'default', isFavorite, onToggleFavorite }) => {
    const [imageError, setImageError] = useState(false);
    const fallbackImage = LISTENER_IMAGES[listener.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % LISTENER_IMAGES.length];
    const listenerImage = listener.image || fallbackImage;

    const capitalize = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

    if (variant === 'compact') {
        return (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-4 flex items-center space-x-4 border border-slate-200 dark:border-slate-800">
            {/* Left side: Avatar, Rating, Online status */}
            <div className="flex flex-col items-center flex-shrink-0 w-20">
                <div className="relative">
                    <div className={`relative w-20 h-20 p-0.5 rounded-full ${listener.online ? 'bg-gradient-to-tr from-green-400 to-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                         <img 
                            src={listenerImage} 
                            alt={listener.name} 
                            className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900" 
                            loading="lazy" decoding="async"
                            onError={() => setImageError(true)}
                        />
                    </div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        <StarIcon className="w-3 h-3"/>
                        <span>{listener.rating.toFixed(1)}</span>
                    </div>
                </div>
                 <p className={`mt-4 text-xs font-bold uppercase tracking-wider ${listener.online ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {listener.online ? 'Online' : 'Offline'}
                </p>
            </div>
            
            <div className="flex-grow flex items-center justify-between gap-2">
                {/* Middle part: Info */}
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">{capitalize(listener.name)}</h3>
                    <VerifiedIcon className="w-5 h-5 text-blue-500 shrink-0" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Professional Listener</p>
                  {listener.languages && listener.languages.length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        <LanguageIcon className="w-4 h-4"/>
                        <span className="font-semibold">{capitalize(listener.languages[0])}</span>
                      </div>
                  )}
                </div>

                {/* Right part: Buttons */}
                <div className="flex flex-col gap-2 items-center">
                   {onChatClick && (
                    <button
                      onClick={onChatClick}
                      disabled={!listener.online}
                      className="flex items-center justify-center gap-2 w-full min-w-[100px] border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Chat with ${listener.name}`}
                    >
                      <ChatBubbleIcon className="w-5 h-5"/>
                      <span>Chat</span>
                    </button>
                  )}
                  {onCallClick && (
                    <button
                      onClick={onCallClick}
                      disabled={!listener.online}
                      className="flex items-center justify-center gap-1 w-full min-w-[100px] bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-3 rounded-lg transition-colors shadow-lg disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
                      aria-label={`Call with ${listener.name}`}
                    >
                      <MTCoinIcon className="w-5 h-5"/>
                      <span className="text-sm">2/min</span>
                      <CallIcon className="w-4 h-4"/>
                    </button>
                  )}
                </div>
            </div>

            {onToggleFavorite && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
                    className="text-slate-400 hover:text-red-500 transition-colors self-start"
                    aria-label={isFavorite ? `Remove ${listener.name} from favorites` : `Add ${listener.name} to favorites`}
                >
                    <HeartIcon className={`w-6 h-6 ${isFavorite ? 'text-red-500' : ''}`} isFilled={isFavorite} />
                </button>
            )}

          </div>
        );
    }

    // Default variant for Listener Selection screen
    return (
        <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-3 md:p-4 text-center border border-slate-100 dark:border-slate-800 transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/20 group">
            {onToggleFavorite && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} 
                    className="absolute top-2 left-2 z-10 text-slate-400 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-full p-1.5 hover:text-red-500 transition-colors"
                    aria-label={isFavorite ? `Remove ${listener.name} from favorites` : `Add ${listener.name} to favorites`}
                >
                    <HeartIcon className={`w-6 h-6 ${isFavorite ? 'text-red-500' : ''}`} isFilled={isFavorite} />
                </button>
            )}
            <div className="relative inline-block mb-3">
                 {imageError ? (
                    <PlaceholderAvatar className="w-24 h-24 md:w-28 md:h-28 mx-auto border-4 border-slate-100 dark:border-slate-800" />
                ) : (
                    <img 
                        src={listenerImage} 
                        alt={listener.name} 
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full mx-auto border-4 border-slate-100 dark:border-slate-800 object-cover" 
                        loading="lazy" decoding="async"
                        onError={() => setImageError(true)}
                    />
                )}
                <div className="absolute top-0 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                    <VerifiedIcon className="w-6 h-6 text-blue-500" />
                </div>
            </div>

            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg md:text-xl truncate">{listener.name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mb-2">{`(${listener.gender}, ${listener.age} yrs)`}</p>

            <div className={`flex items-center justify-center gap-1.5 mb-3 text-sm font-semibold ${listener.online ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <span className="relative flex h-3 w-3">
                    {listener.online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${listener.online ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                </span>
                <span>{listener.online ? 'Online' : 'Offline'}</span>
            </div>

            <div className="flex justify-center items-center text-xs md:text-sm text-center mb-4 text-slate-600 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg divide-x divide-slate-300 dark:divide-slate-700">
                <div className="px-3">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{listener.rating}★</span>
                    <span className="block text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">{listener.reviewsCount}</span>
                </div>
                <div className="px-3">
                    <span className="font-bold text-slate-800 dark:text-slate-100">~12 min</span>
                    <span className="block text-slate-500 dark:text-slate-400 text-[10px] md:text-xs">Avg. Call</span>
                </div>
            </div>
            
            {onCallClick &&
                <button
                    onClick={onCallClick}
                    disabled={!listener.online}
                    className="w-16 h-16 mx-auto bg-green-500 group-hover:bg-green-600 text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-lg transform hover:scale-110 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    aria-label={`Call ${listener.name}`}
                >
                    <CallIcon className="w-8 h-8" />
                </button>
            }
            {onChatClick &&
                <button
                    onClick={onChatClick}
                    disabled={!listener.online}
                    className="w-16 h-16 mx-auto bg-cyan-500 group-hover:bg-cyan-600 text-white font-bold rounded-full transition-colors flex items-center justify-center shadow-lg transform hover:scale-110 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                    aria-label={`Chat with ${listener.name}`}
                >
                    <ChatBubbleIcon className="w-8 h-8" />
                </button>
            }
        </div>
    );
};

export default React.memo(ListenerCard);