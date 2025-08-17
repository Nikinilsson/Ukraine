
import React, { useState, useRef, useEffect } from 'react';
import type { SummaryData, Perspective, Highlight } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PerspectiveTooltip } from './PerspectiveTooltip';
import { XIcon } from './icons/XIcon';

interface ArticleModalProps {
  data: SummaryData;
  onClose: () => void;
}

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const ArticleModal: React.FC<ArticleModalProps> = ({ data, onClose }) => {
  const { topic, summary, sources, timestamp, imageUrl, imageCredit, pullQuote, highlights } = data;
  
  const [pinnedTooltip, setPinnedTooltip] = useState<{ content: Perspective; target: HTMLElement } | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<{ content: Perspective; target: HTMLElement } | null>(null);
  const articleRef = useRef<HTMLElement>(null);

  const activeTooltip = pinnedTooltip || hoveredTooltip;

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>, perspectives: Perspective) => {
    if (!pinnedTooltip) {
      setHoveredTooltip({ content: perspectives, target: event.currentTarget });
    }
  };

  const handleMouseLeave = () => {
    setHoveredTooltip(null);
  };
  
  const handleClick = (event: React.MouseEvent<HTMLElement>, perspectives: Perspective) => {
    if (pinnedTooltip && pinnedTooltip.target === event.currentTarget) {
      setPinnedTooltip(null);
    } else {
      setHoveredTooltip(null);
      setPinnedTooltip({ content: perspectives, target: event.currentTarget });
    }
  };
  
  const closeTooltip = () => {
    setPinnedTooltip(null);
    setHoveredTooltip(null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const handleClickOutside = (event: MouseEvent) => {
      if (!pinnedTooltip) return;
      const tooltipEl = document.getElementById('perspective-tooltip');
      if (
        tooltipEl && !tooltipEl.contains(event.target as Node) &&
        !pinnedTooltip.target.contains(event.target as Node)
      ) {
        closeTooltip();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pinnedTooltip, onClose]);

  const renderSummaryWithHighlights = () => {
    const allParagraphs = summary.split('\n').filter(p => p.trim());

    return allParagraphs.map((paragraph, pIndex) => {
      if (!highlights || highlights.length === 0) {
        return <p key={pIndex}>{paragraph}</p>;
      }
      
      const highlightsInParagraph = highlights.filter(h => paragraph.includes(h.textToHighlight));

      if (highlightsInParagraph.length === 0) {
        return <p key={pIndex}>{paragraph}</p>;
      }

      const highlightTexts = highlightsInParagraph.map(h => escapeRegExp(h.textToHighlight));
      const regex = new RegExp(`(${highlightTexts.join('|')})`, 'g');
      const parts = paragraph.split(regex);
      
      return (
        <p key={pIndex}>
          {parts.map((part, partIndex) => {
            const highlight = highlights.find(h => h.textToHighlight === part);
            if (highlight) {
              return (
                <mark
                  key={partIndex}
                  className="bg-ukraine-yellow/20 rounded-sm cursor-pointer transition-colors hover:bg-ukraine-yellow/40"
                  onMouseEnter={(e) => handleMouseEnter(e, highlight.perspectives)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handleClick(e, highlight.perspectives)}
                >
                  {part}
                </mark>
              );
            }
            return <React.Fragment key={partIndex}>{part}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease-in-out]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-title"
      onClick={onClose}
    >
      <article
        ref={articleRef}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col bg-gray-900/95 max-h-[90vh] w-full max-w-3xl p-6 sm:p-8 rounded-lg shadow-2xl border border-white/10 overflow-y-auto"
      >
        {activeTooltip && (
          <PerspectiveTooltip 
            perspectives={activeTooltip.content}
            targetElement={activeTooltip.target}
            containerElement={articleRef.current}
            onClose={closeTooltip}
          />
        )}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
          aria-label="Close article view"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <div className="border-b border-white/10 pb-4 mb-6">
          <h2 id="article-title" className="text-2xl sm:text-3xl font-bold text-ukraine-yellow">{topic}</h2>
          <p className="text-sm text-gray-400 mt-1">Summary generated on: {timestamp}</p>
        </div>

        {imageUrl && (
          <figure className="mb-6">
            <img 
              src={imageUrl} 
              alt={`AI-generated image for ${topic}`} 
              className="w-full h-64 object-cover rounded-md shadow-lg" 
            />
            {imageCredit && (
              <figcaption className="text-right text-xs text-gray-500 mt-2 italic">
                {imageCredit}
              </figcaption>
            )}
          </figure>
        )}

        <div className="flex-grow space-y-4 text-gray-200 text-lg leading-relaxed">
          {pullQuote && (
            <blockquote className="my-6 p-4 border-l-4 border-ukraine-blue bg-black/20 rounded-r-lg">
              <p className="text-xl italic font-semibold text-gray-100 leading-relaxed">
                "{pullQuote}"
              </p>
            </blockquote>
          )}

          {renderSummaryWithHighlights()}
        </div>

        {sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none hover:bg-white/10 p-2 rounded-md transition-colors">
                <h3 className="text-xl font-semibold text-gray-200 flex items-center">
                  <GlobeIcon className="h-6 w-6 mr-2 text-ukraine-blue" />
                  Sources ({sources.length})
                </h3>
                <ChevronDownIcon className="h-6 w-6 text-gray-400 transform transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <ul className="space-y-3 mt-4 pl-4 border-l-2 border-gray-500/50">
                {sources.map((source, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-ukraine-blue mr-3 mt-1">&#9656;</span>
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-ukraine-yellow hover:underline transition-colors duration-200 break-all"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </article>
    </div>
  );
};
