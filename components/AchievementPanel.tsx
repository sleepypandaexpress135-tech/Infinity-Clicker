
import React from 'react';
import { Achievement, GameState } from '../types';
import { Trophy, Lock, Zap, MousePointer, Hammer, Factory, Coins, Microscope, HandMetal, Infinity, Activity, Globe, Brain, Rocket, Gem, Crown, Terminal, Skull } from 'lucide-react';

interface AchievementPanelProps {
  achievements: Achievement[];
  gameState: GameState;
}

const AchievementPanel: React.FC<AchievementPanelProps> = ({ achievements, gameState }) => {
  
  const getIcon = (name: string) => {
    switch(name) {
      case 'Zap': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'MousePointer': return <MousePointer className="w-5 h-5 text-cyan-400" />;
      case 'Hammer': return <Hammer className="w-5 h-5 text-orange-400" />;
      case 'Factory': return <Factory className="w-5 h-5 text-slate-400" />;
      case 'Coins': return <Coins className="w-5 h-5 text-green-400" />;
      case 'Microscope': return <Microscope className="w-5 h-5 text-purple-400" />;
      case 'HandMetal': return <HandMetal className="w-5 h-5 text-red-400" />;
      case 'Infinity': return <Infinity className="w-5 h-5 text-fuchsia-400" />;
      case 'Activity': return <Activity className="w-5 h-5 text-rose-400" />;
      case 'Globe': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'Brain': return <Brain className="w-5 h-5 text-pink-400" />;
      case 'Rocket': return <Rocket className="w-5 h-5 text-orange-500" />;
      case 'Gem': return <Gem className="w-5 h-5 text-indigo-300" />;
      case 'Crown': return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Terminal': return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'Skull': return <Skull className="w-5 h-5 text-red-600" />;
      default: return <Trophy className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getProgress = (achievement: Achievement): number => {
    if (achievement.unlocked) return 100;
    
    let current = 0;
    switch(achievement.conditionType) {
      case 'RESOURCE_TOTAL': 
        current = gameState.totalResourcesGenerated; 
        break;
      case 'CLICK_COUNT':
        current = gameState.totalClicks;
        break;
      case 'BUILDING_COUNT':
        current = gameState.buildings.reduce((acc, b) => acc + b.count, 0);
        break;
      case 'RESEARCH_COUNT':
        current = gameState.buildings.length;
        break;
      case 'PRESTIGE':
        current = gameState.prestigeCurrency > 0 ? gameState.prestigeCurrency : 0;
        break;
      case 'SPECIAL':
        current = 0;
        break;
    }
    return Math.min(100, (current / achievement.threshold) * 100);
  };

  const getProgressText = (achievement: Achievement) => {
     if (achievement.unlocked) return "Completed";
     if (achievement.conditionType === 'SPECIAL') return "???";

     let current = 0;
     switch(achievement.conditionType) {
      case 'RESOURCE_TOTAL': 
        current = gameState.totalResourcesGenerated; 
        break;
      case 'CLICK_COUNT':
        current = gameState.totalClicks;
        break;
      case 'BUILDING_COUNT':
        current = gameState.buildings.reduce((acc, b) => acc + b.count, 0);
        break;
      case 'RESEARCH_COUNT':
        current = gameState.buildings.length;
        break;
      case 'PRESTIGE':
        current = gameState.prestigeCurrency;
        break;
    }
    return `${Math.floor(current).toLocaleString()} / ${achievement.threshold.toLocaleString()}`;
  };

  const visibleAchievements = achievements.filter(a => !a.hidden || a.unlocked);
  const unlockedCount = visibleAchievements.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border-l border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Awards
        </h2>
        <p className="text-xs text-slate-500 flex justify-between mt-1">
          <span>Milestones reached</span>
          <span className="text-yellow-500 font-bold">{unlockedCount} / {visibleAchievements.length}</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleAchievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={`
              relative p-3 rounded-lg border transition-all overflow-hidden
              ${achievement.unlocked 
                ? 'bg-slate-800/80 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.05)]' 
                : 'bg-slate-900/50 border-slate-800 opacity-60'}
            `}
          >
            {/* Background Progress Bar for Locked */}
            {!achievement.unlocked && (
               <div 
                 className="absolute inset-0 bg-slate-800 pointer-events-none z-0"
                 style={{ width: `${getProgress(achievement)}%`, opacity: 0.2 }}
               />
            )}

            <div className="flex gap-3 relative z-10">
              <div className={`
                 p-2 rounded-lg flex items-center justify-center shrink-0
                 ${achievement.unlocked ? 'bg-slate-900 ring-1 ring-yellow-500/30' : 'bg-slate-950'}
              `}>
                {achievement.unlocked ? getIcon(achievement.icon) : <Lock className="w-5 h-5 text-slate-600" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold text-sm truncate ${achievement.unlocked ? 'text-yellow-100' : 'text-slate-400'}`}>
                    {achievement.name}
                  </h3>
                  {achievement.unlocked && (
                     <span className="text-[10px] bg-yellow-900/40 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/20">
                        DONE
                     </span>
                  )}
                </div>
                
                <p className="text-xs text-slate-500 leading-tight my-1">
                   {achievement.description}
                </p>

                <div className="flex justify-between items-end mt-2">
                   <span className="text-[10px] text-slate-600 italic truncate max-w-[120px]">
                      {achievement.unlocked ? `"${achievement.flavorText}"` : 'LOCKED'}
                   </span>
                   <span className="text-[10px] font-mono text-slate-400">
                      {getProgressText(achievement)}
                   </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementPanel;
