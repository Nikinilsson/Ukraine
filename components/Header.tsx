
import React from 'react';
import { CalendarIcon } from './icons/CalendarIcon';

export const Header: React.FC = () => {
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="py-8 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-gray-400 text-sm mb-4">
        <p className="font-medium">AI-Powered Unbiased Summaries of Global Events</p>
        <div className="flex items-center mt-2 sm:mt-0">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>{currentDate}</span>
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-tight">
          Ukraine News Synthesis
        </h1>
      </div>
      
      <div className="mt-4 flex justify-center">
        <div className="w-2/3 h-1 bg-ukraine-blue"></div>
        <div className="w-1/3 h-1 bg-ukraine-yellow"></div>
      </div>
    </header>
  );
};
