
import React from 'react';
import { Infinity, AlertTriangle, Sparkles } from 'lucide-react';
import { GameState } from '../types';

interface PrestigeModalProps {
  state: GameState;
  onPrestige: () => void;
  onCancel: () => void;
}

const PrestigeModal: React.FC<PrestigeModalProps> = ({ state, onPrestige, onCancel }) => {
  // Calculate potential prestige currency:
  // Formula: Cube Root of (Lifetime Total / 1,000,000)
  // This requires significant progress to get the first point.
  const potentialCurrency = Math.floor(Math.cbrt(state.totalResourcesGenerated / 1000));
  
  // Current bonus
  const currentBonus = (state.prestigeMultiplier - 1) * 100;
  
  // New bonus if prestiged
  // Each shard adds 10% (0.1)
  const newTotalCurrency = state.prestigeCurrency + potentialCurrency;
  const newMultiplier = 1 + (newTotalCurrency * 0.1);
  const newBonus = (newMultiplier - 1) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-purple-500/50 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden">
        
        <div className="p-6 bg-gradient-to-b from-purple-900/20 to-slate-900 border-b border-purple-500/20 text-center">
          <Infinity className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase">The Big Crunch</h2>
          <p className="text-purple-300 text-sm mt-2">Collapse this universe to be born anew.</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <h3 className="text-xs uppercase text-slate-500 font-bold mb-3">Analysis</h3>
            <div className="flex justify-between items-center mb-2">
               <span className="text-slate-300">Resources Generated</span>
               <span className="font-mono text-cyan-400">{Math.floor(state.totalResourcesGenerated).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-slate-300">Cosmic Shards Earned</span>
               <span className="font-mono text-purple-400 text-xl font-bold">+{potentialCurrency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-slate-500 uppercase">Current Bonus</div>
                <div className="text-lg font-mono text-slate-300">+{currentBonus.toFixed(0)}%</div>
             </div>
             <div className="text-center p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="text-xs text-purple-400 uppercase">New Bonus</div>
                <div className="text-lg font-mono text-white">+{newBonus.toFixed(0)}%</div>
             </div>
          </div>

          <div className="flex gap-2 items-start bg-red-900/20 p-3 rounded border border-red-500/20">
             <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
             <p className="text-xs text-red-200">
               Warning: This will reset all Buildings, Resources, and Research. Only Shards, Helpers, and the Multiplier will persist.
             </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onPrestige}
            disabled={potentialCurrency <= 0}
            className={`
               flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
               ${potentialCurrency > 0 
                 ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30' 
                 : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            <Sparkles className="w-4 h-4" />
            Transcendent Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrestigeModal;
