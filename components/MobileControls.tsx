import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Direction } from '../types';

interface MobileControlsProps { onDirectionChange: (dir: Direction) => void; }
export const MobileControls: React.FC<MobileControlsProps> = ({ onDirectionChange }) => {
  const btnClass = "w-14 h-14 flex items-center justify-center bg-gray-800/80 active:bg-blue-600 active:text-white rounded-xl border border-gray-700 backdrop-blur-sm transition-colors touch-manipulation shadow-lg";
  return (
    <div className="grid grid-cols-3 gap-2">
      <div />
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirectionChange(Direction.UP); }} aria-label="Up"><ChevronUp className="w-8 h-8" /></button>
      <div />
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirectionChange(Direction.LEFT); }} aria-label="Left"><ChevronLeft className="w-8 h-8" /></button>
      <div className="w-14 h-14 flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-gray-700/50" /></div>
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirectionChange(Direction.RIGHT); }} aria-label="Right"><ChevronRight className="w-8 h-8" /></button>
      <div />
      <button className={btnClass} onPointerDown={(e) => { e.preventDefault(); onDirectionChange(Direction.DOWN); }} aria-label="Down"><ChevronDown className="w-8 h-8" /></button>
      <div />
    </div>
  );
};
