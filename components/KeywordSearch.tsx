import React from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';

interface KeywordSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const KeywordSearch: React.FC<KeywordSearchProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none" aria-hidden="true">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="search"
        name="keyword-search"
        id="keyword-search"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search summaries for keywords..."
        className="block w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-full py-3 pl-11 pr-10 text-gray-200 placeholder-gray-400 focus:ring-ukraine-yellow focus:border-ukraine-yellow transition"
        aria-label="Search summaries for keywords"
      />
      {searchTerm && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          <button
            onClick={() => onSearchChange('')}
            className="text-gray-400 hover:text-white"
            aria-label="Clear search"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};