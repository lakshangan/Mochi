# Mochi Desktop Companion

A cross-platform desktop application featuring an ambient, animated companion orb and personal focus assistant. Built with Electron, TypeScript, React 19, Three.js, and Vite.

---

## Overview

Mochi is an ambient desktop companion engineered for modern developer workflows. Floating directly on your desktop within a transparent, frameless canvas, Mochi combines hardware aesthetics with active desktop awareness to deliver a subtle, delightful, and non-intrusive focus companion.

The application operates with a **strict local-first, zero-telemetry philosophy**: core features—including animated facial states, activity tracking, countdown timers, Pomodoro cycles, hydration/break alerts, task management, quick notes, and command parsing—function 100% offline without external cloud dependencies.

---

## System Architecture

Mochi uses an enterprise-grade multi-process Electron architecture adhering strictly to Chromium security best practices. The separation of concerns ensures crash resilience, memory safety, and complete isolation of untrusted renderer contexts.

```
+-----------------------------------------------------------------------------------+
|                            ELECTRON MAIN PROCESS (Node.js)                         |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  |    Pet Window       |   |   Assistant Window  |   |   System Activity       |  |
|  | (Frameless Floating)|   |  (Glass Dashboard)  |   |  - IOHID / powerMonitor |  |
|  +----------+----------+   +----------+----------+   |  - Foreground App Cache |  |
|             |                         |              +------------+------------+  |
|             |                         |                           |               |
|             +------------+------------+                           |               |
|                          |                                        |               |
|                          v                                        v               |
|             +-------------------------------------------------------------+       |
|             |                       IPC ROUTER & BUS                      |       |
|             +-------------------------------------------------------------+       |
|               |                 |                 |                     |         |
|               v                 v                 v                     v         |
|      +----------------+ +----------------+ +----------------+ +----------------+  |
|      |  Timer Service | |Reminder Service| |Persistence Svc | |AI IPC Proxy Svc|  |
|      | - Target Clock | | - Care Scheduler| - Atomic Rename  | | - safeStorage  |  |
|      | - State Memory | | - OS Dispatch  | | - 400ms Debounce| | - Zero Key Leak|  |
|      | - Sleep Restore| | - Deduplication| | - Multi-Win Sync| | - HTTPS Proxy  |  |
|      +----------------+ +----------------+ +----------------+ +----------------+  |
+-----------------------------------------------------------------------------------+
                                       |
                   contextBridge IPC (Typed Contract)
                   contextIsolation: true | nodeIntegration: false
                                       |
+-----------------------------------------------------------------------------------+
|                             REACT 19 RENDERER (Vite)                              |
|                                                                                   |
|  +-------------------------------------+   +------------------------------------+ |
|  |           Pet Window View           |   |       Assistant Dashboard View     | |
|  | - WebGL / Canvas Micro-LED Matrix   |   | - Dynamic Island HUD               | |
|  | - Procedural Particle Orb Shader    |   | - Pomodoro / Countdown Radial Timers| |
|  | - Autonomous Screen Wandering       |   | - Priority Task Manager            | |
|  | - Desktop Gaze Tracking Coordinates |   | - Scratchpad Color Notes           | |
|  | - Procedural WebAudio Chirp Synths  |   | - Deterministic NL Command Parser  | |
|  +-------------------------------------+   +------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 1. Main Process (`src/main/`)
- **Lifecycle & Window Orchestration (`main.ts`)**: Manages application boot, single-instance locks, window creation, display boundary metrics, and inter-window state broadcasting.
- **Window Management (`src/main/windows/`)**:
  - `pet-window.ts`: Borderless, transparent, click-through-capable window hosting the companion orb.
  - `assistant-window.ts`: Glassmorphic productivity panel with full macOS/Windows titlebar integration.
- **Background Core Services (`src/main/services/`)**:
  - `system-activity.ts`: Polls OS-level input idle time, cursor motion vectors, and frontmost application name across macOS, Windows, and Linux.
  - `timer-service.ts`: Drift-free timestamp-based timer engine that survives machine sleep and background throttling.
  - `reminder-service.ts`: Interval tracker for hydration and mindful breaks with deduplication buffers.
  - `notification-service.ts`: Native OS desktop notification dispatcher with graceful CLI fallbacks.
  - `persistence-service.ts`: Crash-safe atomic local storage engine with debounced I/O and multi-window reconciliation.
  - `tray-service.ts`: Native macOS Status Bar (Menu Bar) tray manager with template icon support, Deep Work Mode controls, quick focus sprints, and companion visibility toggles.

### 2. Preload Security Layer (`src/preload/index.ts`)
- Configured with `contextIsolation: true` and `nodeIntegration: false`.
- Exposes a strictly typed `window.mochiApi` bridge implementing `ElectronMochiAPI`.
- Prevents raw Node.js primitives or filesystem APIs from leaking into the renderer runtime.

### 3. Renderer Process (`src/renderer/`)
- Built on **React 19**, **Three.js**, and **Vite**.
- **State Store (`hooks/useMochiStore.ts`)**: Unified local reactive store synchronized with the Electron main process via bidirectional IPC broadcasts.
- **Components**:
  - `GlowLavaOrb.tsx`: Micro-LED canvas renderer and facial expression matrix.
  - `OrbPet.tsx`: Floating mascot shell with Dynamic Island speech capsule.
  - `TimerPanel.tsx`: Radial countdown and Pomodoro workflow coordinator.
  - `ReminderPanel.tsx`: Hydration and ergonomic break configuration.
  - `TaskPanel.tsx` & `NotesPanel.tsx`: Offline task and scratchpad managers.
  - `AiChatPanel.tsx`: Natural language command center with real-time privacy status indicators.
  - `SettingsPanel.tsx`: Mascot scale, opacity, audio volumes, and transparent privacy toggles.

---

## Detailed Privacy Architecture & Technical Guarantees

Mochi is designed from first principles to be **transparent, local-first, and private**.

```
+-----------------------------------------------------------------------+
|                         PRIVACY GUARANTEE MATRIX                      |
+------------------------------+--------------------+-------------------+
| Feature                      | Default Mode       | Optional AI Mode  |
+------------------------------+--------------------+-------------------+
| Companion Animations         | 100% On-Device     | 100% On-Device    |
| Activity & Typing Detection  | Local OS Metadata  | Local OS Metadata |
| Timers & Reminders           | 100% On-Device     | 100% On-Device    |
| Tasks & Notes Storage        | Local JSON (Disk)  | Local JSON (Disk) |
| Natural Language Commands    | Offline Parser     | Offline Parser    |
| Conversational Chat Queries  | Offline Heuristic  | OpenAI Endpoint   |
| API Key Disk Storage         | Not Applicable     | OS safeStorage    |
| Telemetry & Tracking         | Zero Bytes Sent    | Zero Bytes Sent   |
+------------------------------+--------------------+-------------------+
```

### 1. Zero Keystroke Logging
- **How Activity is Detected**: Mochi **never** records, logs, intercepts, or inspects keypresses or keystroke characters.
- Typing flow is inferred exclusively through low-level OS idle deltas (`IOHIDSystem` / `powerMonitor`) combined with mouse cursor displacement.
- Keyboard typing is categorized purely as:
  $$\text{IsTyping} = (\text{SystemIdleTime} < \text{Threshold}) \land (\Delta\text{Cursor} = 0) \land \text{IsEligibleContext}$$
- Keystroke buffers, text content, and clipboard data are never accessed.

### 2. OS-Native Credential Encryption (`safeStorage`)
- Core Mochi features require **no external API keys** and operate fully offline.
- When an optional external LLM provider (such as OpenAI) is configured:
  - The API key is **never written in plaintext** to `mochi-companion-data.json`.
  - Keys are encrypted before disk serialization using Electron's native `safeStorage` API:
    - **macOS**: Encrypted with Apple Keychain.
    - **Windows**: Encrypted with Windows DPAPI (Data Protection API).
    - **Linux**: Encrypted with Secret Service / libsecret.
  - When persisting settings, the plaintext key is stripped from memory structures before JSON write:
    ```ts
    // On-disk JSON representation:
    {
      "settings": {
        "ai": {
          "provider": "openai",
          "encryptedApiKey": "AQAAANCMnd8BFdERjHoAwE/Cl+sBAAAA...",
          "model": "gpt-4o-mini"
        }
      }
    }
    ```

### 3. IPC Network Isolation
- The React renderer **never makes direct outbound network requests** with API keys.
- AI requests are routed over IPC (`IPC_CHANNELS.AI_QUERY`) to the Electron main process.
- The decrypted API key resides solely within the Node.js main process memory and is never transmitted into the renderer world, eliminating exposure via developer tools or cross-context script access.

### 4. UI Transparency & Mode Indicators
- Every interaction in Mochi discloses its privacy posture:
  - In Chat: A persistent banner displays **"🔒 100% Offline Local Engine (Strictly on-device, zero data transmitted)"** by default.
  - When OpenAI is enabled: Displays **"☁️ External LLM Active (Prompts processed via configured OpenAI endpoint)"**, ensuring users are never misled about off-device communication.

---

## Technical Deep Dives

### 1. Reliable Natural Language Command Execution
The deterministic command parser (`src/shared/command-parser.ts`) extracts intent without cloud latency. Commands directly mutate application state rather than merely displaying confirmation text:

- **Immediate Execution**: Typing `"Start Pomodoro focus session"` immediately begins the 25-minute Pomodoro cycle in the timer service and updates the HUD.
- **Hydration & Breaks**: Typing `"Remind me to drink water in 30 minutes"` updates `waterReminders.intervalMinutes` and sets `enabled: true` in settings in real time.
- **Timer Controls**: `"Pause timer"`, `"Resume timer"`, and `"Reset timer"` directly control the clock engine.
- **Tasks & Notes**: `"Add task: ..."` and `"Add note: ..."` immediately append records to local storage.
- **Word-Boundary Matchers**: Keyword matches use word-boundary regular expressions (e.g., `/\b(hi|hello|hey)\b/i`), preventing substrings like `"this"` or `"which"` from falsely triggering greetings.

### 2. True Atomic Persistence & Concurrency
Local storage (`src/main/services/persistence-service.ts`) is designed for maximum reliability:

- **Atomic Writes**: Writes are saved to a temporary file (`.mochi-data.<timestamp>.tmp`) on the same volume and committed using `fs.renameSync`. This guarantees atomic POSIX/NTFS directory replacement, preventing zero-byte truncation or corrupted JSON if the app is abruptly closed.
- **Debounced Window Moves**: On-screen dragging emits rapid coordinate updates. Position is updated in memory immediately and debounced to disk (400ms delay), eliminating disk I/O thrashing during window movement.
- **Multi-Window Sync**: Concurrently opened windows reconcile tasks and notes by record IDs and timestamps (`createdAt`, `updatedAt`), preventing last-writer-wins clobbering.

### 3. Robust Cross-Platform System Activity Monitoring
`SystemActivityMonitor` (`src/main/services/system-activity.ts`) supports macOS, Windows, and Linux:

- **Idle Time Detection**:
  - **macOS**: `ioreg -c IOHIDSystem` returns nanosecond-accurate hardware idle time.
  - **Linux**: Queries `xprintidle` with automatic fallback to `electron.powerMonitor.getSystemIdleTime()`.
  - **Windows**: `electron.powerMonitor.getSystemIdleTime()` queries native `GetLastInputInfo`.
- **Frontmost App Classification**:
  - **macOS**: `lsappinfo` / `osascript`.
  - **Windows**: PowerShell user32 `GetForegroundWindow` / process resolution cached every 1200ms to preserve low CPU overhead.
  - **Linux**: `xdotool` / `xprop` `WM_CLASS` lookup.
- **Audio Output Detection**:
  - **macOS**: `pmset -g assertions` monitors `coreaudiod` sleep assertions.
  - **Linux**: PulseAudio / PipeWire `pactl list sink-inputs` checks for active audio streams.

---

## Project Structure

```
mochi-desktop-companion/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Cross-platform GitHub Actions build matrix
├── build/
│   └── entitlements.mac.plist      # macOS hardened runtime entitlements
├── src/
│   ├── main/                       # Electron Main Process (Node.js)
│   │   ├── main.ts                 # App bootstrap, window manager & IPC router
│   │   ├── windows/
│   │   │   ├── pet-window.ts       # Transparent floating mascot window
│   │   │   └── assistant-window.ts # Glass companion dashboard window
│   │   ├── services/
│   │   │   ├── system-activity.ts  # Cross-platform desktop activity monitor
│   │   │   ├── timer-service.ts    # Target timestamp timer & Pomodoro engine
│   │   │   ├── reminder-service.ts # Hydration & break interval scheduler
│   │   │   ├── notification-service.ts # OS desktop notification dispatcher
│   │   │   └── persistence-service.ts  # Atomic local storage engine
│   │   └── platform/
│   │       └── platform-adapter.ts # Platform-specific window & startup hooks
│   ├── preload/
│   │   └── index.ts                # Context-isolated IPC contract bridge
│   ├── renderer/                   # React 19 Frontend
│   │   ├── index.html              # Shell markup
│   │   ├── App.tsx                 # Route coordinator (#pet vs #assistant)
│   │   ├── components/
│   │   │   ├── GlowLavaOrb.tsx     # Micro-LED canvas renderer & expression matrix
│   │   │   ├── OrbPet.tsx          # Dynamic Island HUD & window coordinator
│   │   │   ├── AssistantPanel.tsx  # Master productivity panel
│   │   │   ├── TimerPanel.tsx      # Radial countdown & Pomodoro interface
│   │   │   ├── ReminderPanel.tsx   # Health interval configuration
│   │   │   ├── TaskPanel.tsx       # Priority task list
│   │   │   ├── NotesPanel.tsx      # Quick scratchpad notes
│   │   │   ├── AiChatPanel.tsx     # Chat interface & privacy banner
│   │   │   └── SettingsPanel.tsx   # Mascot size, opacity, and preferences
│   │   ├── hooks/
│   │   │   └── useMochiStore.ts    # Reactive state store & IPC event bindings
│   │   ├── services/
│   │   │   └── ai-service.ts       # Command dispatcher & offline heuristic engine
│   │   └── styles/
│   │       ├── glow-lava-orb.css   # OLED hardware glass styles & keyframes
│   │       └── index.css           # Glassmorphism design system
│   └── shared/
│       ├── types.ts                # TypeScript domain models and settings
│       ├── ipc-contracts.ts        # Type-safe IPC channels and payloads
│       ├── command-parser.ts       # Natural language command parsing
│       └── sound-effects.ts        # Procedural Web Audio synthesizer
├── tests/                          # Automated Vitest test suite
│   ├── command-parser.test.ts      # Command grammar & execution tests
│   ├── system-activity.test.ts     # App categorization tests
│   ├── timer-and-persistence.test.ts # Timer recovery & atomic persistence tests
│   └── reminder-and-behavior.test.ts # Reminders & deduplication tests
├── LICENSE                         # MIT License
├── package.json                    # Dependencies, scripts & electron-builder config
├── tsconfig.json                   # TypeScript compiler configuration
├── vite.config.ts                  # Vite renderer bundler configuration
└── vite.main.config.ts             # Vite main & preload bundler configuration
```

---

## Getting Started

### Prerequisites
- Node.js v18.0.0 or later (v20+ LTS recommended)
- npm v9.0.0 or later

### Installation
```bash
git clone https://github.com/lakshangan/Mochi.git
cd Mochi
npm install
```

### Development
Runs the Vite renderer server and Electron main process concurrently:
```bash
npm run dev
```

### Running Tests
Executes the automated test suite covering command parsing, activity monitoring, timers, persistence, and safe storage:
```bash
npm test
```

### Building for Production
Compiles the React renderer bundle and Electron main/preload processes:
```bash
npm run build
```

---

## Packaging & Releases

Mochi uses `electron-builder` with production configurations for code signing, hardened runtime, and auto-updating:

```bash
# Package for your current operating system:
npm run package

# macOS (DMG & ZIP with Hardened Runtime):
npm run package:mac

# Windows (NSIS Installer & Portable EXE):
npm run package:win

# Linux (AppImage & DEB package):
npm run package:linux
```

All compiled binaries are generated inside the `release/` directory.

---

## Continuous Integration (CI)

Every commit and pull request is validated across a 3-platform matrix using GitHub Actions (`.github/workflows/ci.yml`):
- **Ubuntu Latest** (Linux)
- **macOS Latest** (Apple Silicon / Darwin)
- **Windows Latest** (win32)

Steps include dependency validation, automated unit testing, TypeScript compilation, and production bundle assembly.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
