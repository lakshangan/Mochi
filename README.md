# Mochi Desktop Companion 🌟

A cross-platform desktop application featuring an animated glowing AI orb companion and personal productivity assistant. Built with **Electron**, **TypeScript**, **React**, **Vite**, and **Three.js**.

---

## 🔮 Visual Identity & Design Philosophy

Inspired by luminous digital companions, **Mochi** floats directly on your desktop with:
- **Translucent Glass Outer Shell**: Layered WebGL `MeshPhysicalMaterial` with realistic refraction, high transmission, clearcoat sheen, and subtle violet/cyan Fresnel edge illumination.
- **Glowing Core**: Deep navy/indigo surroundings illuminated by a pulsating inner light.
- **Expressive Eyes**: Procedural canvas matrix display with smooth interpolation across 13 distinct emotional states (`idle`, `blink`, `curious`, `happy`, `walking`, `sleeping`, `waking`, `thinking`, `working`, `reminding`, `celebrating`, `dragging`, `focused`).
- **Orbital Particles**: Floating ethereal light motes that orbit Mochi and burst upwards in celebration.
- **Zero Opaque Boundaries**: True frameless, transparent window rendering floating seamlessly over desktop backgrounds.
- **macOS-Native Aesthetics**: Features Apple-style vibrancy, background blur (backdrop-filter), native traffic light window controls, and segmented navigation bars.

---

## 🚀 Key Features

1. **Floating Animated Digital Pet**
   - True transparent, borderless window with smooth drag-and-drop movement.
   - Intelligent gaze tracking that looks toward your cursor.
   - Autonomic blinking, breathing, and bobbing animations.
   - Autonomous wandering within visible monitor work areas (configurable).
   - **Interactive Hover Greetings**: Hovering over Mochi displays an Apple-style floating speech bubble with personalized greetings and time-of-day tips.

2. **Personal Productivity Assistant**
   - Click Mochi anytime to reveal a compact, sleek glassmorphism dashboard with native macOS vibrancy.
   - Multi-tab organization using Apple-style segmented controls: Overview, Timers, Hydration & Breaks, Tasks, Notes, AI Chat, Settings.

3. **Countdown & Pomodoro Timers**
   - Precision timestamp-based clock (`targetEndTime`) resistant to system sleep and throttling.
   - Pomodoro cycle progression: Focus (25m), Short Break (5m), and Long Rest (15m) with automatic transitions and completed session counter.
   - Procedural Web Audio chimes (crystal bell and celebration fanfare) with zero external audio assets.
   - Crash & restart recovery: accurately recalculates remaining time after relaunching.

4. **Hydration & Mindful Break Reminders**
   - Configurable recurring intervals (e.g., water every 45m, breaks every 60m).
   - Duplicate-suppressed alert cards with Snooze, Mark Done, and Dismiss actions.
   - Native OS desktop notifications.
   - Visual triggers: Mochi enters the glowing `reminding` expression when alerts are due.

5. **Local Tasks & Quick Notes**
   - Quick task entry with priority badges (Low, Medium, High).
   - Filter by All, Pending, or Done; one-click completed clearance.
   - Color-coded scratchpad notes with instant local persistence.

6. **Natural-Language Command Parser**
   - Deterministic offline parsing for voice-style desktop commands:
     - `"Start a 25-minute timer"`
     - `"Remind me to drink water in 30 minutes"`
     - `"Add task to review pull request"`
     - `"Start Pomodoro focus session"`
     - `"Make Mochi happy"` or `"Go to sleep"`

7. **Power Control**
   - **Turn Off Buttons**: Readily accessible "Turn Off" buttons in the hover speech bubble, status pill, and assistant window title bar allow quick and easy shutdown of the companion.

8. **Optional Conversational AI Layer**
   - **Local Heuristic Mode (Default)**: 100% offline companion suggestions, jokes, productivity tips, and command shortcuts without needing an API key or internet connection.
   - **Provider Abstraction**: Optional pluggable OpenAI/Anthropic/custom API configuration stored locally and securely.

---

## 🧱 Architecture & Project Structure

```
mochi-desktop-companion/
├── src/
│   ├── main/                       # Electron Main Process (Node.js)
│   │   ├── main.ts                 # Main lifecycle, IPC handlers, auto-wander
│   │   ├── windows/
│   │   │   ├── pet-window.ts       # Transparent floating window
│   │   │   └── assistant-window.ts # Glass companion window
│   │   ├── services/
│   │   │   ├── timer-service.ts    # Target timestamp timer & Pomodoro engine
│   │   │   ├── reminder-service.ts # Water & break scheduler
│   │   │   ├── notification-service.ts # Cross-platform OS notifications
│   │   │   └── persistence-service.ts  # Atomic JSON persistence & recovery
│   │   └── platform/
│   │       └── platform-adapter.ts # macOS / Windows / Linux OS hooks
│   ├── preload/
│   │   └── index.ts                # Secure contextBridge API
│   ├── renderer/                   # React 19 + Three.js Frontend
│   │   ├── index.html              # Shell with Google Outfit typography
│   │   ├── App.tsx                 # Route coordinator (#pet vs #assistant)
│   │   ├── components/
│   │   │   ├── OrbPet.tsx          # 3D orb canvas & interaction container
│   │   │   ├── AssistantPanel.tsx  # Master dashboard
│   │   │   ├── TimerPanel.tsx      # Radial SVG countdown & Pomodoro
│   │   │   ├── ReminderPanel.tsx   # Water & break controls
│   │   │   ├── TaskPanel.tsx       # Priority task list
│   │   │   ├── NotesPanel.tsx      # Color-coded scratchpad
│   │   │   ├── AiChatPanel.tsx     # Conversational assistant & commands
│   │   │   └── SettingsPanel.tsx   # Preferences & size/opacity sliders
│   │   ├── graphics/
│   │   │   ├── orb-scene.ts        # Three.js glass sphere & lighting
│   │   │   ├── orb-materials.ts    # Dynamic Canvas face & eye morphing
│   │   │   ├── particle-system.ts  # Ethereal floating light motes
│   │   │   └── fallback-renderer.ts# 2D Canvas fallback if WebGL unavailable
│   │   ├── engine/
│   │   │   ├── animation-controller.ts # Priority-based state machine
│   │   │   ├── behavior-engine.ts      # Contextual reaction orchestrator
│   │   │   └── movement-controller.ts  # Coordinate dragging & gaze math
│   │   └── styles/
│   │       └── index.css           # Glassmorphism & neon design system
│   └── shared/
│       ├── types.ts                # Shared state & configuration types
│       ├── ipc-contracts.ts        # Type-safe IPC channels & bridge contract
│       ├── command-parser.ts       # Deterministic natural language parser
│       └── sound-effects.ts        # Procedural Web Audio synthesizer
├── tests/                          # Automated Vitest test suite
│   ├── command-parser.test.ts
│   ├── timer-and-persistence.test.ts
│   └── reminder-and-behavior.test.ts
├── vite.config.ts                  # Vite config for Renderer
├── vite.main.config.ts             # Vite library build for Main & Preload
├── vitest.config.ts                # Test runner configuration
├── package.json
└── tsconfig.json
```

---

## 🔒 Security Best Practices

- `contextIsolation: true` is strictly enforced.
- `nodeIntegration: false` in all renderer contexts.
- Preload script uses `contextBridge.exposeInMainWorld('mochiApi', ...)` exposing only typed, validated methods.
- No dynamic shell execution (`child_process.exec` is avoided).
- Local-first architecture: no analytics, no keystroke loggers, and user tasks/notes never leave your machine.

---

## 💻 Development & Execution

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Install Dependencies
```bash
npm install
```

### Run in Development
Runs the Vite HMR server and Electron concurrently:
```bash
npm run dev
```

### Run Automated Tests
Executes the Vitest test suite covering timers, restart recovery, reminder deduplication, and command parsing:
```bash
npm test
```

### Build Production Bundles
Compiles both the React renderer and the Electron main process:
```bash
npm run build
```

---

## 📦 Packaging & Distribution

Packaged using `electron-builder` with targets configured for all major desktop platforms:

```bash
# Package for current host OS:
npm run package

# Package specifically for macOS (DMG & ZIP, Apple Silicon / Intel):
npm run package:mac

# Package specifically for Windows (NSIS Installer & Portable EXE):
npm run package:win

# Package specifically for Linux (AppImage & DEB):
npm run package:linux
```

Output installers and packages are placed in the `release/` directory.

---

## ⚖️ Cross-Platform Behavior & Limitations

- **macOS**:
  - Full transparency and frameless rendering work out-of-the-box.
  - Floating level is set to `floating` with `setVisibleOnAllWorkspaces(true)` so Mochi stays visible when switching Spaces.
  - Native vibrancy and blur effects are utilized for a premium feel.
- **Windows**:
  - Transparent windows require DWM (Desktop Window Manager) compositing enabled (standard on Windows 10 and 11).
  - Background color is set to `#00000000` to prevent black border flashing.
- **Linux**:
  - Transparent windows require a running compositor (e.g., Picom, Mutter, KWin, Wayland).
  - On minimalist window managers lacking an alpha compositor, a transparent window will display with a black rectangular backdrop. In such environments, WebGL fallback mode is automatically enabled.
- **Offline Reliability**:
  - The entire application (3D orb, procedural sound synthesizer, timer engine, reminders, tasks, notes, command parser) functions completely offline without internet or cloud subscriptions.
