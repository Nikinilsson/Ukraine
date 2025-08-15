import React from 'react';
import { XIcon } from './icons/XIcon';

interface FocusSummaryDisplayProps {
  leaning: string;
  summary: string;
  onClose: () => void;
}

export const FocusSummaryDisplay: React.FC<FocusSummaryDisplayProps> = ({ leaning, summary, onClose }) => {
  const title = `Focus of ${leaning.replace('-', ' ')} Media`;

  const colorClasses = {
    'Left-Leaning': 'border-blue-500',
    'Center': 'border-purple-500',
    'Right-Leaning': 'border-red-500',
  };
  
  const selectedLeaning = leaning as keyof typeof colorClasses;

  return (
    <div className={`relative bg-black/20 backdrop-blur-xl p-6 rounded-lg shadow-lg border border-white/10 border-t-4 ${colorClasses[selectedLeaning]} animate-[fadeIn_0.3s_ease-in-out]`}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        aria-label="Close focus summary"
      >
        <XIcon className="h-6 w-6" />
      </button>
      <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>
      <div className="space-y-4 text-gray-300 leading-relaxed">
        {summary.split('\n').filter(p => p.trim()).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};