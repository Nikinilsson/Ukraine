import React, { useMemo, useState } from 'react';
import type { TimelineDataPoint } from '../types';
import { XIcon } from './icons/XIcon';

interface TimelineDiagramProps {
  data: TimelineDataPoint[];
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 400;
const PADDING = { top: 20, right: 30, bottom: 50, left: 40 };

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

export const TimelineDiagram: React.FC<TimelineDiagramProps> = ({ data, onClose, isLoading, error }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: TimelineDataPoint } | null>(null);

  const { pathUS, pathEU, points, xLabels, yLabels } = useMemo(() => {
    if (!data || data.length < 2) return { pathUS: '', pathEU: '', points: [], xLabels: [], yLabels: [] };

    const xRange = [PADDING.left, SVG_WIDTH - PADDING.right];
    const yRange = [SVG_HEIGHT - PADDING.bottom, PADDING.top];
    const yMax = 100;

    const xScale = (index: number) => xRange[0] + (index / (data.length - 1)) * (xRange[1] - xRange[0]);
    const yScale = (value: number) => yRange[0] - (value / yMax) * (yRange[1] - yRange[0]);

    const createPath = (key: 'us' | 'eu') =>
      data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(p[key])}`).join(' ');
    
    const pathUS = createPath('us');
    const pathEU = createPath('eu');

    const points = data.map((point, index) => ({
      x: xScale(index),
      yUS: yScale(point.us),
      yEU: yScale(point.eu),
      data: point,
    }));

    const numXLabels = 6;
    const xLabels = Array.from({ length: numXLabels }).map((_, i) => {
      const dataIndex = Math.floor(i * (data.length -1) / (numXLabels - 1));
      return {
        x: xScale(dataIndex),
        label: formatDate(data[dataIndex].date),
      };
    });

    const yLabels = [0, 25, 50, 75, 100].map(val => ({
        y: yScale(val),
        label: `${val}`
    }));

    return { pathUS, pathEU, points, xLabels, yLabels };
  }, [data]);
  
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const closestPoint = points.reduce((closest, p) => 
        Math.abs(p.x - x) < Math.abs(closest.x - x) ? p : closest
    );
    
    // Choose the closest Y-point to the cursor
    const distToUS = Math.abs(closestPoint.yUS - (e.clientY - rect.top));
    const distToEU = Math.abs(closestPoint.yEU - (e.clientY - rect.top));

    setTooltip({
      x: closestPoint.x,
      y: distToUS < distToEU ? closestPoint.yUS : closestPoint.yEU,
      point: closestPoint.data,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full text-gray-300 animate-pulse">Loading timeline data...</div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-red-400">{error}</div>;
    }
    return (
       <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full">
            {/* Grid lines */}
            {yLabels.map(({ y, label }) => (
                <g key={label}>
                    <line x1={PADDING.left} x2={SVG_WIDTH - PADDING.right} y1={y} y2={y} stroke="rgba(255,255,255,0.1)" />
                    <text x={PADDING.left - 8} y={y + 4} fill="#9ca3af" textAnchor="end" fontSize="10">{label}%</text>
                </g>
            ))}
            {xLabels.map(({ x, label }) => (
                <text key={label} x={x} y={SVG_HEIGHT - PADDING.bottom + 20} fill="#9ca3af" textAnchor="middle" fontSize="10">{label}</text>
            ))}

            {/* Paths */}
            <path d={pathEU} fill="none" stroke="#ffd700" strokeWidth="2.5" />
            <path d={pathUS} fill="none" stroke="#0057b7" strokeWidth="2.5" />
            
            {/* Interaction Layer */}
            <rect 
              x={PADDING.left} y={PADDING.top}
              width={SVG_WIDTH - PADDING.left - PADDING.right}
              height={SVG_HEIGHT - PADDING.top - PADDING.bottom}
              fill="transparent"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(null)}
            />

            {/* Tooltip */}
            {tooltip && (
                <g transform={`translate(${tooltip.x}, ${tooltip.y})`} style={{ pointerEvents: 'none' }}>
                    <line x1={0} y1={0} x2={0} y2={SVG_HEIGHT - PADDING.bottom - tooltip.y} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 2"/>
                    <circle r="5" fill="#fff" />
                    <rect x={8} y={-25} width="110" height="50" fill="rgba(17, 24, 39, 0.8)" rx="4" stroke="rgba(255,255,255,0.2)" />
                    <text x={15} y={-8} fill="#fff" fontSize="11" fontWeight="bold">{new Date(tooltip.point.date).toLocaleDateString()}</text>
                    <text x={15} y={8} fill="#4dabf7" fontSize="11">US: {tooltip.point.us}%</text>
                    <text x={15} y={20} fill="#ffdd57" fontSize="11">EU: {tooltip.point.eu}%</text>
                </g>
            )}
        </svg>
    );
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-in-out]" role="dialog" aria-modal="true" aria-labelledby="timeline-title">
      <div className="relative w-full max-w-4xl bg-gray-900/80 border border-white/10 rounded-lg shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close timeline view">
          <XIcon className="h-6 w-6" />
        </button>
        <h2 id="timeline-title" className="text-xl font-bold text-gray-100 mb-2">365-Day News Coverage Trend</h2>
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-300">
            <div className="flex items-center"><span className="w-3 h-3 bg-ukraine-blue rounded-sm mr-2"></span> US Media</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-ukraine-yellow rounded-sm mr-2"></span> EU Media</div>
        </div>
        <div className="w-full h-96">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};
