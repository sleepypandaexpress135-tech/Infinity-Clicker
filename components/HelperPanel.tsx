import React from 'react';
import { Helper } from '../types';
import { Bot, Play, Pause, Lock, ShoppingCart, MousePointer2, Brain } from 'lucide-react';
import Tooltip from './Tooltip';

interface HelperPanelProps {
  helpers: Helper[];
  resources: number;
  onBuy: (id: string) => void;
  onToggle: (id: string) => void;
}

const HelperPanel: React.FC<HelperPanelProps> = ({ helpers, resources, onBuy, onToggle }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'CLICK': return <MousePointer2 className="w-5 h-5 text-cyan-400" />;
      case 'BUY': return <ShoppingCart className="w-5 h-5 text-green-400" />;
      case 'RESEARCH': return <Brain className="w-5 h-5 text-purple-400" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  const getHelperTooltip = (helper: Helper) => (
    <div className="space-y-2">
      <h4 className="font-bold text-cyan-300 border-b border-slate-700 pb-1 mb-2">{helper.name}</h4>
      <p className="text-xs text-slate-300 mb-2">{helper.description}</p>
      <div className="text-[10px] uppercase tracking-wider space-y-1">
        <div className="flex justify-between">
           <span className="text-slate-500">Operation Rate:</span>
           <span className="text-cyan-200">Every {(helper.intervalMs / 1000).toFixed(1)}s</span>
        </div>
        <div className="flex justify-between">
           <span className="text-slate-500">Type:</span>
           <span className="text-purple-200">{helper.type}</span>
        </div>
        <div className="flex justify-between">
           <span className="text-slate-500">Status:</span>
           <span className={helper.unlocked ? (helper.active ? "text-green-400" : "text-yellow-400") : "text-red-400"}>
             {helper.unlocked ? (helper.active ? "ONLINE" : "STANDBY") : "LOCKED"}
           </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border-l border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-500" />
          Automation
        </h2>
        <p className="text-xs text-slate-500">Self-replicating helper drones</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {helpers.map((helper) => (
          <Tooltip key={helper.id} content={getHelperTooltip(helper)} className="block">
            <div 
              className={`
                relative p-4 rounded-lg border transition-all
                ${helper.unlocked 
                  ? 'bg-slate-800 border-slate-700 hover:border-slate-600' 
                  : 'bg-slate-900/50 border-slate-800 opacity-75'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-900 ${helper.active ? 'animate-pulse' : ''}`}>
                    {getIcon(helper.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">{helper.name}</h3>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{helper.type} BOT</div>
                  </div>
                </div>
                
                {helper.unlocked ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(helper.id); }}
                    className={`
                      p-2 rounded-md transition-colors
                      ${helper.active 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}
                    `}
                  >
                    {helper.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                ) : (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
              </div>

              {!helper.unlocked && (
                <button
                  onClick={(e) => { e.stopPropagation(); onBuy(helper.id); }}
                  disabled={resources < helper.baseCost}
                  className={`
                    w-full py-2 px-3 mt-2 rounded text-xs font-bold uppercase tracking-wider flex justify-between items-center
                    ${resources >= helper.baseCost
                      ? 'bg-cyan-900/50 text-cyan-400 hover:bg-cyan-800/50 border border-cyan-700/50'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                  `}
                >
                  <span>Unlock</span>
                  <span>{helper.baseCost.toLocaleString()}</span>
                </button>
              )}
              
              {helper.unlocked && (
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-2">
                   <div 
                     className={`h-full bg-cyan-500 transition-all duration-300 ${helper.active ? 'w-full animate-pulse' : 'w-0'}`}
                   />
                 </div>
              )}
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default HelperPanel;