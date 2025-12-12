import React from 'react';
import { CursorMode } from '../types';
import { Scan, Sparkles, Navigation, MousePointer2, Aperture } from 'lucide-react';

interface CursorControlProps {
  currentMode: CursorMode;
  setMode: (mode: CursorMode) => void;
  onAction?: () => void; // Optional action trigger
  isProcessing?: boolean;
}

const CursorControl: React.FC<CursorControlProps> = ({ currentMode, setMode, onAction, isProcessing }) => {
  const tools = [
    { mode: CursorMode.DEFAULT, icon: MousePointer2, label: 'Default' },
    { mode: CursorMode.VISION_SNAP, icon: Scan, label: 'VisionSnap' },
    { mode: CursorMode.CLARIFY, icon: Sparkles, label: 'Clarify' },
    { mode: CursorMode.NAVIGATOR, icon: Navigation, label: 'Navigator' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 flex items-center gap-4">
      {/* Mode Switcher */}
      <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl rounded-full p-2 flex items-center gap-2 ring-1 ring-black/5">
        {tools.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => setMode(tool.mode)}
            className={`
              relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300
              ${currentMode === tool.mode 
                ? 'bg-[#1A1A1A] text-white shadow-lg scale-110' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-black'}
            `}
            aria-label={tool.label}
          >
            <tool.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
              <div className="bg-[#1A1A1A] text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-white/10 flex flex-col items-center">
                {tool.label}
                {/* Arrow */}
                <div className="w-2 h-2 bg-[#1A1A1A] rotate-45 absolute -bottom-1 border-r border-b border-white/10"></div>
              </div>
            </div>
            
            {/* Active Indicator */}
            {currentMode === tool.mode && (
              <span className="absolute -bottom-1 w-1 h-1 bg-[#1A1A1A] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Manual Trigger Button for VisionSnap */}
      {currentMode === CursorMode.VISION_SNAP && (
        <button
          onClick={onAction}
          disabled={isProcessing}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-xl transition-all transform hover:scale-105 active:scale-95
            ${isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 text-white hover:bg-orange-700 ring-4 ring-orange-100'}
          `}
        >
          <Aperture className={`w-5 h-5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Scanning...' : 'Scan Image'}</span>
        </button>
      )}
    </div>
  );
};

export default CursorControl;