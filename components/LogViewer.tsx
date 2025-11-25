
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-950/50 rounded-lg border border-slate-800 overflow-hidden font-mono text-sm relative shadow-inner">
      <div className="p-2 bg-slate-900 border-b border-slate-800 text-xs uppercase tracking-widest text-slate-400 font-bold shrink-0 z-10 flex justify-between items-center">
        <span>Comms Log</span>
        <span className="text-[10px] opacity-50">{logs.length} entries</span>
      </div>
      
      {/* min-h-0 is crucial for nested flex containers to scroll properly */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth min-h-0">
        {logs.map((log) => (
          <div key={log.id} className={`
             break-words text-xs leading-relaxed
             ${log.type === 'story' ? 'text-purple-300 italic' : ''}
             ${log.type === 'unlock' ? 'text-green-400 font-bold' : ''}
             ${log.type === 'info' ? 'text-slate-500' : 'text-slate-300'}
             ${log.type === 'achievement' ? 'text-yellow-400 font-bold border-l-2 border-yellow-500 pl-2 bg-yellow-500/5 py-1 rounded-r' : ''}
             ${log.type === 'prestige' ? 'text-fuchsia-400 font-bold uppercase tracking-wider text-center py-2 border-y border-fuchsia-500/30 my-2' : ''}
          `}>
            <span className="opacity-30 text-[10px] mr-2 font-mono select-none">
              [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogViewer;
