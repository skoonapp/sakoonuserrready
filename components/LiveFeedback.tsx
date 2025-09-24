import React from 'react';
import ListenerCard from './ListenerCard';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener, User } from '../types';
import ViewLoader from './ViewLoader';
import { useListeners } from '../hooks/useListeners';

interface ChatsViewProps {
  onStartSession: (type: 'call' | 'chat', listener: Listener) => void;
  currentUser: User;
  showNotification: (title: string, message: string) => void;
}

const ChatsView: React.FC<ChatsViewProps> = ({ onStartSession, currentUser, showNotification }) => {
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
    } catch (error) {
      console.error("Failed to update favorites:", error);
      showNotification("SakoonApp", "Failed to update favorites. Please check your connection and try again.");
    }
  };
  
  // Check if the user has an active DT chatting plan.
  const now = Date.now();
  const hasActiveDtChatPlan = (currentUser.activePlans || []).some(
      p => p.type === 'chat' && p.expiryTimestamp > now && (p.messages || 0) > 0
  );

  if (loading) {
    return <ViewLoader />;
  }

  if (listeners.length === 0 && !loading) {
        return (
            <div className="text-center py-20 px-4">
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">अभी कोई Listener उपलब्ध नहीं है।</p>
                <p className="text-slate-500 dark:text-slate-500 mt-2">जब कोई Listener ऑनलाइन आएगा, तो वह यहाँ दिखाई देगा।</p>
            </div>
        );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <div className="space-y-2 max-w-2xl mx-auto">
        {listeners.map((listener: Listener) => (
          <ListenerCard
            key={listener.id}
            listener={listener}
            variant="compact"
            onChatClick={() => onStartSession('chat', listener)}
            isFavorite={favorites.includes(listener.id)}
            onToggleFavorite={() => handleToggleFavorite(listener.id)}
            hasActiveDtChatPlan={hasActiveDtChatPlan}
          />
        ))}
      </div>
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

export default React.memo(ChatsView);
