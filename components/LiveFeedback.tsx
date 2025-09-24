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
    <div className="container mx-auto px-0 sm:px-4 py-0 h-full">
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 h-full">
        {listeners.map((listener: Listener) => (
          <ListenerCard
            key={listener.id}
            listener={listener}
            variant="chat-list"
            onChatClick={() => onStartSession('chat', listener)}
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