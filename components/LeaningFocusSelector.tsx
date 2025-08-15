import React from 'react';

type Leaning = 'Left-Leaning' | 'Center' | 'Right-Leaning';

interface LeaningFocusSelectorProps {
  onSelect: (leaning: Leaning) => void;
  selectedFocus: Leaning | null;
  isLoading: boolean;
}

const buttons: { label: string; leaning: Leaning; color: string }[] = [
    { label: 'Left Focus', leaning: 'Left-Leaning', color: 'blue' },
    { label: 'Center Focus', leaning: 'Center', color: 'purple' },
    { label: 'Right Focus', leaning: 'Right-Leaning', color: 'red' },
];

export const LeaningFocusSelector: React.FC<LeaningFocusSelectorProps> = ({ onSelect, selectedFocus, isLoading }) => {
  return (
    <div className="p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-white/10">
      <h3 className="text-center text-lg font-semibold text-gray-300 mb-4">Analyze Media Focus</h3>
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {buttons.map(({ label, leaning, color }) => {
          const isSelected = leaning === selectedFocus;
          const buttonColorClasses = {
            blue: 'border-blue-500/60 focus:ring-blue-400',
            red: 'border-red-500/60 focus:ring-red-400',
            purple: 'border-purple-500/60 focus:ring-purple-400',
          };
          const selectedColorClasses = {
            blue: 'bg-blue-500 text-white border-blue-500',
            red: 'bg-red-500 text-white border-red-500',
            purple: 'bg-purple-500 text-white border-purple-500',
          };

          return (
            <button
              key={leaning}
              onClick={() => onSelect(leaning)}
              disabled={isLoading}
              className={`
                px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-300 ease-in-out
                border-2 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected
                  ? selectedColorClasses[color]
                  : `bg-white/5 text-gray-200 ${buttonColorClasses[color]} hover:bg-white/10`
                }
              `}
            >
              {isLoading && isSelected ? 'Analyzing...' : label}
            </button>
          );
        })}
      </div>
    </div>
  );
};