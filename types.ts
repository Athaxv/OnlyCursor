export enum CursorMode {
  DEFAULT = 'DEFAULT',
  VISION_SNAP = 'VISION_SNAP', // "Cursor Copier"
  CLARIFY = 'CLARIFY',         // "SuperAI"
  NAVIGATOR = 'NAVIGATOR'      // "DoctorCursor"
}

export interface CursorState {
  mode: CursorMode;
  isHovering: boolean;
  hoverTarget: string | null; // ID or content of what is being hovered
  isProcessing: boolean;
  isListening: boolean; // New state for voice input
  aiResponse: string | null;
}

export interface FeatureCardProps {
  title: string;
  description: string;
  image?: string;
  modeTrigger: CursorMode;
  isActive: boolean;
  onClick: () => void;
}