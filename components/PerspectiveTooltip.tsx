import React, { useLayoutEffect, useState, useRef } from 'react';
import type { Perspective } from '../types';
import { XIcon } from './icons/XIcon';

interface PerspectiveTooltipProps {
  perspectives: Perspective;
  targetElement: HTMLElement;
  containerElement: HTMLElement | null;
  onClose: () => void;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
}

const PerspectivePill: React.FC<{ color: string; text: string }> = ({ color, text }) => (
    <div className="flex items-center mb-2">
        <span className={`w-3 h-3 rounded-full ${color} mr-2`}></span>
        <h4 className="font-bold text-gray-200 text-sm uppercase tracking-wider">{text}</h4>
    </div>
);


export const PerspectiveTooltip: React.FC<PerspectiveTooltipProps> = ({ perspectives, targetElement, containerElement, onClose }) => {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!targetElement || !containerElement || !tooltipRef.current) return;

    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = targetRect.bottom - containerRect.top + 8; // Position below the target
    
    // If it would go off-screen at the bottom, position it above the target
    if (top + tooltipRect.height > window.innerHeight - 20) {
      top = targetRect.top - containerRect.top - tooltipRect.height - 8;
    }

    // Default to positioning on the left
    let left: number | undefined = targetRect.left - containerRect.left;
    let right: number | undefined = undefined;
    
    // If positioning on the left makes it go off-screen, try positioning on the right
    if (left + tooltipRect.width > containerRect.width - 10) {
        left = undefined;
        right = containerRect.right - targetRect.right;
    }

    // Clamp left position to not go off the left edge
    if (left !== undefined && left < 10) {
        left = 10;
    }
    
    // Clamp right position to not go off the right edge
    if (right !== undefined && right < 10) {
        right = 10;
    }

    setPosition({ top, left, right });

  }, [targetElement, containerElement]);

  const perspectiveItems = [
    { type: 'left', color: 'bg-blue-500', text: perspectives.left },
    { type: 'center', color: 'bg-purple-500', text: perspectives.center },
    { type: 'right', color: 'bg-red-500', text: perspectives.right },
  ];

  return (
    <div
      id="perspective-tooltip"
      ref={tooltipRef}
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: position.left !== undefined ? `${position.left}px` : 'auto',
        right: position.right !== undefined ? `${position.right}px` : 'auto',
      }}
      className="z-10 w-80 max-w-sm bg-gray-900/60 backdrop-blur-xl p-4 rounded-lg shadow-2xl border border-white/20 animate-[fadeIn_0.1s_ease-in-out]"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
        aria-label="Close perspective tooltip"
      >
        <XIcon className="h-5 w-5" />
      </button>

      <div className="space-y-4">
        {perspectiveItems.map(item => (
            <div key={item.type}>
                <PerspectivePill color={item.color} text={`${item.type}-Leaning Perspective`} />
                <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
            </div>
        ))}
      </div>
    </div>
  );
};
