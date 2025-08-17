
import React from 'react';

export const DeepStateMap: React.FC = () => {
  return (
    <section className="mb-8 bg-black/20 backdrop-blur-xl p-4 sm:p-6 rounded-lg shadow-2xl border border-white/10 animate-[fadeIn_0.5s_ease-in-out]">
      <h2 className="text-2xl font-bold text-ukraine-yellow mb-4 text-center">Real-Time Conflict Map</h2>
      <div className="rounded-lg overflow-hidden border-2 border-gray-700">
        <iframe
          src="https://deepstatemap.live/en"
          title="DeepStateMap Live"
          className="w-full h-full block"
          style={{ minHeight: '65vh' }}
          allow="geolocation"
          loading="lazy"
        ></iframe>
      </div>
       <p className="text-xs text-center text-gray-500 mt-3">
        Map provided by <a href="https://deepstatemap.live/" target="_blank" rel="noopener noreferrer" className="underline hover:text-ukraine-yellow transition-colors">deepstatemap.live</a>. This is an independent, third-party service.
      </p>
    </section>
  );
};
