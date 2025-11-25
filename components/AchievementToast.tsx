
import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';
import { Trophy } from 'lucide-react';

interface AchievementToastProps {
  queue: Achievement[];
  onDismiss: (id: string) => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ queue, onDismiss }) => {
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
    }
  }, [queue, current]);

  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        onDismiss(current.id);
        setCurrent(null);
      }, 4000); // Show for 4 seconds
      return () => clearTimeout(timer);
    }
  }, [current, onDismiss]);

  if (!current) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-toast-slide-up">
      <div className="bg-slate-900/95 backdrop-blur-md border border-yellow-500/50 text-slate-100 px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center gap-4 min-w-[300px]">
        <div className="p-3 bg-yellow-500/20 rounded-full border border-yellow-500/30 animate-pulse">
           <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-0.5">Achievement Unlocked</h4>
          <p className="font-bold text-lg">{current.name}</p>
          <p className="text-xs text-slate-400 italic">"{current.flavorText}"</p>
        </div>
      </div>
    </div>
  );
};

export default AchievementToast;
