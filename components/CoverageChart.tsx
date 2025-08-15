import React from 'react';

interface CoverageChartProps {
  stats: { us: number; eu: number } | null;
  isLoading: boolean;
  error: string | null;
  onClick: () => void;
}

const Bar: React.FC<{ label: string; percentage: number }> = ({ label, percentage }) => (
  <div>
    <div className="flex justify-between items-center mb-1 text-sm">
      <span className="font-semibold text-gray-300">{label}</span>
      <span className="text-gray-400">{percentage}% on Ukraine War</span>
    </div>
    <div className="w-full bg-gray-700/50 rounded-full h-5 overflow-hidden border border-white/10">
      <div
        className="bg-gradient-to-r from-ukraine-blue to-blue-400 h-full text-center text-white text-xs font-bold leading-5 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export const CoverageChart: React.FC<CoverageChartProps> = ({ stats, isLoading, error, onClick }) => {
  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center text-gray-400 animate-pulse">Loading coverage data...</div>;
    }
    if (error) {
      return <div className="text-center text-red-400">{error}</div>;
    }
    if (stats) {
      return (
        <div className="space-y-4">
          <Bar label="US Media Coverage" percentage={stats.us} />
          <Bar label="EU Media Coverage" percentage={stats.eu} />
        </div>
      );
    }
    return null;
  };

  const canClick = !isLoading && !error && !!stats;

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`p-4 bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 ${canClick ? 'cursor-pointer hover:border-ukraine-yellow/80 transition-all duration-300' : 'cursor-default'}`}
      role={canClick ? "button" : undefined}
      tabIndex={canClick ? 0 : -1}
      onKeyPress={(e) => { if (e.key === 'Enter' && canClick) onClick(); }}
      aria-label="View media coverage timeline"
    >
      <h3 className="text-lg font-semibold text-gray-200 mb-3 text-center">
        Weekly Media Attention: Ukraine War
      </h3>
      {renderContent()}
       {canClick && (
         <p className="text-xs text-center text-gray-500 mt-3">Click to view 365-day trend</p>
       )}
    </div>
  );
};
