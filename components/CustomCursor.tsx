import React from 'react';
import { CursorMode, CursorState } from '../types';
import { Scan, Sparkles, Navigation, Mic, Copy, Loader2, Radio, Link, Crop, MousePointer2, Wand2, Compass } from 'lucide-react';

interface CustomCursorProps {
  cursorState: CursorState;
  mousePosition: { x: number; y: number };
}

const CustomCursor: React.FC<CustomCursorProps> = ({ cursorState, mousePosition }) => {
  const { mode, isHovering, isProcessing, isListening, aiResponse } = cursorState;
  
  const getCursorContent = () => {
    switch (mode) {
      case CursorMode.VISION_SNAP:
        return (
          <div className="flex flex-col items-center">
            {/* Main Cursor Icon */}
            <div className={`
                relative flex items-center justify-center transition-all duration-300
                ${isHovering 
                    ? 'w-14 h-14 border-2 border-orange-500 bg-orange-500/10 backdrop-blur-sm rounded-lg' 
                    : 'w-8 h-8'
                }
            `}>
                {isHovering ? (
                    <>
                        <Scan className="w-6 h-6 text-orange-600" />
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-600 -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-orange-600 -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-orange-600 -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange-600 -mb-1 -mr-1"></div>
                    </>
                ) : (
                    <div className="relative">
                        <Crop className="w-6 h-6 text-gray-700 stroke-[1.5]" />
                        <div className="absolute -right-1 -bottom-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    </div>
                )}
            </div>

            {/* Contextual Hints */}
            {!isProcessing && !aiResponse && (
                <div className="mt-3 flex flex-col gap-1.5 items-center pointer-events-none">
                    {isHovering ? (
                         <div className="flex flex-col gap-1 items-center">
                             <div className="bg-black/90 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full shadow-xl font-medium tracking-wide border border-white/10">
                                CLICK TO SCAN
                            </div>
                             <div className="bg-white/80 backdrop-blur-md text-orange-800 text-[9px] px-2 py-0.5 rounded-full border border-orange-100 shadow-sm flex items-center gap-1">
                                <Link size={8} className="text-orange-600" /> Shift+Click for URL
                            </div>
                         </div>
                    ) : (
                        <div className="bg-white/50 backdrop-blur-sm text-gray-800 text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/20 shadow-sm">
                            Hold & Drag to Scan
                        </div>
                    )}
                </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="mt-4 flex items-center gap-2 bg-black/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/10">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" /> 
                <span className="text-xs font-medium tracking-wide">{aiResponse || "Analyzing..."}</span>
              </div>
            )}

            {/* Result State */}
             {aiResponse && !isProcessing && (
              <div className="mt-4 bg-white/95 backdrop-blur-xl border border-orange-200/50 p-3 rounded-xl shadow-2xl max-w-[220px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 mb-1.5 uppercase tracking-wider">
                    {/* Dynamic Icon */}
                    {aiResponse.includes("Click to Copy") ? <MousePointer2 size={12}/> : (aiResponse === "Image URL Copied!" ? <Link size={12}/> : <Copy size={12}/>)} 
                    
                    {/* Dynamic Header */}
                    {aiResponse.includes("Click to Copy") 
                        ? "Action Required" 
                        : (aiResponse === "Image URL Copied!" || aiResponse === "Text from Image Copied!" || aiResponse === "Text from Area Copied!" || aiResponse === "Copied Successfully!" ? "Success" : "Copied")}
                </div>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-4 font-medium">
                    {aiResponse}
                </p>
              </div>
            )}
          </div>
        );

      case CursorMode.CLARIFY:
        return (
          <div className="flex items-start gap-4">
            {/* Modern Wand Icon */}
            <div className={`
                relative flex items-center justify-center w-10 h-10
                transition-all duration-500 ease-out
                ${isHovering ? 'scale-110' : 'scale-100'}
            `}>
                <div className={`absolute inset-0 bg-sundial-purple/20 rounded-full blur-md transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`} />
                <div className="bg-white p-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-purple-100 z-10 relative">
                    <Wand2 className={`w-4 h-4 text-purple-600 ${isProcessing ? 'animate-pulse' : ''}`} />
                </div>
                {isProcessing && (
                    <div className="absolute inset-0 border-2 border-purple-400 rounded-full border-t-transparent animate-spin" />
                )}
            </div>

            {/* Content Card */}
            {(aiResponse || isProcessing) && (
              <div className="relative z-10 animate-in fade-in slide-in-from-left-2 duration-300 origin-top-left">
                  <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] max-w-[320px] min-w-[200px]">
                    {isProcessing ? (
                       <div className="space-y-3">
                           <div className="h-2 bg-purple-100 rounded-full w-24 animate-pulse" />
                           <div className="h-2 bg-gray-100 rounded-full w-full animate-pulse delay-75" />
                           <div className="h-2 bg-gray-100 rounded-full w-2/3 animate-pulse delay-150" />
                       </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
                            <span className="font-serif italic text-lg text-purple-900 leading-none">Clarified</span>
                            <Sparkles className="w-3 h-3 text-purple-400" />
                        </div>
                        <p className="font-sans text-[13px] text-gray-800 leading-relaxed font-medium">
                            {aiResponse}
                        </p>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>
        );

      case CursorMode.NAVIGATOR:
        return (
          <div className="flex items-center gap-4 group">
             {/* Tech-Noir Compass */}
            <div className="relative">
                 {/* Ripple Effect for Listening */}
                 {isListening && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-red-500/50 animate-[ping_1.5s_ease-out_infinite]" />
                        <div className="absolute inset-[-4px] rounded-full border border-red-500/30 animate-[ping_2s_ease-out_infinite_0.5s]" />
                    </>
                 )}
                 
                 <div className={`
                    relative w-10 h-10 flex items-center justify-center rounded-full bg-[#111] text-white shadow-2xl z-10 border border-gray-800
                    transition-transform duration-300 ease-spring
                    ${isHovering ? 'scale-110' : ''}
                 `}>
                    <Compass className={`w-5 h-5 transition-transform duration-700 ${isHovering ? 'rotate-180' : 'rotate-0'}`} strokeWidth={1.5} />
                    
                    {/* Status Dot */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111] transition-colors duration-300 ${isListening ? 'bg-red-500' : (isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-green-500')}`} />
                 </div>
            </div>
            
            <div className="flex flex-col gap-2 transition-all duration-300">
                {/* Instruction / Status Pill */}
               <div className={`
                    px-4 py-1.5 rounded-full backdrop-blur-md text-xs font-medium tracking-wide border shadow-lg
                    transition-colors duration-300 self-start
                    ${isListening 
                        ? 'bg-red-500/90 border-red-400 text-white' 
                        : (isProcessing 
                            ? 'bg-blue-500/90 border-blue-400 text-white' 
                            : 'bg-[#111]/80 border-white/10 text-gray-300')}
               `}>
                    {isListening ? "Listening..." : isProcessing ? "Navigating..." : "Navigator Ready"}
               </div>

              {/* Response Bubble */}
              {aiResponse && (
                <div className="bg-[#1A1A1A]/95 backdrop-blur-xl text-white p-5 rounded-[1.25rem] rounded-tl-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] max-w-[280px] border border-white/10 animate-in fade-in slide-in-from-bottom-3">
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <Navigation size={10} />
                      <span>Insight</span>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-gray-100">
                     {aiResponse}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="relative pointer-events-none drop-shadow-xl">
             <MousePointer2 className="w-5 h-5 text-black fill-white stroke-[1.5]" />
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed pointer-events-none z-[100] transition-transform duration-75 ease-out will-change-transform"
      style={{
        left: mousePosition.x,
        top: mousePosition.y,
        // Center the custom cursors, but keep default pointer tip at 0,0
        transform: mode === CursorMode.DEFAULT ? 'translate(0, 0)' : 'translate(-50%, -50%)',
      }}
    >
      {getCursorContent()}
    </div>
  );
};

export default CustomCursor;