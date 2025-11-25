
import React, { useEffect, useState } from 'react';
import { Loader2, Cpu, Network, Database, Activity } from 'lucide-react';

interface ResearchMonitorProps {
  startTime: number;
  duration: number;
  tierName: string;
  progress: number;
}

const ResearchMonitor: React.FC<ResearchMonitorProps> = ({ startTime, duration, tierName, progress }) => {
  const [log, setLog] = useState("Initializing protocol...");
  const [hexDump, setHexDump] = useState("");

  // We only use this effect for "flavor" updates that don't need to be 60fps
  useEffect(() => {
    const interval = setInterval(() => {
       // Flavor Logs based on progress
       const p = progress;
       if (p < 15) setLog(`Handshaking ${tierName} protocols...`);
       else if (p < 30) setLog("Decrypting dimensional signatures...");
       else if (p < 45) setLog("Parsing quantum material constants...");
       else if (p < 60) setLog("Compiling building schematics...");
       else if (p < 80) setLog("Synthesizing matter blueprints...");
       else if (p < 95) setLog("Finalizing construct stabilization...");
       else setLog("Materialization imminent.");

       // Random Hex Dump Effect
       if (Math.random() > 0.5) {
         let hex = "";
         const chars = "0123456789ABCDEF";
         for(let i=0; i<12; i++) {
             hex += chars[Math.floor(Math.random() * 16)];
             if(i%2===1) hex += " ";
         }
         setHexDump(hex);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [progress, tierName]);

  const remainingSeconds = Math.max(0, Math.ceil((duration - (Date.now() - startTime)) / 1000));

  return (
    <div className="relative w-full max-w-md bg-slate-950 border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)] p-4 group">
      {/* Scanning Grid Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Scan line animation */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="w-full h-[2px] bg-cyan-400/50 blur-sm absolute top-0 animate-[scan_3s_ease-in-out_infinite]"></div>
      </div>
      
      <div className="relative z-10 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
           <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Analyzing...</span>
           </div>
           <span className="font-mono text-cyan-300 text-sm font-bold">{remainingSeconds}s</span>
        </div>

        {/* Visualizer Area */}
        <div className="flex items-center gap-4 py-2">
           <div className="relative w-12 h-12 flex items-center justify-center border border-cyan-500/30 rounded bg-cyan-950/30 shadow-inner">
              <Cpu className="w-6 h-6 text-cyan-400 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-0 border border-cyan-400/30 rounded animate-ping [animation-duration:2s]" />
           </div>
           <div className="flex-1 space-y-1 overflow-hidden">
              <div className="text-[10px] text-cyan-500/80 font-mono h-4 overflow-hidden whitespace-nowrap">
                 {hexDump}
              </div>
              <div className="text-xs text-cyan-100 font-mono uppercase tracking-wider truncate drop-shadow-sm">
                 {log}
              </div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
           <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(56,189,248,0.6)] transition-all duration-100 ease-linear relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] transform -skew-x-12"></div>
              </div>
           </div>
           <div className="flex justify-between text-[10px] text-cyan-600 font-mono">
              <span>0%</span>
              <span className="animate-pulse">{progress.toFixed(0)}% COMPLETE</span>
              <span>100%</span>
           </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ResearchMonitor;
