
import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { GameState, Building, INITIAL_STATE, INITIAL_BUILDINGS, GeneratedBuildingData, INITIAL_HELPERS, Helper, Tier, Achievement, INITIAL_ACHIEVEMENTS } from './types';
import { generateNextBuilding, generateStoryEvent, generatePrestigeTheme } from './services/geminiService';
import { getNewsHeadline } from './services/newsService';
import { playSound, toggleAmbientSound } from './services/audioService';
import { saveToLocal, loadFromLocal, clearLocalSave } from './services/saveService';
import BuildingCard from './components/BuildingCard';
import LogViewer from './components/LogViewer';
import HelperPanel from './components/HelperPanel';
import PrestigeModal from './components/PrestigeModal';
import SettingsModal from './components/SettingsModal';
import FloatingTextOverlay from './components/FloatingTextOverlay';
import AchievementPanel from './components/AchievementPanel';
import AchievementToast from './components/AchievementToast';
import NewsTicker from './components/NewsTicker';
import ResearchMonitor from './components/ResearchMonitor';
import DebugMenu from './components/DebugMenu';
import { Atom, Cpu, Sparkles, Infinity, Bot, Trophy, Settings, HardDrive, Layers, Crown, Volume2, VolumeX, Pencil } from 'lucide-react';

// --- Actions ---
type Action = 
  | { type: 'TICK'; dt: number }
  | { type: 'CLICK'; multiplier?: number }
  | { type: 'BUY_BUILDING'; id: string }
  | { type: 'BUY_HELPER'; id: string }
  | { type: 'TOGGLE_HELPER'; id: string }
  | { type: 'HELPER_ACTION'; helperId: string; payload?: any }
  | { type: 'UNLOCK_BUILDING'; data: GeneratedBuildingData; cost: number }
  | { type: 'START_RESEARCH'; cost: number }
  | { type: 'ADD_LOG'; message: string; logType: 'info' | 'story' | 'unlock' | 'prestige' | 'achievement' | 'cheat' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'UPDATE_TIER'; tier: Tier }
  | { type: 'PRESTIGE'; newTheme: string; newResource: string; currencyGain: number }
  | { type: 'CHECK_ACHIEVEMENTS' }
  | { type: 'DISMISS_ACHIEVEMENT'; id: string }
  | { type: 'RESET_GAME' }
  | { type: 'RENAME_GALAXY'; name: string }
  | { type: 'CHEAT_ADD_RESOURCES' }
  | { type: 'CHEAT_FORCE_EVOLVE' }
  | { type: 'CHEAT_ADD_SHARDS' }
  | { type: 'CHEAT_TIME_WARP' }
  | { type: 'CHEAT_UNLOCK_ACHIEVEMENTS' }
  | { type: 'UNLOCK_SECRET_ACHIEVEMENT'; id: string };

// --- Reducer ---
const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'TICK': {
      let production = 0;
      state.buildings.forEach(b => {
        production += (b.baseProduction * b.count);
      });
      production *= state.prestigeMultiplier;

      const delta = production * (action.dt / 1000);
      
      return {
        ...state,
        resources: state.resources + delta,
        totalResourcesGenerated: state.totalResourcesGenerated + delta,
        lifetimeTotalResources: state.lifetimeTotalResources + delta,
        lastSaveTime: Date.now()
      };
    }
    case 'CLICK': {
      const multiplier = action.multiplier || 1;
      const clickVal = state.clickPower * state.prestigeMultiplier * multiplier;
      
      return {
        ...state,
        resources: state.resources + clickVal,
        totalResourcesGenerated: state.totalResourcesGenerated + clickVal,
        lifetimeTotalResources: state.lifetimeTotalResources + clickVal,
        totalClicks: (state.totalClicks || 0) + 1
      };
    }
    case 'BUY_BUILDING': {
      const buildingIndex = state.buildings.findIndex(b => b.id === action.id);
      if (buildingIndex === -1) return state;

      const building = state.buildings[buildingIndex];
      const cost = Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count));

      if (state.resources >= cost) {
        const newBuildings = [...state.buildings];
        newBuildings[buildingIndex] = { ...building, count: building.count + 1, justUnlocked: false };
        return {
          ...state,
          resources: state.resources - cost,
          buildings: newBuildings
        };
      }
      return state;
    }
    case 'BUY_HELPER': {
      const helperIndex = state.helpers.findIndex(h => h.id === action.id);
      if (helperIndex === -1) return state;
      const helper = state.helpers[helperIndex];
      
      if (state.resources >= helper.baseCost && !helper.unlocked) {
        const newHelpers = [...state.helpers];
        newHelpers[helperIndex] = { ...helper, unlocked: true, active: true };
        return {
          ...state,
          resources: state.resources - helper.baseCost,
          helpers: newHelpers,
          logs: [...state.logs, { id: Date.now().toString(), message: `Automation Unit Online: ${helper.name}`, timestamp: Date.now(), type: 'info' as const }]
        };
      }
      return state;
    }
    case 'TOGGLE_HELPER': {
      return {
        ...state,
        helpers: state.helpers.map(h => h.id === action.id ? { ...h, active: !h.active } : h)
      };
    }
    case 'HELPER_ACTION': {
      const newHelpers = state.helpers.map(h => 
         h.id === action.helperId ? { ...h, lastActionTime: Date.now() } : h
      );
      return { ...state, helpers: newHelpers };
    }
    case 'START_RESEARCH': {
      return {
        ...state,
        resources: state.resources - action.cost,
        logs: [...state.logs, { 
            id: Date.now().toString(), 
            message: `Research Protocol Initiated. -${Math.floor(action.cost).toLocaleString()} ${state.resourceName}`, 
            timestamp: Date.now(), 
            type: 'info' as const
        }].slice(-50)
      };
    }
    case 'UNLOCK_BUILDING': {
      const newBuilding: Building = {
        id: `b_gen_${Date.now()}`,
        ...action.data,
        count: 0,
        costMultiplier: 1.2,
        unlocked: true,
        tier: state.currentTier,
        justUnlocked: true
      };

      const newClickPower = state.clickPower * 2;
      
      const updatedHelpers = state.helpers.map(h => {
        if (h.id === 'h_clicker') {
           return { ...h, bonusMultiplier: (h.bonusMultiplier || 1) * 1.25 };
        }
        return h;
      });

      return {
        ...state,
        resources: state.resources - action.cost, 
        clickPower: newClickPower,
        helpers: updatedHelpers,
        buildings: [...state.buildings, newBuilding],
        generationCount: state.generationCount + 1,
        logs: [
          ...state.logs,
          { 
            id: Date.now().toString(), 
            message: `Research Complete: ${action.data.name}. Click Power x2, Nanobots x2.5`, 
            timestamp: Date.now(), 
            type: 'unlock' as const 
          }
        ].slice(-50)
      };
    }
    case 'ADD_LOG': {
      const newLog = { 
        id: Date.now().toString() + Math.random(), 
        message: action.message, 
        timestamp: Date.now(), 
        type: action.logType 
      };
      return { ...state, logs: [...state.logs, newLog].slice(-50) };
    }
    case 'UPDATE_TIER': {
      if (state.currentTier === action.tier) return state;

      const newClickPower = state.clickPower * 1.5;
      const newHelpers = state.helpers.map(h => {
        if (h.id === 'h_clicker') {
           return { ...h, bonusMultiplier: (h.bonusMultiplier || 1) * 1.25 };
        }
        return h;
      });

      const newBuildings = state.buildings.map(b => ({
         ...b,
         baseProduction: b.baseProduction * 1.15
      }));

      return {
        ...state,
        currentTier: action.tier,
        clickPower: newClickPower,
        helpers: newHelpers,
        buildings: newBuildings,
        logs: [...state.logs, { 
            id: Date.now().toString(), 
            message: `EVOLUTION ANOMALY DETECTED: Reality Shift to ${action.tier}. (Clicks x1.5, Nanobots x1.25, Structure Output x1.15)`, 
            timestamp: Date.now(), 
            type: 'story' as const 
        }].slice(-50)
      };
    }
    case 'PRESTIGE': {
      const newCurrency = state.prestigeCurrency + action.currencyGain;
      const newMultiplier = 1 + (newCurrency * 0.1);
      
      const resetHelpers = state.helpers.map(h => ({
        ...h,
        bonusMultiplier: 1
      }));

      return {
        ...INITIAL_STATE,
        galaxyName: state.galaxyName, // Persist galaxy name
        prestigeCurrency: newCurrency,
        prestigeMultiplier: newMultiplier,
        theme: action.newTheme,
        resourceName: action.newResource,
        helpers: resetHelpers,
        achievements: state.achievements,
        lifetimeTotalResources: state.lifetimeTotalResources,
        totalClicks: state.totalClicks,
        clickPower: 1,
        logs: [
            { id: Date.now().toString(), message: 'THE UNIVERSE COLLAPSED AND WAS REBORN.', timestamp: Date.now(), type: 'prestige' as const }
        ]
      };
    }
    case 'CHECK_ACHIEVEMENTS': {
        const newlyUnlocked: Achievement[] = [];
        const updatedAchievements = state.achievements.map(a => {
            if (a.unlocked) return a;
            
            let unlocked = false;
            switch(a.conditionType) {
                case 'RESOURCE_TOTAL':
                    if (state.totalResourcesGenerated >= a.threshold) unlocked = true;
                    break;
                case 'CLICK_COUNT':
                    if ((state.totalClicks || 0) >= a.threshold) unlocked = true;
                    break;
                case 'BUILDING_COUNT':
                    const totalBuildings = state.buildings.reduce((acc, b) => acc + b.count, 0);
                    if (totalBuildings >= a.threshold) unlocked = true;
                    break;
                case 'RESEARCH_COUNT':
                    if (state.buildings.length >= a.threshold) unlocked = true;
                    break;
                case 'PRESTIGE':
                    if (state.prestigeCurrency >= a.threshold) unlocked = true;
                    break;
            }

            if (unlocked) {
                const newA = { ...a, unlocked: true };
                newlyUnlocked.push(newA);
                return newA;
            }
            return a;
        });

        if (newlyUnlocked.length === 0) return state;

        const newLogs = newlyUnlocked.map(a => ({
             id: Date.now().toString() + Math.random(),
             message: `Achievement Unlocked: ${a.name}`,
             timestamp: Date.now(),
             type: 'achievement' as const
        }));

        return {
            ...state,
            achievements: updatedAchievements,
            logs: [...state.logs, ...newLogs].slice(-50),
            achievementQueue: [...(state.achievementQueue || []), ...newlyUnlocked]
        };
    }
    case 'DISMISS_ACHIEVEMENT': {
        return {
            ...state,
            achievementQueue: (state.achievementQueue || []).filter(a => a.id !== action.id)
        };
    }
    case 'LOAD_GAME':
        const loadedBuildings = (action.state.buildings || []).map(b => ({
            ...b,
            justUnlocked: false
        }));
        
        const mergedAchievements = INITIAL_ACHIEVEMENTS.map(initial => {
            const saved = (action.state.achievements || []).find(a => a.id === initial.id);
            return saved ? { ...initial, unlocked: saved.unlocked } : initial;
        });

        return {
           ...INITIAL_STATE,
           ...action.state,
           buildings: loadedBuildings,
           helpers: action.state.helpers || INITIAL_HELPERS,
           achievements: mergedAchievements,
           currentTier: action.state.currentTier || Tier.QUANTUM
        };
    case 'RESET_GAME':
        return INITIAL_STATE;
    case 'RENAME_GALAXY':
        return {
            ...state,
            galaxyName: action.name
        };
    case 'UNLOCK_SECRET_ACHIEVEMENT': {
        const achievement = state.achievements.find(a => a.id === action.id);
        if (!achievement || achievement.unlocked) return state;

        const newAchievements = state.achievements.map(a => a.id === action.id ? { ...a, unlocked: true } : a);
        const unlocked = newAchievements.find(a => a.id === action.id)!;

        return {
            ...state,
            achievements: newAchievements,
            achievementQueue: [...(state.achievementQueue || []), unlocked],
            logs: [...state.logs, {
                id: Date.now().toString(),
                message: `Hidden Access Granted: ${unlocked.name}`,
                timestamp: Date.now(),
                type: 'achievement' as const
            }].slice(-50)
        };
    }
    case 'CHEAT_ADD_RESOURCES':
        return {
            ...state,
            resources: state.resources + 1000000000000000,
            lifetimeTotalResources: state.lifetimeTotalResources + 1000000000000000,
            logs: [...state.logs, { id: Date.now().toString(), message: 'CHEAT: Resources Injected', timestamp: Date.now(), type: 'cheat' as const }].slice(-50)
        };
    case 'CHEAT_ADD_SHARDS':
        return {
            ...state,
            prestigeCurrency: state.prestigeCurrency + 100,
            prestigeMultiplier: state.prestigeMultiplier + 10,
            logs: [...state.logs, { id: Date.now().toString(), message: 'CHEAT: Shards Injected', timestamp: Date.now(), type: 'cheat' as const }].slice(-50)
        };
    case 'CHEAT_FORCE_EVOLVE':
        let next: Tier | null = null;
        if(state.currentTier === Tier.QUANTUM) next = Tier.MACROCOSM;
        else if(state.currentTier === Tier.MACROCOSM) next = Tier.COSMIC;
        else if(state.currentTier === Tier.COSMIC) next = Tier.MULTIVERSAL;
        else if(state.currentTier === Tier.MULTIVERSAL) next = Tier.OMNIPOTENT;
        
        if (!next) return state;
        
        return {
           ...state,
           currentTier: next,
           clickPower: state.clickPower * 1.5,
           helpers: state.helpers.map(h => h.id === 'h_clicker' ? { ...h, bonusMultiplier: (h.bonusMultiplier || 1) * 1.25 } : h),
           buildings: state.buildings.map(b => ({ ...b, baseProduction: b.baseProduction * 1.15 })),
           logs: [...state.logs, { id: Date.now().toString(), message: 'CHEAT: Forced Evolution', timestamp: Date.now(), type: 'cheat' as const }].slice(-50)
        };
    case 'CHEAT_TIME_WARP':
         let hourProd = 0;
         state.buildings.forEach(b => {
            hourProd += (b.baseProduction * b.count);
         });
         hourProd *= state.prestigeMultiplier;
         hourProd *= 3600;
         return {
            ...state,
            resources: state.resources + hourProd,
            lifetimeTotalResources: state.lifetimeTotalResources + hourProd,
            logs: [...state.logs, { id: Date.now().toString(), message: 'CHEAT: Time Warp (1 Hr)', timestamp: Date.now(), type: 'cheat' as const }].slice(-50)
         };
    case 'CHEAT_UNLOCK_ACHIEVEMENTS':
         return {
            ...state,
            achievements: state.achievements.map(a => ({ ...a, unlocked: true })),
            logs: [...state.logs, { id: Date.now().toString(), message: 'CHEAT: All Awards Unlocked', timestamp: Date.now(), type: 'cheat' as const }].slice(-50)
         };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  
  const [researchState, setResearchState] = useState<{
    isActive: boolean;
    startTime: number;
    duration: number;
  }>({ isActive: false, startTime: 0, duration: 0 });
  
  const [researchCost, setResearchCost] = useState(500);
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDebugMenu, setShowDebugMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'buildings' | 'helpers' | 'achievements'>('buildings');
  const [floatingTexts, setFloatingTexts] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  const [newsMessage, setNewsMessage] = useState("Initializing Cosmic Interface...");
  const [animationState, setAnimationState] = useState<'idle' | 'imploding' | 'exploding' | 'purging'>('idle');
  const [isMuted, setIsMuted] = useState(true);
  
  // Naming state
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempGalaxyName, setTempGalaxyName] = useState("");

  const lastTickRef = useRef<number>(Date.now());
  const requestRef = useRef<number>();
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const pendingResearchData = useRef<Promise<GeneratedBuildingData> | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
      stateRef.current = state;
  }, [state]);

  // --- AUDIO AMBIENCE ---
  const handleToggleAudio = () => {
     const newMuted = !isMuted;
     setIsMuted(newMuted);
     toggleAmbientSound(!newMuted);
     if (!newMuted) playSound('click');
  };

  // --- DEBUG KEY LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '`' || e.key === '~') {
            e.preventDefault();
            setShowDebugMenu(prev => {
                const newVal = !prev;
                if (newVal) dispatch({ type: 'UNLOCK_SECRET_ACHIEVEMENT', id: 'a_cheater' });
                return newVal;
            });
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addFloatingText = useCallback((x: number, y: number, text: string) => {
    if (animationState !== 'idle') return;
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 1000);
  }, [animationState]);

  const processHelpers = useCallback((dt: number) => {
    state.helpers.forEach(helper => {
      if (!helper.unlocked || !helper.active) return;
      
      const timeSinceLast = Date.now() - helper.lastActionTime;
      if (timeSinceLast >= helper.intervalMs) {
        switch(helper.type) {
          case 'CLICK':
            const multiplier = helper.bonusMultiplier || 1;
            dispatch({ type: 'CLICK', multiplier });
            
            if (mainButtonRef.current) {
               const rect = mainButtonRef.current.getBoundingClientRect();
               const jitterX = (Math.random() - 0.5) * (rect.width * 0.6);
               const jitterY = (Math.random() - 0.5) * (rect.height * 0.6);
               const x = rect.left + (rect.width / 2) + jitterX;
               const y = rect.top + (rect.height / 2) + jitterY;
               const clickAmount = Math.floor(state.clickPower * state.prestigeMultiplier * multiplier);
               addFloatingText(x, y, `⚡ +${clickAmount.toLocaleString()}`);
            }
            break;
          case 'BUY':
             const affordable = state.buildings
               .map(b => ({
                 id: b.id, 
                 cost: Math.floor(b.baseCost * Math.pow(b.costMultiplier, b.count))
               }))
               .filter(b => b.cost <= state.resources)
               .sort((a,b) => a.cost - b.cost);
             if (affordable.length > 0) {
               dispatch({ type: 'BUY_BUILDING', id: affordable[0].id });
               playSound('buy');
             }
             break;
          case 'RESEARCH':
             break;
        }
        dispatch({ type: 'HELPER_ACTION', helperId: helper.id });
      }
    });
  }, [state.helpers, state.resources, state.buildings, state.clickPower, state.prestigeMultiplier, addFloatingText]);

  const tick = useCallback(() => {
    const now = Date.now();
    const dt = now - lastTickRef.current;
    
    if (dt > 0) {
      dispatch({ type: 'TICK', dt });
      processHelpers(dt);
      
      if (researchState.isActive) {
        const elapsed = now - researchState.startTime;
        if (elapsed >= researchState.duration) {
           if (pendingResearchData.current) {
              pendingResearchData.current.then(data => {
                 dispatch({ type: 'UNLOCK_BUILDING', data, cost: 0 }); 
                 playSound('unlock');
                 setResearchState({ isActive: false, startTime: 0, duration: 0 });
                 pendingResearchData.current = null;
              }).catch(err => {
                 dispatch({ type: 'ADD_LOG', message: "Research Failed: Data corruption.", logType: 'info' });
                 playSound('error');
                 setResearchState({ isActive: false, startTime: 0, duration: 0 });
                 pendingResearchData.current = null;
              });
           } else {
             setResearchState({ isActive: false, startTime: 0, duration: 0 });
           }
        }
      }
      lastTickRef.current = now;
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [processHelpers, researchState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  useEffect(() => {
      const interval = setInterval(() => {
          dispatch({ type: 'CHECK_ACHIEVEMENTS' });
      }, 1500);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (state.achievementQueue && state.achievementQueue.length > 0) {
          playSound('achievement');
      }
  }, [state.achievementQueue?.length]);

  useEffect(() => {
    const evolutionCheck = setInterval(() => {
      const current = stateRef.current.currentTier;
      let nextTier: Tier | null = null;
      let chance = 0;

      switch(current) {
        case Tier.QUANTUM: nextTier = Tier.MACROCOSM; chance = 0.05; break;
        case Tier.MACROCOSM: nextTier = Tier.COSMIC; chance = 0.01; break;
        case Tier.COSMIC: nextTier = Tier.MULTIVERSAL; chance = 0.001; break;
        case Tier.MULTIVERSAL: nextTier = Tier.OMNIPOTENT; chance = 0.0001; break;
        case Tier.OMNIPOTENT: return;
      }

      if (nextTier) {
        const roll = Math.random();
        if (roll < chance) {
           dispatch({ type: 'UPDATE_TIER', tier: nextTier });
           playSound('unlock');
        } else if (roll < chance * 5) {
           dispatch({ type: 'ADD_LOG', message: "Dimensional resonance detected... Stability fluctuated.", logType: 'info' });
        }
      }
    }, 5000);
    return () => clearInterval(evolutionCheck);
  }, []);

  useEffect(() => {
    const loadedState = loadFromLocal();
    if (loadedState) {
      dispatch({ type: 'LOAD_GAME', state: loadedState });
    }
  }, []);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveToLocal(state);
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [state]);

  useEffect(() => {
    const baseResearchCost = 1000;
    const scaling = Math.pow(3.5, state.buildings.length - INITIAL_BUILDINGS.length);
    setResearchCost(baseResearchCost * scaling);
  }, [state.buildings]);

  useEffect(() => {
    const storyInterval = setInterval(async () => {
      if (Math.random() < 0.3) {
        const msg = await generateStoryEvent(state.theme, state.resourceName, state.currentTier, state.totalResourcesGenerated);
        dispatch({ type: 'ADD_LOG', message: msg, logType: 'story' });
      }
    }, 30000);
    return () => clearInterval(storyInterval);
  }, [state.theme, state.resourceName, state.totalResourcesGenerated, state.currentTier]);

  useEffect(() => {
     setNewsMessage(getNewsHeadline(stateRef.current));
     const statusInterval = setInterval(() => {
        setNewsMessage(getNewsHeadline(stateRef.current));
     }, 15000);
     return () => clearInterval(statusInterval);
  }, []);
  
  const handleMainClick = (e: React.MouseEvent) => {
    if (animationState !== 'idle') return;
    dispatch({ type: 'CLICK' });
    playSound('click');
    const amount = state.clickPower * state.prestigeMultiplier;
    addFloatingText(e.clientX, e.clientY, `+${Math.floor(amount).toLocaleString()}`);
  };

  const handleBuyBuilding = (id: string) => {
    if (animationState !== 'idle') return;
    dispatch({ type: 'BUY_BUILDING', id });
    playSound('buy');
  };

  const handleBuyHelper = (id: string) => {
    if (animationState !== 'idle') return;
    dispatch({ type: 'BUY_HELPER', id });
    playSound('unlock');
  };

  const handleResearch = async () => {
    if (state.resources < researchCost || researchState.isActive || animationState !== 'idle') {
        playSound('error');
        return;
    }
    
    dispatch({ type: 'START_RESEARCH', cost: researchCost });
    playSound('click');
    
    const researchedCount = Math.max(0, state.buildings.length - INITIAL_BUILDINGS.length);
    const duration = 30000 + (researchedCount * 30000);

    setResearchState({
        isActive: true,
        startTime: Date.now(),
        duration: duration
    });

    pendingResearchData.current = generateNextBuilding(
        state.theme, 
        state.resourceName, 
        state.currentTier, 
        state.buildings, 
        state.totalResourcesGenerated
    );
  };

  const handlePrestige = async () => {
    const potentialCurrency = Math.floor(Math.cbrt(state.totalResourcesGenerated / 1000));
    if (potentialCurrency <= 0) return;

    setShowPrestigeModal(false);
    setAnimationState('imploding');
    playSound('prestige'); 
    
    const themeData = await generatePrestigeTheme();
    
    setTimeout(() => {
        dispatch({ 
           type: 'PRESTIGE', 
           newTheme: themeData.theme, 
           newResource: themeData.resource, 
           currencyGain: potentialCurrency
        });
        setResearchState({ isActive: false, startTime: 0, duration: 0 });
        setAnimationState('exploding');
        playSound('unlock'); 
        setTimeout(() => {
            setAnimationState('idle');
        }, 1500);
    }, 2400); 
  };

  const handleHardReset = () => {
      // 1. Close Modal handled by child component logic or parent state
      setShowSettingsModal(false);
      
      // 2. Play Purge Sound and Set Animation
      playSound('purge');
      setAnimationState('purging');
      
      // 3. Clear Data and Reset State after animation delay
      setTimeout(() => {
          clearLocalSave();
          dispatch({ type: 'RESET_GAME' });
          setAnimationState('idle');
          // Optional: Add a clean "System Reboot" log or sound
      }, 2500);
  };
  
  const handleCheat = (actionType: string, payload?: any) => {
      // @ts-ignore
      dispatch({ type: `CHEAT_${actionType}`, ...payload });
      dispatch({ type: 'UNLOCK_SECRET_ACHIEVEMENT', id: 'a_dirty_hacker' });
      playSound('unlock');
  };

  // Galaxy Naming Logic
  const startEditingName = () => {
      setTempGalaxyName(state.galaxyName || "Unknown Sector");
      setIsEditingName(true);
  };

  const saveGalaxyName = () => {
      if (tempGalaxyName.trim()) {
          dispatch({ type: 'RENAME_GALAXY', name: tempGalaxyName.trim() });
      }
      setIsEditingName(false);
  };

  const currentProductionRate = state.buildings.reduce((acc, b) => acc + (b.baseProduction * b.count), 0) * state.prestigeMultiplier;

  const researchProgress = researchState.isActive 
    ? Math.min(100, ((Date.now() - researchState.startTime) / researchState.duration) * 100)
    : 0;

  // Visual Colors based on Tier
  const getTierColor = (tier: Tier) => {
    switch(tier) {
      case Tier.QUANTUM: return 'cyan';
      case Tier.MACROCOSM: return 'green';
      case Tier.COSMIC: return 'purple';
      case Tier.MULTIVERSAL: return 'fuchsia';
      case Tier.OMNIPOTENT: return 'amber';
      default: return 'cyan';
    }
  };
  const tierColor = getTierColor(state.currentTier);

  return (
    <div className="h-screen w-full bg-black text-slate-200 overflow-hidden relative font-sans selection:bg-cyan-500/30">
      
      {/* CRT Effects */}
      <div className="scanlines"></div>
      <div className="vignette"></div>

      {/* Red Purge Overlay */}
      <div className={`purge-overlay ${animationState === 'purging' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}></div>

      {/* Main Container */}
      <div className={`
          flex flex-col h-full w-full transition-all duration-75 relative z-10
          ${animationState === 'imploding' ? 'animate-implode pointer-events-none' : ''}
          ${animationState === 'exploding' ? 'animate-big-bang' : ''}
          ${animationState === 'purging' ? 'animate-glitch-out pointer-events-none' : ''}
      `}>
          
          <FloatingTextOverlay events={floatingTexts} />
          
          {/* Animated Starfield Background */}
          <div className="stars-container pointer-events-none">
             <div className="stars-1"></div>
             <div className="stars-2"></div>
             <div className="stars-3"></div>
          </div>

          <NewsTicker message={newsMessage} />

          <div className="flex-1 flex flex-col md:flex-row w-full min-h-0 z-10 relative">

            {/* Left Sidebar */}
            <aside className="hidden md:flex w-80 flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-md z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-800 shrink-0 bg-slate-900/50">
                {/* Galaxy Name Header */}
                <div className="mb-2 min-h-[24px]">
                    {isEditingName ? (
                        <input 
                           type="text"
                           value={tempGalaxyName}
                           onChange={(e) => setTempGalaxyName(e.target.value)}
                           onBlur={saveGalaxyName}
                           onKeyDown={(e) => e.key === 'Enter' && saveGalaxyName()}
                           autoFocus
                           className="w-full bg-slate-800 border border-cyan-500/50 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-cyan-300 focus:outline-none"
                           maxLength={30}
                        />
                    ) : (
                        <div 
                           onClick={startEditingName}
                           className="group flex items-center gap-2 cursor-pointer hover:bg-slate-800/50 rounded py-0.5 px-1 -ml-1 transition-colors w-full"
                           title="Rename Galaxy"
                        >
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
                                {state.galaxyName || "Unknown Sector"}
                            </span>
                            <Pencil className="w-3 h-3 text-slate-600 group-hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                <h1 className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 drop-shadow-sm font-mono uppercase">
                  {state.theme}
                </h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest flex justify-between">
                  <span>{state.currentTier} Age</span>
                  <span className="text-purple-400 font-bold">x{state.prestigeMultiplier.toFixed(2)}</span>
                </p>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Lifetime Mass</div>
                      <div className="font-mono text-sm text-slate-300">{Math.floor(state.lifetimeTotalResources).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Shards</div>
                      <div className="font-mono text-sm text-purple-300 text-shadow-purple">{state.prestigeCurrency.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="space-y-2 shrink-0">
                  <button 
                    onClick={() => setShowPrestigeModal(true)}
                    className="w-full py-3 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    <Infinity className="w-4 h-4" /> Cosmic Reset
                  </button>

                  <button 
                    onClick={() => setShowSettingsModal(true)}
                    className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-400 text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" /> System / Data
                  </button>
                  
                  <button 
                    onClick={handleToggleAudio}
                    className="w-full py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 text-slate-400 text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                    {isMuted ? 'Enable Audio' : 'Mute Audio'}
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col border border-slate-800 rounded-lg">
                  <LogViewer logs={state.logs} />
                </div>
              </div>
            </aside>

            {/* Center Stage - The Reactor */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-20 p-6 min-h-[400px]">
              
              <div className="mb-12 text-center select-none relative z-30">
                <h2 className="text-6xl md:text-8xl font-bold font-mono text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {Math.floor(state.resources).toLocaleString()}
                </h2>
                <p className={`uppercase tracking-[0.3em] mt-2 font-bold text-sm md:text-base animate-pulse text-${tierColor}-400`}>
                  {state.resourceName} / {currentProductionRate.toFixed(1)}/s
                </p>
              </div>

              {/* Advanced Reactor Core Animation */}
              <button
                ref={mainButtonRef}
                onClick={handleMainClick}
                className="relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center outline-none group cursor-pointer"
                style={{ '--core-rgb': '34, 211, 238' } as React.CSSProperties}
              >
                {/* Layer 1: Outer Rotating Ring */}
                <div className={`absolute inset-0 rounded-full border-2 border-dashed border-${tierColor}-500/20 animate-spin-slow`}></div>
                
                {/* Layer 2: Middle Counter-Rotating Ring */}
                <div className={`absolute inset-4 rounded-full border border-${tierColor}-500/30 animate-spin-reverse`}></div>
                
                {/* Layer 3: Inner Fast Ring */}
                <div className={`absolute inset-8 rounded-full border-4 border-${tierColor}-500/10 border-t-${tierColor}-400/50 animate-spin-fast`}></div>

                {/* Layer 4: The Core Glow */}
                <div className={`absolute inset-16 rounded-full bg-${tierColor}-500/10 blur-xl animate-core-pulse`}></div>
                
                {/* Layer 5: The Physical Core */}
                <div className={`
                    relative w-32 h-32 rounded-full bg-slate-900 border-2 border-${tierColor}-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.2)]
                    group-active:scale-95 transition-transform duration-75
                `}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
                    {state.currentTier === Tier.QUANTUM && <Atom className="w-16 h-16 text-cyan-400 animate-spin-slow" />}
                    {state.currentTier === Tier.MACROCOSM && <Sparkles className="w-16 h-16 text-green-400 animate-pulse" />}
                    {state.currentTier === Tier.COSMIC && <Infinity className="w-16 h-16 text-purple-400 animate-spin-slow" />}
                    {state.currentTier === Tier.MULTIVERSAL && <Layers className="w-16 h-16 text-fuchsia-400 animate-pulse" />}
                    {state.currentTier === Tier.OMNIPOTENT && <Crown className="w-16 h-16 text-amber-400 animate-bounce" />}
                </div>
              </button>

              <div className="absolute bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4 flex justify-center">
                {researchState.isActive ? (
                    <ResearchMonitor 
                      startTime={researchState.startTime} 
                      duration={researchState.duration}
                      tierName={state.currentTier}
                      progress={researchProgress}
                    />
                ) : (
                  <button
                    onClick={handleResearch}
                    disabled={state.resources < researchCost}
                    className={`
                      w-full max-w-sm flex items-center justify-center gap-3 px-8 py-4 rounded font-bold uppercase tracking-wider transition-all border
                      ${state.resources >= researchCost
                        ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-100 hover:bg-cyan-800/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105' 
                        : 'bg-slate-900/80 border-slate-800 text-slate-600 cursor-not-allowed'}
                    `}
                  >
                    <Cpu className="w-5 h-5" />
                    <span>Research ({Math.floor(researchCost).toLocaleString()})</span>
                  </button>
                )}
              </div>
              
               <div className="md:hidden absolute top-4 right-4 flex gap-2 z-40">
                  <button 
                      onClick={() => setShowPrestigeModal(true)}
                      className="p-2 bg-purple-900/40 border border-purple-500/30 text-purple-300 rounded-full"
                  >
                      <Infinity className="w-5 h-5" />
                  </button>
                  <button 
                      onClick={() => setShowSettingsModal(true)}
                      className="p-2 bg-slate-800/60 border border-slate-700 text-slate-400 rounded-full"
                  >
                      <Settings className="w-5 h-5" />
                  </button>
               </div>
            </main>

            {/* Right Panel */}
            <aside className="w-full md:w-96 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950/80 backdrop-blur-md z-10 h-[400px] md:h-auto">
              <div className="flex border-b border-slate-800 shrink-0">
                <button 
                    onClick={() => { setActiveTab('buildings'); playSound('click'); }}
                    className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-all relative overflow-hidden ${activeTab === 'buildings' ? 'text-cyan-400 bg-slate-900' : 'text-slate-500 hover:bg-slate-900/50'}`}
                >
                    <span className="relative z-10">Construct</span>
                    {activeTab === 'buildings' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_10px_cyan]"></div>}
                </button>
                <button 
                    onClick={() => { setActiveTab('helpers'); playSound('click'); }}
                    className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-all relative overflow-hidden ${activeTab === 'helpers' ? 'text-purple-400 bg-slate-900' : 'text-slate-500 hover:bg-slate-900/50'}`}
                >
                    <span className="relative z-10">Auto</span>
                    {activeTab === 'helpers' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_10px_purple]"></div>}
                </button>
                <button 
                    onClick={() => { setActiveTab('achievements'); playSound('click'); }}
                    className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-all relative overflow-hidden ${activeTab === 'achievements' ? 'text-yellow-400 bg-slate-900' : 'text-slate-500 hover:bg-slate-900/50'}`}
                >
                    <span className="relative z-10">Data</span>
                    {activeTab === 'achievements' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-yellow-500 shadow-[0_0_10px_orange]"></div>}
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden relative bg-black/20">
                {activeTab === 'buildings' && (
                  <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 pb-20 custom-scrollbar">
                    {state.buildings.map((building) => (
                        <BuildingCard 
                          key={building.id} 
                          building={building} 
                          canAfford={state.resources >= Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count))}
                          onBuy={(id) => handleBuyBuilding(id)}
                          totalProduction={currentProductionRate}
                        />
                    ))}
                    <div className="text-center py-8 opacity-50">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                           -- End of Fabrication List --
                        </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'helpers' && (
                  <div className="absolute inset-0">
                    <HelperPanel 
                        helpers={state.helpers}
                        resources={state.resources}
                        onBuy={(id) => handleBuyHelper(id)}
                        onToggle={(id) => { dispatch({ type: 'TOGGLE_HELPER', id }); playSound('click'); }}
                    />
                  </div>
                )}

                {activeTab === 'achievements' && (
                  <div className="absolute inset-0">
                    <AchievementPanel achievements={state.achievements} gameState={state} />
                  </div>
                )}
              </div>
            </aside>

          </div>
      </div>

      {state.achievementQueue && state.achievementQueue.length > 0 && (
          <AchievementToast 
            queue={state.achievementQueue} 
            onDismiss={(id) => dispatch({ type: 'DISMISS_ACHIEVEMENT', id })} 
          />
      )}

      {showPrestigeModal && (
        <PrestigeModal 
          state={state} 
          onPrestige={handlePrestige} 
          onCancel={() => setShowPrestigeModal(false)} 
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          state={state}
          onClose={() => setShowSettingsModal(false)}
          onImport={(newState) => {
            dispatch({ type: 'LOAD_GAME', state: newState });
            playSound('unlock');
          }}
          onReset={handleHardReset}
        />
      )}

      {showDebugMenu && (
        <DebugMenu 
           onClose={() => setShowDebugMenu(false)}
           onCheat={handleCheat}
           currentTier={state.currentTier}
        />
      )}
    </div>
  );
};

export default App;
