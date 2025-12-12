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
          >
            <tool.icon className="w-5 h-5" />
            
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {tool.label}
            </span>
            
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