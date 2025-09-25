import React from 'react';

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

const ArrowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PullToRefresh: React.FC<PullToRefreshProps> = ({ isRefreshing, pullDistance, threshold }) => {
  const rotation = Math.min(pullDistance / threshold, 1) * 180;
  const opacity = Math.min(pullDistance / (threshold / 1.5), 1);

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
      style={{
        transform: `translateY(${pullDistance - threshold}px)`,
        height: `${threshold}px`,
        opacity: isRefreshing ? 1 : opacity,
        transition: isRefreshing ? 'opacity 0.2s' : 'none',
      }}
    >
      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400">
        {isRefreshing ? (
          <Spinner className="w-6 h-6" />
        ) : (
          <ArrowIcon
            className="w-6 h-6 transition-transform"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefresh;