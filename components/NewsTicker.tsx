
import React from 'react';

interface NewsTickerProps {
  message: string;
}

const NewsTicker: React.FC<NewsTickerProps> = ({ message }) => {
  return (
    <div className="w-full bg-slate-950 border-b border-slate-800 h-10 flex items-center justify-center relative z-20 shrink-0 overflow-hidden shadow-sm">
       {/* Subtle background pattern */}
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:16px_16px]"></div>
       
       <div key={message} className="relative z-10 text-center px-4 animate-in fade-in slide-in-from-top-2 duration-700">
          <span className="text-sm font-mono text-slate-300 drop-shadow-md">
             {message}
          </span>
       </div>
    </div>
  );
};

export default NewsTicker;
