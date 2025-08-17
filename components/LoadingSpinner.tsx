import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    'Accessing secure data streams...',
    'Analyzing global news outlets...',
    'Synthesizing multiple perspectives...',
    'Fact-checking with ground sources...',
    'Filtering for bias and misinformation...',
    'Composing neutral summaries...',
    'Finalizing reports...',
];

interface LoadingSpinnerProps {
  statusMessage: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ statusMessage }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative flex justify-center items-center">
        <div className="w-24 h-24 border-4 border-ukraine-blue rounded-full animate-spin"></div>
        <div className="w-24 h-24 border-4 border-ukraine-yellow rounded-full animate-spin absolute" style={{animationDirection: 'reverse'}}></div>
        <div className="absolute text-gray-300 font-bold text-sm">LOADING</div>
      </div>
      <p className="text-lg font-semibold text-gray-200 mt-6">
        {statusMessage}
      </p>
      <p className="text-gray-400 mt-2 animate-pulse-fast">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  );
};