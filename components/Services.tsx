import React, { useState } from 'react';
import ListenerCard from './ListenerCard';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener, User } from '../types';
import ViewLoader from './ViewLoader';
import { useListeners } from '../hooks/useListeners';

interface CallsViewProps {
  onStartSession: (type: 'call' | 'chat', listener: Listener) => void;
  currentUser: User;
  showNotification: (title: string, message: string) => void;
}

// --- Search Icon ---
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
);


const CallsView: React.FC<CallsViewProps> = ({ onStartSession, currentUser, showNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const favorites = currentUser.favoriteListeners || [];
  const { listeners, loading, loadingMore, hasMore, loadMoreListeners } = useListeners(favorites);

  const handleToggleFavorite = async (listenerId: string) => {
    if (!currentUser) return;
    const userRef = db.collection('users').doc(currentUser.uid);
    const isFavorite = favorites.includes(listenerId);

    try {
      if (isFavorite) {
        await userRef.update({
          favoriteListeners: firebase.firestore.FieldValue.arrayRemove(listenerId)
        });
      } else {
        await userRef.update({
          favoriteListeners: firebase.firestore.FieldValue.arrayUnion(listenerId)
        });
      }
      // The useListeners hook will automatically refetch when the favorites prop changes.
    } catch (error) {
      console.error("Failed to update favorites:", error);
      showNotification("SakoonApp", "Failed to update favorites. Please check your connection and try again.");
    }
  };
  
  // Check if the user has an active DT calling plan.
  const now = Date.now();
  const hasActiveDtCallPlan = (currentUser.activePlans || []).some(
      p => p.type === 'call' && p.expiryTimestamp > now && (p.minutes || 0) > 0
  );

  const filteredListeners = listeners.filter(listener =>
    listener.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <ViewLoader />;
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      {/* Search Bar */}
      <div className="relative mb-4 max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="नाम डालो दोस्त पाओ"
          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 text-sm rounded-lg block pl-10 p-2.5 focus:ring-cyan-500 focus:border-cyan-500"
        />
      </div>

      {listeners.length === 0 && !loading ? (
        <div className="text-center py-20 px-4">
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">अभी कोई Listener उपलब्ध नहीं है।</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2">जब कोई Listener ऑनलाइन आएगा, तो वह यहाँ दिखाई देगा।</p>
        </div>
      ) : filteredListeners.length === 0 ? (
        <div className="text-center py-10 px-4">
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">कोई Listener नहीं मिला।</p>
          <p className="text-slate-500 dark:text-slate-500 mt-2">कृपया कोई दूसरा नाम खोजें।</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl mx-auto">
          {filteredListeners.map((listener: Listener) => (
            <ListenerCard
              key={listener.id}
              listener={listener}
              variant="compact"
              onCallClick={() => onStartSession('call', listener)}
              isFavorite={favorites.includes(listener.id)}
              onToggleFavorite={() => handleToggleFavorite(listener.id)}
              hasActiveDtCallPlan={hasActiveDtCallPlan}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
            <button
                onClick={loadMoreListeners}
                disabled={loadingMore}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-400"
            >
                {loadingMore ? 'Loading...' : 'Load More'}
            </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(CallsView);