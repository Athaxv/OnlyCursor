import React from 'react';
import { Scan, Sparkles, Navigation, Command, MousePointer2 } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-16 text-center md:text-left">
        <h1 className="font-serif text-5xl md:text-6xl text-sundial-dark mb-6">Getting Started</h1>
        <p className="text-xl text-gray-600 font-light leading-relaxed max-w-2xl">
          Welcome to the Vantage AI Cursor Suite. This guide will help you master the three intelligent cursor modes designed to augment your workflow.
        </p>
      </div>

      <div className="space-y-12">
        {/* VisionSnap Section */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-sm transition-transform hover:scale-[1.01] duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
              <Scan size={24} />
            </div>
            <div>
                <h2 className="font-serif text-3xl text-gray-800 leading-none">VisionSnap Mode</h2>
                <span className="text-xs font-bold text-orange-600 tracking-widest uppercase opacity-70">Extraction Engine</span>
            </div>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg font-light border-l-2 border-orange-200 pl-4">
            VisionSnap allows you to instantly extract text and data from any part of your screen, including images, charts, and protected content.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#FFF8F6] p-6 rounded-2xl border border-orange-50/50">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MousePointer2 size={16} className="text-orange-500"/> Area Scan
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Click and drag to create a selection box around any content. The AI will analyze and extract text to your clipboard.
              </p>
            </div>
            <div className="bg-[#FFF8F6] p-6 rounded-2xl border border-orange-50/50">
              <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Command size={16} className="text-orange-500"/> Image Scan
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Click directly on any image element to extract its contents. Hold <span className="bg-white px-1.5 py-0.5 rounded border border-orange-200 text-xs font-bold text-orange-700">Shift</span> + Click to copy the image URL.
              </p>
            </div>
          </div>
        </section>

        {/* Clarify Section */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-sm transition-transform hover:scale-[1.01] duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <Sparkles size={24} />
            </div>
            <div>
                <h2 className="font-serif text-3xl text-gray-800 leading-none">Clarify Mode</h2>
                <span className="text-xs font-bold text-purple-600 tracking-widest uppercase opacity-70">Intelligence Layer</span>
            </div>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg font-light border-l-2 border-purple-200 pl-4">
            Clarify acts as your intelligent editor. It simplifies complex text and explains jargon instantly as you browse.
          </p>
          <div className="bg-[#FBF7FF] p-6 rounded-2xl border border-purple-50/50">
            <h3 className="font-bold text-purple-900 mb-2">How to use</h3>
            <p className="text-sm text-purple-800/80 leading-relaxed">
              Simply switch to Clarify mode and hover over any paragraph or heading. The AI will generate a concise summary or rewrite directly next to your cursor.
            </p>
          </div>
        </section>

        {/* Navigator Section */}
        <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-stone-100 shadow-sm transition-transform hover:scale-[1.01] duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Navigation size={24} />
            </div>
            <div>
                <h2 className="font-serif text-3xl text-gray-800 leading-none">Navigator Mode</h2>
                <span className="text-xs font-bold text-blue-600 tracking-widest uppercase opacity-70">Voice Copilot</span>
            </div>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg font-light border-l-2 border-blue-200 pl-4">
            Navigator is your voice-enabled copilot. Ask questions about what you see or get context on UI elements.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#F5F8FF] p-6 rounded-2xl border border-blue-50/50">
              <h3 className="font-bold text-gray-800 mb-2">Contextual Click</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Click on any element (buttons, menus, icons) to get an instant explanation of its function and intent based on the UI context.
              </p>
            </div>
            <div className="bg-[#F5F8FF] p-6 rounded-2xl border border-blue-50/50">
              <h3 className="font-bold text-gray-800 mb-2">Voice Commands</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hold <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-xs font-bold text-blue-700">Spacebar</span> while hovering over an element to ask a question via microphone. Release to send.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Documentation;