
import React from 'react';
import { Building } from '../types';
import Tooltip from './Tooltip';
import { playSound } from '../services/audioService';

interface BuildingCardProps {
  building: Building;
  canAfford: boolean;
  onBuy: (id: string) => void;
  totalProduction: number;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building, canAfford, onBuy, totalProduction }) => {
  // Calculate current cost: base * (multiplier ^ count)
  const currentCost = Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count));
  const currentTotalOutput = building.baseProduction * building.count;
  const percentContribution = totalProduction > 0 ? (currentTotalOutput / totalProduction) * 100 : 0;
  
  // New buildings get a glow
  const isNew = building.justUnlocked;

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canAfford) {
      // Ensure audio context is running on user gesture
      onBuy(building.id);
    } else {
        playSound('error');
    }
  };

  const tooltipContent = (
    <div className="space-y-2 font-mono">
      <h4 className="font-bold text-cyan-300 border-b border-slate-700 pb-1 mb-2 tracking-wider uppercase">{building.name}</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
         <span className="text-slate-400">Class:</span>
         <span className="text-slate-200 text-right">{building.tier}</span>
         
         <span className="text-slate-400">Total Output:</span>
         <span className="text-green-300 text-right">+{currentTotalOutput.toLocaleString()}/s</span>
         
         <span className="text-slate-400">Contribution:</span>
         <span className="text-purple-300 text-right">{percentContribution.toFixed(1)}%</span>
         
         <span className="text-slate-400">Cost Scaling:</span>
         <span className="text-red-300 text-right">x{building.costMultiplier}</span>
      </div>
      <p className="text-[10px] text-slate-500 mt-2 italic border-t border-slate-800 pt-1">
        "{building.flavorText || building.description}"
      </p>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} className="w-full">
      <div 
        className={`
            relative overflow-hidden rounded border transition-all duration-300 holo-card group
            ${isNew ? 'animate-slide-in-right border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}
            ${!isNew && canAfford 
            ? 'border-slate-700/50 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer bg-slate-900/40' 
            : ''}
            ${!isNew && !canAfford
            ? 'border-slate-800 bg-slate-950/50 opacity-60 cursor-not-allowed grayscale-[0.5]'
            : ''}
        `}
        onClick={handleBuy}
        onMouseEnter={() => canAfford && playSound('hover')}
      >
        {isNew && (
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-bl z-10 shadow-lg">
                DETECTED
            </div>
        )}

        {/* Tech Decor Lines */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="p-3">
            <div className="flex justify-between items-start mb-1">
            <h3 className={`font-bold text-sm md:text-base tracking-tight ${isNew ? 'text-yellow-100' : 'text-slate-200 group-hover:text-cyan-200'}`}>
                {building.name}
            </h3>
            <span className="text-xl font-bold font-mono text-slate-600 group-hover:text-slate-400 transition-colors select-none shrink-0">
                {building.count.toString().padStart(3, '0')}
            </span>
            </div>
            
            <p className={`text-[11px] mb-3 line-clamp-1 ${isNew ? 'text-yellow-100/70' : 'text-slate-500'}`}>
            {building.description}
            </p>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
            <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-cyan-600">Cost</span>
                <span className={`font-mono text-sm ${canAfford ? (isNew ? 'text-yellow-300' : 'text-cyan-400') : 'text-red-400'}`}>
                    {currentCost.toLocaleString()}
                </span>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-green-600">Prod</span>
                <span className="font-mono text-sm text-green-400">
                    +{building.baseProduction.toLocaleString()}/s
                </span>
            </div>
            </div>
        </div>

        {/* Progress bar visual (Percentage of total production) */}
        {percentContribution > 1 && (
            <div className="absolute bottom-0 left-0 h-[2px] bg-purple-500/50" style={{ width: `${Math.min(100, percentContribution)}%` }}></div>
        )}
      </div>
    </Tooltip>
  );
};

export default BuildingCard;
