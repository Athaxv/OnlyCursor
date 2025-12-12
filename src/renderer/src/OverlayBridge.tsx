import React, { useEffect, useState } from 'react';
import { ipcRenderer } from 'electron';

// This component wraps your existing App.tsx
// It feeds the Native Hook coordinates into the React state

export const OverlayBridge = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (_event, pos) => {
        // Direct state update for overlay rendering
        setMousePos(pos);
        
        // Dispatch a synthetic event so your existing hooks (useMousePosition) work
        // without rewriting your entire App logic
        const syntheticEvent = new MouseEvent('mousemove', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: pos.x,
            clientY: pos.y,
            screenX: pos.x,
            screenY: pos.y
        });
        window.dispatchEvent(syntheticEvent);
    };

    ipcRenderer.on('mouse-move', handleMove);

    return () => {
      ipcRenderer.removeListener('mouse-move', handleMove);
    };
  }, []);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      pointerEvents: 'none' // Ensure React doesn't block pass-through
    }}>
      {/* Pass mousePos down if needed, or rely on window dispatch */}
      {children}
    </div>
  );
};