import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position to the left of the element, centered vertically
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.left - 12 // 12px gap
      });
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div 
          className="fixed z-[100] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            top: coords.top, 
            left: coords.left,
            transform: 'translate(-100%, -50%)' // Center vertically, move completely to left of anchor
          }}
        >
          <div className="bg-slate-950/95 backdrop-blur border border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-lg p-4 max-w-xs w-64 text-sm text-slate-200 relative">
             {content}
             
             {/* Arrow pointing right */}
             <div 
                className="absolute top-1/2 right-0 translate-x-[5px] -translate-y-1/2 w-3 h-3 bg-slate-950 border-r border-t border-slate-700 rotate-45"
             ></div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;