
import React, { useEffect, useState } from 'react';

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface FloatingTextOverlayProps {
  events: FloatingText[];
}

const FloatingTextOverlay: React.FC<FloatingTextOverlayProps> = ({ events }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="absolute animate-float-fade font-mono font-bold text-cyan-300 text-xl select-none"
          style={{ 
            left: evt.x, 
            top: evt.y,
            textShadow: '0 0 10px rgba(6,182,212,0.8)'
          }}
        >
          {evt.text}
        </div>
      ))}
    </div>
  );
};

export default FloatingTextOverlay;
