
import React from 'react';
import type { SummaryData } from '../types';

interface SummaryDisplayProps {
  data: SummaryData;
  onClick: () => void;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ data, onClick }) => {
  const { topic, pullQuote, summary, imageUrl } = data;

  const briefSummary = pullQuote || (summary.split('.')[0] + '.');

  return (
    <div
      onClick={onClick}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      role="button"
      tabIndex={0}
      className="relative flex flex-col justify-end min-h-[350px] bg-gray-800 p-6 rounded-lg shadow-2xl border border-white/10 overflow-hidden cursor-pointer group transition-all duration-300 ease-in-out hover:border-ukraine-yellow/80 hover:shadow-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-ukraine-yellow focus:ring-offset-2 focus:ring-offset-gray-900 animate-[fadeIn_0.5s_ease-in-out]"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`AI-generated image for ${topic}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
      
      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-ukraine-yellow mb-2 group-hover:text-yellow-300 transition-colors">
          {topic}
        </h2>
        <p className="text-gray-200 text-lg leading-relaxed mb-4 italic">
          "{briefSummary}"
        </p>
        <span
          className="inline-block font-semibold text-white bg-white/10 py-2 px-4 rounded-full group-hover:bg-ukraine-yellow group-hover:text-black transition-colors duration-300"
        >
          Read Full Summary &rarr;
        </span>
      </div>
    </div>
  );
};
