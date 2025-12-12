🔮 AI Cursor — Your Always-On Screen Intelligence Layer

We added superpowers to your cursor.
You can sleep — but your cursor won’t.

AI Cursor transforms your operating system’s pointer into a multimodal AI assistant that understands your screen, your voice, and your workflow.
This is not a UI trick. It’s a new interaction model for your entire computer.

✨ Features
🖼️ 1. VisionSnap Mode — The Extraction Engine

Capture anything on your screen and extract meaning instantly.

Drag-and-select regions

Click on images, graphs, UI elements

Extract text, numbers, tables, URLs

Auto-copy insights to clipboard

Powered by Gemini Vision

Perfect for students, researchers, developers, and anyone who deals with visual data.

✍️ 2. Clarify Mode — Real-Time Intelligence Layer

Hover over any text on your screen and the cursor understands it.

Summaries

Rewrites

Spell-fixes

Explanations

Tone adjustments

The cursor becomes an always-available editor and explainer, powered by Gemini Text.

🎙️ 3. Navigator Mode — Voice-Activated Copilot

Hold the spacebar and ask questions about anything you point at.

“Explain this graph.”

“What does this button do?”

“Rewrite this paragraph professionally.”

“Simplify this documentation.”

AI Cursor listens, interprets context, and responds via audio and text using Gemini Audio.

🎨 4. Dynamic Custom Cursors

Each mode has its own animated cursor:

Hover

Processing

Listening

Active

Error

Success

Feels futuristic and fluid — like a first-party Apple feature.

🧠 5. Multimodal AI Integration

The project uses three different Gemini capabilities:

Capability	Usage
Vision	Screen capture, OCR, region understanding
Text	Summaries, rewrites, instructions
Audio	Voice commands, conversational responses

Together, they allow the cursor to see, think, and respond.

🎨 6. Premium UI & Design

This project includes a fully responsive landing page featuring:

Glassmorphism

Micro-interactions

Beautiful typography (Instrument Serif + Inter)

Elegant animations

High-fidelity visuals

Built to feel as polished as an Apple or Raycast product.

🚀 Getting Started

Note: This is a system-level cursor engine.
It is not a browser component.
It interacts with the OS itself (overlay, hooks, AI models).

1. Clone the repo
git clone https://github.com/yourname/ai-cursor
cd ai-cursor

2. Install dependencies
pnpm install

3. Start the development system
pnpm dev

4. Build
pnpm build

🧩 Tech Stack
Core

System-level overlay engine

Custom cursor rendering pipeline

Chromium canvas/WebGL for animations

Global mouse hooks

Native OS integrations (Windows/macOS/Linux)

AI

Gemini Vision API

Gemini 2 Flash / Pro (Text)

Gemini Audio for speech queries

Frontend

React + Tailwind

Framer Motion

Next.js (for landing page)

Dev Tools

Vite / Turbo / PNPM

TypeScript

Electron (optional for overlay)

🔧 How It Works (Architecture Overview)
1. Capture Layer

Handles screen regions and screenshot → passes to Vision model.

2. Pointer Layer

A fully custom pointer engine that overrides the OS cursor visually.

3. Overlay Layer

A transparent system-wide overlay displaying animated cursors and AI responses.

4. AI Worker Layer

Handles:

Vision extraction

Summaries and rewrites

Voice queries

5. Mode Engine

Switches between:

VisionSnap

Clarify

Navigator

📌 Roadmap

Cross-platform installer

AI-powered gesture recognition

Auto-actions (e.g., click workflows)

On-device model support

Developer API for custom modes

Marketplace for custom cursor themes

🏆 Why This Project Matters

This project introduces a new interface paradigm:

Instead of opening an app to use AI,
you simply point at what you want —
the cursor understands and helps.

It brings AI into the most universal UX element of all:
the pointer.

📜 License

MIT License (or your preferred license)

💬 Contact / Feedback

For feedback or contributions, please open an issue or send a message.
