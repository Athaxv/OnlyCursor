import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CursorMode, CursorState } from './types';
import CustomCursor from './components/CustomCursor';
import CursorControl from './components/CursorControl';
import Documentation from './components/Documentation';
import { clarifyText, navigatorAssist, navigatorVoiceAssist, analyzeImageRegion, urlToBase64, blobToBase64 } from './services/geminiService';
import { ArrowRight, Zap, Scan, Sparkles, Navigation, Command, ChevronRight, MousePointer2, Search, TrendingUp, BarChart3, PieChart, Play, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [cursorMode, setCursorMode] = useState<CursorMode>(CursorMode.DEFAULT);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // View State: 'home' | 'docs'
  const [view, setView] = useState<'home' | 'docs'>('home');

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.DEFAULT,
    isHovering: false,
    hoverTarget: null,
    isProcessing: false,
    isListening: false,
    aiResponse: null
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; features: { label: string; action?: () => void; icon?: React.ReactNode }[] } | null>(null);

  // Selection State for VisionSnap Drag
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  
  // Refs for drag logic
  const isSelectingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const selectionBoxRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Refs for logic
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoveredElementRef = useRef<HTMLElement | null>(null);
  const currentHoverContextRef = useRef<string>(""); 
  const lastImageSourceRef = useRef<string | null>(null); 
  const wasDraggingRef = useRef<boolean>(false); 
  const pendingCopyRef = useRef<string | null>(null); 

  // Audio Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  // --- ACTIONS & HELPERS (Defined before effects) ---

  // ACTION: Area Scan (VisionSnap)
  const performAreaScan = async (x: number, y: number, w: number, h: number) => {
      setCursorState(prev => ({ ...prev, isProcessing: true, aiResponse: "Reading Area..." }));
      try {
          // Delay to ensure selection box is visually removed
          await new Promise(resolve => setTimeout(resolve, 100));

          const canvas = await html2canvas(document.body, {
              x: x + window.scrollX,
              y: y + window.scrollY,
              width: w,
              height: h,
              useCORS: true, 
              scale: 2,       
              logging: false,
              backgroundColor: null,
              ignoreElements: (el) => el.classList.contains('cursor-overlay') || el.classList.contains('cursor-none')
          });
          
          const base64 = canvas.toDataURL('image/png');
          const text = await analyzeImageRegion(base64);
          
          if (text && text !== "No readable content found.") {
             try {
                await navigator.clipboard.writeText(text);
                setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Text from Area Copied!" }));
             } catch (clipboardError) {
                pendingCopyRef.current = text;
                setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Click to Copy Result" }));
             }
          } else {
             setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "No Text Found" }));
          }

      } catch (err) {
          console.error(err);
          setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Scan Failed" }));
      }
  };

  const performImageScan = async (imgUrl: string) => {
    setCursorState(prev => ({ ...prev, isProcessing: true, aiResponse: "Reading Image..." }));
    try {
        const base64 = await urlToBase64(imgUrl);
        const text = await analyzeImageRegion(base64);
        
        try {
            await navigator.clipboard.writeText(text);
            setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Text from Image Copied!" }));
        } catch (clipboardError) {
             pendingCopyRef.current = text;
             setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Click to Copy Result" }));
        }
    } catch (err) {
        setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Scan Failed" }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setCursorState(prev => ({ ...prev, isListening: true, aiResponse: null }));
    } catch (error) {
      console.error("Microphone access denied:", error);
      setCursorState(prev => ({ ...prev, aiResponse: "Mic Blocked" }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        setCursorState(prev => ({ ...prev, isListening: false, isProcessing: true }));

        try {
           const base64Audio = await blobToBase64(audioBlob);
           const response = await navigatorVoiceAssist(base64Audio, currentHoverContextRef.current);
           setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: response }));
        } catch (error) {
           setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Error processing audio" }));
        }
      };
    }
  };

  const handleManualVisionTrigger = () => {
    if (cursorMode === CursorMode.VISION_SNAP && lastImageSourceRef.current) {
      performImageScan(lastImageSourceRef.current);
    } else {
      setCursorState(prev => ({ ...prev, aiResponse: "Select an image first" }));
      setTimeout(() => setCursorState(prev => ({ ...prev, aiResponse: null })), 2000);
    }
  };

  // 1. GLOBAL MOUSE TRACKING & SELECTION LOGIC
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Handle Selection Drag (VisionSnap)
      if (isSelectingRef.current && dragStartRef.current) {
        const currentX = e.clientX;
        const currentY = e.clientY;
        const startX = dragStartRef.current.x;
        const startY = dragStartRef.current.y;

        const w = currentX - startX;
        const h = currentY - startY;
        
        const newBox = {
            x: w < 0 ? currentX : startX,
            y: h < 0 ? currentY : startY,
            w: Math.abs(w),
            h: Math.abs(h)
        };
        
        if (Math.abs(w) > 2 || Math.abs(h) > 2) {
             setSelectionBox(newBox);
             selectionBoxRef.current = newBox;
        }
        return; 
      }

      // Identify element under cursor
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!target) return;

      if (lastHoveredElementRef.current === target) return;
      lastHoveredElementRef.current = target;

      if (!cursorState.isProcessing && !cursorState.isListening) {
         let interactionType: 'text' | 'image' | 'interactive' | null = null;
         let content = '';
         
         const tagName = target.tagName ? target.tagName.toUpperCase() : '';

         if (tagName === 'IMG') {
            interactionType = 'image';
            content = (target as HTMLImageElement).src;
            lastImageSourceRef.current = content;
         } else if (['P', 'H1', 'H2', 'H3', 'H4', 'SPAN', 'LI'].includes(tagName) && target.innerText.trim().length > 5) {
            interactionType = 'text';
            content = target.innerText;
         } else if (['BUTTON', 'A', 'INPUT'].includes(tagName) || target.onclick || target.closest('button') || target.closest('a')) {
            interactionType = 'interactive';
            content = target.innerText || target.getAttribute('aria-label') || 'Interactive Element';
         }

         currentHoverContextRef.current = content || "General Page Area";

         if (interactionType) {
            handleDynamicHover(target, content, interactionType);
         } else {
            setCursorState(prev => ({ 
                ...prev, 
                isHovering: false, 
                hoverTarget: null, 
                aiResponse: (prev.isProcessing || prev.isListening) ? prev.aiResponse : null 
            }));
         }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Left Click: Start Selection if VisionSnap
        if (e.button === 0 && cursorMode === CursorMode.VISION_SNAP) { 
           isSelectingRef.current = true;
           dragStartRef.current = { x: e.clientX, y: e.clientY };
           wasDraggingRef.current = false;
           
           if (!pendingCopyRef.current) {
             setCursorState(prev => ({ ...prev, aiResponse: null }));
           }
           setSelectionBox(null);
           setContextMenu(null);
        }
        
        // Any click closes context menu
        if (e.button === 0 && contextMenu) {
            setContextMenu(null);
        }
    };
  
    const handleMouseUp = async (e: MouseEvent) => {
        if (cursorMode === CursorMode.VISION_SNAP && isSelectingRef.current) {
           isSelectingRef.current = false;
           dragStartRef.current = null;
           
           const box = selectionBoxRef.current;
           if (box && box.w > 20 && box.h > 20) {
              wasDraggingRef.current = true;
              const captureBox = { ...box };
              selectionBoxRef.current = null;
              await performAreaScan(captureBox.x, captureBox.y, captureBox.w, captureBox.h);
              setSelectionBox(null); 
           } else {
              setSelectionBox(null);
              selectionBoxRef.current = null;
              wasDraggingRef.current = false;
           }
        }
    };

    // RIGHT CLICK HANDLER
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      
      let features: { label: string; action?: () => void; icon?: React.ReactNode }[] = [];
      
      if (cursorMode === CursorMode.DEFAULT) {
         features = [
             { label: "Switch to VisionSnap", action: () => setCursorMode(CursorMode.VISION_SNAP), icon: <Scan size={14} /> },
             { label: "Switch to Clarify", action: () => setCursorMode(CursorMode.CLARIFY), icon: <Sparkles size={14} /> },
             { label: "Switch to Navigator", action: () => setCursorMode(CursorMode.NAVIGATOR), icon: <Navigation size={14} /> }
         ];
      } else if (cursorMode === CursorMode.VISION_SNAP) {
        features = [
            { label: "Drag to Scan Area" }, 
            { label: "Click Image to Scan" }, 
            { label: "Shift+Click for URL" }
        ];
      } else if (cursorMode === CursorMode.CLARIFY) {
        features = [
            { label: "Hover to Clarify" }, 
            { label: "Auto-Simplification" }, 
            { label: "Tone Analysis" }
        ];
      } else if (cursorMode === CursorMode.NAVIGATOR) {
        features = [
          { 
              label: "Start Voice Command", 
              action: () => startRecording() 
          },
          { 
              label: "Analyze Element Intent", 
              action: async () => {
                  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                  if (el) {
                      const context = el.innerText || el.getAttribute('aria-label') || el.tagName;
                      setCursorState(prev => ({ ...prev, isProcessing: true, aiResponse: "Analyzing Intent..." }));
                      const response = await navigatorAssist(context, document.title);
                      setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: response }));
                  }
              }
          },
          { 
              label: "Clear Context",
              action: () => setCursorState(prev => ({ ...prev, aiResponse: null }))
          }
        ];
      }

      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        features
      });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [cursorMode, cursorState.isProcessing, cursorState.isListening, contextMenu]); 


  // 2. DYNAMIC HOVER LOGIC
  const handleDynamicHover = useCallback((target: HTMLElement, content: string, type: 'text' | 'image' | 'interactive') => {
    if (cursorMode === CursorMode.DEFAULT) return;

    setCursorState(prev => ({ 
        ...prev, 
        isHovering: true, 
        hoverTarget: content.substring(0, 20) 
    }));

    if (cursorMode === CursorMode.CLARIFY && type === 'text') {
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = setTimeout(async () => {
        setCursorState(prev => ({ ...prev, isProcessing: true, aiResponse: null }));
        const response = await clarifyText(content);
        setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: response }));
      }, 800);
    }
  }, [cursorMode]);


  // 3. GLOBAL CLICK HANDLER
  useEffect(() => {
    const handleGlobalClick = async (e: MouseEvent) => {
        // PRIORITY 1: Handle Pending Copy (Fix for "Write permission denied")
        if (pendingCopyRef.current) {
            e.preventDefault();
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(pendingCopyRef.current);
                setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Copied Successfully!" }));
            } catch (err) {
                console.error("Manual copy failed", err);
                setCursorState(prev => ({ ...prev, aiResponse: "Copy Error" }));
            }
            pendingCopyRef.current = null;
            setTimeout(() => setCursorState(prev => ({ ...prev, aiResponse: null })), 2000);
            return;
        }

        if (cursorMode === CursorMode.DEFAULT) return;
        
        // Prevent click if we just finished dragging
        if (cursorMode === CursorMode.VISION_SNAP && wasDraggingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            wasDraggingRef.current = false;
            return;
        }

        const target = e.target as HTMLElement;
        if (!target) return;

        // VisionSnap Click Logic
        if (cursorMode === CursorMode.VISION_SNAP && target.tagName === 'IMG') {
            e.preventDefault();
            const imgUrl = (target as HTMLImageElement).src;

            if (e.shiftKey) {
                try {
                    await navigator.clipboard.writeText(imgUrl);
                    setCursorState(prev => ({ 
                        ...prev, 
                        isProcessing: false, 
                        aiResponse: "Image URL Copied!" 
                    }));
                } catch (e) {
                     pendingCopyRef.current = imgUrl;
                     setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: "Click to Copy URL" }));
                }
                setTimeout(() => setCursorState(prev => ({ ...prev, aiResponse: null })), 2000);
            } else {
                performImageScan(imgUrl);
            }
        }

        // Navigator Click Logic
        if (cursorMode === CursorMode.NAVIGATOR && !cursorState.isListening) {
            if (!target.innerText && !target.getAttribute('alt')) return;

            e.preventDefault();
            e.stopPropagation(); 
            
            const context = target.innerText || target.getAttribute('alt') || target.tagName;
            setCursorState(prev => ({ ...prev, isProcessing: true, aiResponse: "Thinking..." }));
            
            const explanation = await navigatorAssist(context, document.title);
            setCursorState(prev => ({ ...prev, isProcessing: false, aiResponse: explanation }));
        }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [cursorMode, cursorState.isListening]);


  // 4. VOICE HANDLER
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (cursorMode !== CursorMode.NAVIGATOR) return;
      if (e.code === 'Space' && !e.repeat && !cursorState.isListening) {
         e.preventDefault();
         startRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       if (cursorMode !== CursorMode.NAVIGATOR) return;
       if (e.code === 'Space' && cursorState.isListening) {
          e.preventDefault();
          stopRecording();
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cursorMode, cursorState.isListening]);

  useEffect(() => {
    setCursorState(prev => ({
      ...prev,
      mode: cursorMode,
      aiResponse: null,
      isProcessing: false,
      isListening: false,
      isHovering: false
    }));
    setSelectionBox(null);
    setContextMenu(null);
    isSelectingRef.current = false;
    pendingCopyRef.current = null; // Reset pending copy
    if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [cursorMode]);

  return (
    <div className={`min-h-screen bg-sundial-bg text-sundial-text selection:bg-orange-200 overflow-x-hidden font-sans ${cursorMode !== CursorMode.DEFAULT ? 'cursor-none' : ''}`}>
      
      {/* Area Selection Overlay */}
      {selectionBox && (
          <div 
             className="fixed border-2 border-orange-500 bg-orange-500/10 z-50 pointer-events-none cursor-overlay backdrop-blur-[1px]"
             style={{
                 left: selectionBox.x,
                 top: selectionBox.y,
                 width: selectionBox.w,
                 height: selectionBox.h,
             }}
          >
              <div className="absolute -top-6 left-0 bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-t-md font-medium tracking-wide">
                  SCANNING REGION
              </div>
          </div>
      )}

      {/* Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div 
          className="fixed z-[9999] bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-xl p-2 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2 border-b border-gray-100 mb-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
               {cursorMode.replace('_', ' ')} MODE
             </span>
          </div>
          <div className="flex flex-col gap-1">
            {contextMenu.features.map((feature, idx) => (
              <div 
                 key={idx} 
                 onClick={(e) => {
                     e.stopPropagation();
                     if (feature.action) {
                         feature.action();
                         setContextMenu(null);
                     }
                 }}
                 className="flex items-center justify-between px-3 py-2 hover:bg-black/5 rounded-lg text-sm text-gray-700 font-medium cursor-pointer group transition-colors"
              >
                 <div className="flex items-center gap-2">
                    {feature.icon && <span className="text-gray-500">{feature.icon}</span>}
                    <span>{feature.label}</span>
                 </div>
                 {feature.action ? (
                     <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-black transition-colors" />
                 ) : (
                     <Command className="w-3 h-3 text-gray-300 group-hover:text-black transition-colors" />
                 )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Cursor Overlay */}
      <div className="cursor-overlay">
         <CustomCursor cursorState={cursorState} mousePosition={mousePos} />
      </div>

      {/* --- REPLICATED NAV --- */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-sundial-bg/90 backdrop-blur-md border-b border-sundial-dark/5 px-6 md:px-12 py-5 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView('home')}>
          <div className="w-7 h-7 rounded-full bg-sundial-dark flex items-center justify-center text-white font-serif italic text-lg shadow-md group-hover:scale-105 transition-transform">o</div>
          <span className="font-serif text-2xl tracking-tight text-sundial-dark">onlyCursor</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <span className="hover:text-black cursor-pointer transition-colors" onClick={() => setView('home')}>Features</span>
            <span className="hover:text-black cursor-pointer transition-colors flex items-center gap-1">Solutions <ChevronDown size={14} className="text-gray-400"/></span>
            <span className="hover:text-black cursor-pointer transition-colors" onClick={() => setView('docs')}>Docs</span>
            <span className="hover:text-black cursor-pointer transition-colors">Pricing</span>
            <span className="hover:text-black cursor-pointer transition-colors">Company</span>
            <span className="hover:text-black cursor-pointer transition-colors">Login</span>
        </div>
        <div className="flex items-center gap-4">
           <button className="bg-[#663F3F] text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wide uppercase hover:bg-[#523030] transition-all hover:scale-105 shadow-lg flex items-center gap-2">
             Demo with Founder D
           </button>
           <button onClick={() => setView('docs')} className="bg-sundial-dark text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-wide uppercase hover:bg-black transition-all hover:scale-105 shadow-lg flex items-center gap-2">
             Getting Started
           </button>
        </div>
      </nav>

      {view === 'home' ? (
      /* --- MAIN CONTENT --- */
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-32 relative z-20 space-y-20 md:space-y-32">
        
        {/* HERO SECTION */}
        <section className="text-center flex flex-col items-center">
             <h1 className="font-serif text-5xl md:text-8xl text-sundial-dark tracking-tight leading-[1] md:leading-[0.95] mb-8 mt-10">
                Opinionated Intelligence <br />
                <span className="text-[#8B5E5E]">to guide your decisions</span>
             </h1>
             <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 font-light leading-relaxed">
                 Smart dashboards + analytics + notebooks in one, so <br/>
                 <span className="bg-[#EADFFF] px-2 py-0.5 rounded text-[#592E2E] font-medium mx-1">analysts</span> can self-serve insights with confidence
             </p>
             
             {/* LOGOS */}
             <div className="flex flex-wrap gap-8 md:gap-12 items-center justify-center opacity-40 mb-16 grayscale">
                <span className="text-xl font-bold font-serif">character.ai</span>
                <span className="text-xl font-bold">OpenAI</span>
                <span className="text-xl font-bold font-mono tracking-tighter">GAMMA</span>
                <span className="text-xl font-bold italic">Picsart</span>
                <span className="text-xl font-bold tracking-widest uppercase">Mirage</span>
             </div>

             {/* TILTED DASHBOARDS VISUAL */}
             <div className="relative w-full max-w-6xl mx-auto h-[400px] md:h-[600px] perspective-[2000px] group">
                 <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] bg-white rounded-xl shadow-2xl border border-gray-100 transform rotate-x-12 group-hover:rotate-x-0 transition-transform duration-700 ease-out z-20 overflow-hidden">
                      {/* Fake Dashboard Header */}
                      <div className="h-12 border-b flex items-center px-4 gap-2">
                         <div className="w-3 h-3 rounded-full bg-red-400"></div>
                         <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                         <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      {/* Fake Dashboard Content */}
                      <div className="p-6 grid grid-cols-3 gap-4">
                         <div className="col-span-2 bg-gray-50 h-32 rounded-lg"></div>
                         <div className="bg-purple-50 h-32 rounded-lg"></div>
                         <div className="bg-blue-50 h-32 rounded-lg"></div>
                         <div className="col-span-2 bg-gray-50 h-32 rounded-lg"></div>
                      </div>
                 </div>
                 {/* Decorative background blur */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-200/30 blur-[100px] -z-10 pointer-events-none"></div>
             </div>
        </section>

        {/* FEATURE 1: SOURCE OF TRUTH */}
        <section className="bg-gradient-to-br from-[#FFF5F5] to-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-stone-100 relative overflow-hidden">
             <div className="grid md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                 <div className="flex flex-col justify-center">
                    <div className="mb-8">
                       <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 block">Pain Point —</span>
                       <p className="text-2xl text-gray-400 font-light leading-snug">
                         "We've got hundreds of tables and dashboards but no shared picture"
                       </p>
                    </div>
                    <div className="h-px bg-gray-200 w-full mb-8"></div>
                    <div>
                       <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 block">How onlyCursor Solves It —</span>
                       <h3 className="font-serif text-4xl md:text-5xl text-sundial-dark mb-6 leading-tight">Canonical Source of Truth.</h3>
                       <p className="text-gray-600 text-lg leading-relaxed font-light">
                          onlyCursor curates a store of trusted metrics, entities and events that gets your entire company on the same page.
                       </p>
                    </div>
                 </div>

                 {/* RIGHT COLUMN: UI MOCKUP */}
                 <div className="relative">
                     <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                         <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-gray-400 text-sm">
                            <Search size={16} />
                            Search for a metric...
                         </div>
                         <div className="space-y-1">
                            {['Daily Active Users', 'D1 Retention', 'Weekly Retention', 'Custom Segments', 'Account Age'].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group cursor-pointer transition-colors">
                                   <span className="font-medium text-gray-700 text-sm">{item}</span>
                                   <div className="w-4 h-4 rounded-full border border-gray-200 group-hover:border-purple-400"></div>
                                </div>
                            ))}
                         </div>
                     </div>
                 </div>
             </div>

             {/* TESTIMONIAL FOOTER */}
             <div className="mt-16 grid md:grid-cols-2 gap-6">
                 <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-white/60">
                     <p className="text-lg text-sundial-dark font-medium leading-relaxed mb-4">
                        "We trust what's on onlyCursor more than we trust wading through our own tables"
                     </p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">JN</div>
                        <div>
                           <div className="text-xs font-bold uppercase tracking-wider text-gray-900">Jon Noronha</div>
                           <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Co-Founder, Gamma</div>
                        </div>
                     </div>
                 </div>
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 flex items-center justify-between group cursor-pointer border border-blue-100/50 hover:border-blue-200 transition-colors">
                     <div>
                        <h4 className="font-serif text-xl text-gray-800 mb-2">How onlyCursor helped Gamma reach 50M users</h4>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600">Read Their Story</span>
                     </div>
                     <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                 </div>
             </div>
        </section>

        {/* FEATURE 2: WHAT REALLY MATTERS */}
        <section className="bg-gradient-to-br from-[#FDF4FF] to-white rounded-[3rem] p-8 md:p-16 shadow-sm border border-stone-100 relative overflow-hidden">
             <div className="grid md:grid-cols-2 gap-12 md:gap-24 relative z-10">
                 <div className="flex flex-col justify-center order-2 md:order-1">
                    <div className="mb-8">
                       <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 block">Pain Point —</span>
                       <p className="text-2xl text-gray-400 font-light leading-snug">
                         "We don't want to miss an important insight because we're not looking in the right place"
                       </p>
                    </div>
                    <div className="h-px bg-gray-200 w-full mb-8"></div>
                    <div>
                       <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4 block">How onlyCursor Solves It —</span>
                       <h3 className="font-serif text-4xl md:text-5xl text-sundial-dark mb-6 leading-tight">World-class team to guide you on what really matters</h3>
                       <p className="text-gray-600 text-lg leading-relaxed font-light">
                          onlyCursor's team of experts understands your company's context and directs you towards the best analyses for your business goals.
                       </p>
                    </div>
                 </div>

                 {/* RIGHT COLUMN: CHART MOCKUP */}
                 <div className="relative order-1 md:order-2">
                     <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 h-full flex flex-col justify-center">
                         <div className="flex items-center gap-2 mb-6">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">ARR Growth</span>
                         </div>
                         {/* CSS Line Chart */}
                         <div className="w-full h-40 flex items-end gap-2 px-4 relative">
                            <div className="absolute inset-0 border-b border-l border-gray-100"></div>
                            {/* Simple SVG Line */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <path d="M0,100 C50,90 100,110 150,60 S250,80 300,40 S350,20 400,10" fill="none" stroke="#A855F7" strokeWidth="3" />
                            </svg>
                         </div>
                         <div className="flex justify-between mt-4 text-[10px] text-gray-400 uppercase tracking-widest px-2">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* TESTIMONIAL FOOTER */}
             <div className="mt-16 grid md:grid-cols-2 gap-6">
                 <div className="bg-[#FAF8F6] rounded-2xl p-8 border border-stone-100">
                     <p className="text-lg text-[#594A42] font-medium leading-relaxed mb-4">
                        "onlyCursor has transformed our ability to operationalize how we build GenAI consumer products. Incredible team, great product!"
                     </p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs overflow-hidden">
                           <img src="https://ui-avatars.com/api/?name=Karandeep+Anand&background=random" alt="KA" />
                        </div>
                        <div>
                           <div className="text-xs font-bold uppercase tracking-wider text-gray-900">Karandeep Anand</div>
                           <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CEO, Character</div>
                        </div>
                     </div>
                 </div>
                 <div className="bg-gradient-to-r from-stone-50 to-orange-50 rounded-2xl p-8 flex items-center justify-between group cursor-pointer border border-orange-100/50 hover:border-orange-200 transition-colors">
                     <div>
                        <h4 className="font-serif text-xl text-gray-800 mb-2">How onlyCursor helped Character identify growth levers</h4>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-orange-800">Read Their Story</span>
                     </div>
                     <ArrowRight className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                 </div>
             </div>
        </section>

        {/* NEWSLETTER SECTION */}
        <section className="bg-[#DBCFB0] rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
             {/* Background Texture */}
             <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
             
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                 <div className="max-w-xl">
                     <h2 className="font-serif text-5xl md:text-6xl text-[#4A3B32] leading-tight mb-8">
                        Opinionated <br/> Intelligence.
                     </h2>
                     <p className="text-lg text-[#5C4D44] mb-8 font-medium">
                        How do the most impactful teams use data for decisions? In the era of AI, speed to confident decisions matters more than ever. We curate insights on this and more in our newsletter.
                     </p>
                     <button className="bg-[#785848] text-[#FDF4F0] px-8 py-4 rounded-full font-medium hover:bg-[#5C4235] transition-colors flex items-center gap-3 group">
                        Subscribe and stay updated
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                 </div>
                 <div className="relative w-64 md:w-80 h-80">
                      <img 
                        src="https://images.unsplash.com/photo-1545939228-262141595186?q=80&w=600&auto=format&fit=crop" 
                        alt="Classical Statue" 
                        className="w-full h-full object-cover mix-blend-luminosity opacity-80 mask-image-gradient rounded-full"
                        style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
                        crossOrigin="anonymous" 
                      />
                 </div>
             </div>
        </section>

        {/* BLOG GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
                { title: "Only 100 Metrics Matter", time: "10 MIN READ", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop" },
                { title: "Death by 10000 Dashboards", time: "5 MIN READ", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" },
                { title: "The Future of Analytics — It's Automated", time: "5 MIN READ", img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=400&auto=format&fit=crop" },
                { title: "Why the Best Decisions Start with Opinions", time: "10 MIN READ", img: "https://images.unsplash.com/photo-1542202229-7d93776596e3?q=80&w=400&auto=format&fit=crop" }
            ].map((post, i) => (
                <div key={i} className="group cursor-pointer">
                    <div className="h-48 rounded-2xl overflow-hidden mb-4 relative">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                        <img src={post.img} alt={post.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" crossOrigin="anonymous"/>
                    </div>
                    <h3 className="font-medium text-lg text-sundial-dark leading-tight mb-2 group-hover:text-black">{post.title}</h3>
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">{post.time}</p>
                </div>
            ))}
        </section>

      </main>
      ) : (
        <Documentation />
      )}
      
      {/* FOOTER */}
      <footer className="bg-white rounded-t-[3rem] px-8 py-16 md:px-20 md:py-24 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
                 <div className="space-y-4">
                     <h5 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Product</h5>
                     <ul className="space-y-2 text-sm text-gray-600 font-medium">
                        <li className="hover:text-black cursor-pointer" onClick={() => setView('home')}>Features</li>
                        <li className="hover:text-black cursor-pointer">Pricing</li>
                        <li className="hover:text-black cursor-pointer" onClick={() => setView('docs')}>Docs</li>
                        <li className="hover:text-black cursor-pointer">Company</li>
                        <li className="hover:text-black cursor-pointer">Careers</li>
                     </ul>
                 </div>
                 <div className="space-y-4">
                     <h5 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Solutions</h5>
                     <ul className="space-y-2 text-sm text-gray-600 font-medium">
                        <li className="hover:text-black cursor-pointer">Product Leaders</li>
                        <li className="hover:text-black cursor-pointer">Data Leaders</li>
                        <li className="hover:text-black cursor-pointer">AI Consumer Companies</li>
                        <li className="hover:text-black cursor-pointer">AI B2B Companies</li>
                        <li className="hover:text-black cursor-pointer">Enterprise Companies</li>
                     </ul>
                 </div>
                 <div className="space-y-4">
                     <h5 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Case Studies</h5>
                     <ul className="space-y-2 text-sm text-gray-600 font-medium">
                        <li className="hover:text-black cursor-pointer">OpenAI</li>
                        <li className="hover:text-black cursor-pointer">Character</li>
                        <li className="hover:text-black cursor-pointer">Gamma</li>
                     </ul>
                 </div>
             </div>
             
             <div className="flex flex-col items-end justify-between">
                 <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold text-center leading-tight p-2 shadow-xl">
                    AICPA <br/> SOC
                 </div>
                 <div className="mt-12 text-right">
                    <div className="flex items-center gap-2 justify-end mb-4 text-sundial-dark">
                        <div className="w-6 h-6 rounded-full bg-sundial-dark text-white flex items-center justify-center font-serif italic text-sm">o</div>
                        <span className="font-serif text-2xl tracking-tight">onlyCursor</span>
                    </div>
                    <p className="text-[10px] text-gray-400">© 2025 onlyCursor. All Rights Reserved</p>
                    <div className="flex gap-4 justify-end mt-2 text-[10px] text-gray-400">
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Responsible Disclosure</span>
                    </div>
                 </div>
             </div>
         </div>
      </footer>
      
      <CursorControl 
        currentMode={cursorMode} 
        setMode={setCursorMode} 
        onAction={handleManualVisionTrigger}
        isProcessing={cursorState.isProcessing}
      />
    </div>
  );
};

export default App;