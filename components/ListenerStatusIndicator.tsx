import React from 'react';
import { useListenerStatus } from '../hooks/useListenerStatus';

const ListenerStatusIndicator: React.FC = () => {
  // Using the hardcoded listenerId from the user's example
  const listenerId = "CERSeGKwT6hffVr6qcdl9k9TZE62";
  const { listener, loading } = useListenerStatus(listenerId);

  if (loading) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-sm text-slate-500">Loading listener status...</p>
      </div>
    );
  }

  if (!listener) {
    return (
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
            <p className="text-sm text-red-500">Could not find listener data.</p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2">Listener Spotlight</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={listener.image} alt={listener.name} className="w-12 h-12 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{listener.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Professional Listener</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
            listener.online 
            ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300' 
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full ${listener.online ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
          <span>{listener.online ? 'Available' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
};

export default ListenerStatusIndicator;
