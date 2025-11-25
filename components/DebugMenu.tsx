
import React from 'react';
import { Terminal, Zap, FastForward, Infinity, Database, Lock, X } from 'lucide-react';
import { Tier } from '../types';

interface DebugMenuProps {
  onClose: () => void;
  onCheat: (action: string, payload?: any) => void;
  currentTier: Tier;
}

const DebugMenu: React.FC<DebugMenuProps> = ({ onClose, onCheat, currentTier }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="bg-black border-2 border-green-500/50 rounded-lg max-w-lg w-full shadow-[0_0_50px_rgba(34,197,94,0.3)] overflow-hidden relative">
        
        {/* Scan lines effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,3px_100%]"></div>
        
        {/* Header */}
        <div className="relative z-10 p-4 border-b border-green-500/30 flex justify-between items-center bg-green-900/10">
          <h2 className="text-lg font-bold text-green-500 flex items-center gap-2 tracking-widest uppercase">
            <Terminal className="w-5 h-5 animate-pulse" />
            DEV_CONSOLE_V.0.9
          </h2>
          <button onClick={onClose} className="text-green-500/50 hover:text-green-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative z-10 p-6 space-y-6">
          <div className="text-green-400/80 text-xs mb-4 border-l-2 border-green-500 pl-2">
            WARNING: Manipulating universal constants may void warranty. 
            Achievement unlocking initiated.
          </div>

          <div className="grid grid-cols-1 gap-3">
             <button 
                onClick={() => onCheat('ADD_RESOURCES')}
                className="group flex items-center justify-between p-3 border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-400 text-sm font-bold"
             >
                <div className="flex items-center gap-3">
                    <Database className="w-4 h-4" />
                    <span>INJECT_ASSETS (1e15)</span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-green-300">EXECUTE &gt;&gt;</span>
             </button>

             <button 
                onClick={() => onCheat('FORCE_EVOLVE')}
                className="group flex items-center justify-between p-3 border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-400 text-sm font-bold"
             >
                <div className="flex items-center gap-3">
                    <FastForward className="w-4 h-4" />
                    <span>FORCE_EVOLUTION_STEP</span>
                </div>
                <span className="text-[10px] opacity-50">{currentTier}</span>
             </button>

             <button 
                onClick={() => onCheat('ADD_SHARDS')}
                className="group flex items-center justify-between p-3 border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-400 text-sm font-bold"
             >
                <div className="flex items-center gap-3">
                    <Infinity className="w-4 h-4" />
                    <span>GRANT_COSMIC_SHARDS (+100)</span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-green-300">EXECUTE &gt;&gt;</span>
             </button>

             <button 
                onClick={() => onCheat('TIME_WARP')}
                className="group flex items-center justify-between p-3 border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-400 text-sm font-bold"
             >
                <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4" />
                    <span>SIMULATE_TIME (1 Hour)</span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-green-300">EXECUTE &gt;&gt;</span>
             </button>
             
             <button 
                onClick={() => onCheat('UNLOCK_ACHIEVEMENTS')}
                className="group flex items-center justify-between p-3 border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-400 text-sm font-bold"
             >
                <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4" />
                    <span>UNLOCK_ALL_AWARDS</span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-green-300">EXECUTE &gt;&gt;</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugMenu;
