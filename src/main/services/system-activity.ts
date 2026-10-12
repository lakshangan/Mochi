import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemActivityEvent, AppActivityCategory, PetAnimationState } from '../../shared/types';

const execAsync = promisify(exec);

let electronScreen: typeof import('electron').screen | null = null;
let electronPowerMonitor: typeof import('electron').powerMonitor | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require('electron');
  electronScreen = electron.screen;
  electronPowerMonitor = electron.powerMonitor;
} catch {
  // Safe in non-electron test environments
}

export interface AppClassification {
  formattedName: string;
  category: AppActivityCategory;
  state: PetAnimationState;
  title: string;
  subtitles: string[];
}

const DEV_SUBTITLES = [
  'Crafting clean code.',
  'Zero bugs found.',
  '10x dev mode.',
  'Terminal trembles.',
  'Turning caffeine to code.',
  'Push fearlessly.',
  'Pure flow state.',
];

const TYPING_SUBTITLES = [
  'Fingers flying!',
  'Fast hands!',
  'Keyboard on fire!',
  'Crushing syntax.',
  'Writing magic.',
  'In the zone.',
  'Flow state locked in.',
];

const APP_DATABASE: Record<string, AppClassification> = {
  // Development - Core Editors
  code: {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  'visual studio code': {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  vscode: {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  antigravity: {
    formattedName: 'Antigravity IDE',
    category: 'development',
    state: 'coding',
    title: 'Antigravity Workspace',
    subtitles: DEV_SUBTITLES,
  },
  'antigravity ide': {
    formattedName: 'Antigravity IDE',
    category: 'development',
    state: 'coding',
    title: 'Antigravity Workspace',
    subtitles: DEV_SUBTITLES,
  },
  vscodium: {
    formattedName: 'VSCodium',
    category: 'development',
    state: 'coding',
    title: 'Code Editor',
    subtitles: DEV_SUBTITLES,
  },
  cursor: {
    formattedName: 'Cursor AI',
    category: 'development',
    state: 'coding',
    title: 'Cursor AI Workspace',
    subtitles: [
      'AI-assisted coding session in progress!',
      'Writing software with AI precision.',
      'Prompting & coding in Cursor.',
    ],
  },
  zed: {
    formattedName: 'Zed Editor',
    category: 'development',
    state: 'coding',
    title: 'Zed High-Performance Code',
    subtitles: ['Lightning-fast coding in Zed.', 'High-performance editor active.'],
  },
  'sublime text': {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.', 'Blazing fast text editing.'],
  },
  sublime_text: {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.', 'Blazing fast text editing.'],
  },
  subl: {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.'],
  },
  xcode: {
    formattedName: 'Xcode',
    category: 'development',
    state: 'coding',
    title: 'Apple Development',
    subtitles: [
      'Building for Apple platforms in Xcode.',
      'Compiling Swift & SwiftUI magic.',
      'Shipping iOS & macOS features.',
    ],
  },

  // Terminals & Shells
  terminal: {
    formattedName: 'Terminal',
    category: 'development',
    state: 'coding',
    title: 'CLI Console',
    subtitles: ['Running shell commands & scripts.', 'Terminal power user at work.'],
  },
  iterm: {
    formattedName: 'iTerm2',
    category: 'development',
    state: 'coding',
    title: 'iTerm2 Console',
    subtitles: ['Running shell commands & builds.', 'Hacking in the terminal.'],
  },
  warp: {
    formattedName: 'Warp',
    category: 'development',
    state: 'coding',
    title: 'Warp Terminal',
    subtitles: ['Modern CLI session active.', 'Running AI commands smoothly.'],
  },
  ghostty: {
    formattedName: 'Ghostty',
    category: 'development',
    state: 'coding',
    title: 'Ghostty Terminal',
    subtitles: ['Fast GPU terminal in action.', 'Compiling & running commands.'],
  },
  kitty: {
    formattedName: 'Kitty',
    category: 'development',
    state: 'coding',
    title: 'Kitty Terminal',
    subtitles: ['Fast terminal rendering active.', 'CLI development flow.'],
  },
  alacritty: {
    formattedName: 'Alacritty',
    category: 'development',
    state: 'coding',
    title: 'Alacritty Terminal',
    subtitles: ['GPU-accelerated terminal.', 'Terminal flow state.'],
  },
  wezterm: {
    formattedName: 'WezTerm',
    category: 'development',
    state: 'coding',
    title: 'WezTerm Terminal',
    subtitles: ['Multiplexed terminal session.', 'CLI productivity.'],
  },

  // JetBrains IDEs
  webstorm: {
    formattedName: 'WebStorm',
    category: 'development',
    state: 'coding',
    title: 'WebStorm IDE',
    subtitles: ['Crafting web applications.', 'Full-stack development flow.'],
  },
  intellij: {
    formattedName: 'IntelliJ IDEA',
    category: 'development',
    state: 'coding',
    title: 'IntelliJ IDE',
    subtitles: ['Heavyweight engineering session.', 'Deep in backend code.'],
  },
  pycharm: {
    formattedName: 'PyCharm',
    category: 'development',
    state: 'coding',
    title: 'PyCharm IDE',
    subtitles: ['Writing Python solutions.', 'Data & Python development.'],
  },
  clion: {
    formattedName: 'CLion',
    category: 'development',
    state: 'coding',
    title: 'CLion C/C++ Studio',
    subtitles: ['System-level C++ engineering.', 'Optimizing performance.'],
  },
  goland: {
    formattedName: 'GoLand',
    category: 'development',
    state: 'coding',
    title: 'GoLand Studio',
    subtitles: ['Building concurrent Go services.', 'Writing idiomatic Go.'],
  },
  rider: {
    formattedName: 'JetBrains Rider',
    category: 'development',
    state: 'coding',
    title: 'Rider .NET Studio',
    subtitles: ['C# and game development.', 'Engineering with Rider.'],
  },
  'android studio': {
    formattedName: 'Android Studio',
    category: 'development',
    state: 'coding',
    title: 'Android Studio',
    subtitles: ['Building Android apps & Kotlin.', 'Mobile engineering flow.'],
  },

  // Console Editors
  neovim: {
    formattedName: 'Neovim',
    category: 'development',
    state: 'coding',
    title: 'Neovim Modal Flow',
    subtitles: ['Vim motions at lightspeed!', 'Modal editing mastery.'],
  },
  nvim: {
    formattedName: 'Neovim',
    category: 'development',
    state: 'coding',
    title: 'Neovim Modal Flow',
    subtitles: ['Vim motions at lightspeed!', 'Modal editing mastery.'],
  },
  vim: {
    formattedName: 'Vim',
    category: 'development',
    state: 'coding',
    title: 'Vim Editor',
    subtitles: ['Modal keyboard editing.', 'Quick terminal edits.'],
  },
  emacs: {
    formattedName: 'Emacs',
    category: 'development',
    state: 'coding',
    title: 'GNU Emacs',
    subtitles: ['The extensible editor.', 'Hacking in lisp & text.'],
  },

  // Dev Tools & DBs
  postman: {
    formattedName: 'Postman',
    category: 'development',
    state: 'focused',
    title: 'API Testing',
    subtitles: ['Testing endpoints & payloads.', 'Refining REST/GraphQL APIs.'],
  },
  insomnia: {
    formattedName: 'Insomnia',
    category: 'development',
    state: 'focused',
    title: 'API Client',
    subtitles: ['Debugging HTTP requests.', 'Testing API schemas.'],
  },
  tableplus: {
    formattedName: 'TablePlus',
    category: 'development',
    state: 'focused',
    title: 'Database Management',
    subtitles: ['Querying database records.', 'Optimizing SQL queries.'],
  },
  dbeaver: {
    formattedName: 'DBeaver',
    category: 'development',
    state: 'focused',
    title: 'Database Studio',
    subtitles: ['Exploring data schemas.', 'Running SQL scripts.'],
  },
  docker: {
    formattedName: 'Docker',
    category: 'development',
    state: 'focused',
    title: 'Docker Containers',
    subtitles: ['Managing container clusters.', 'Orchestrating microservices.'],
  },
  github: {
    formattedName: 'GitHub',
    category: 'development',
    state: 'focused',
    title: 'Version Control',
    subtitles: ['Reviewing commits and PRs.', 'Shipping code updates.'],
  },

  // Design
  figma: {
    formattedName: 'Figma',
    category: 'design',
    state: 'curious',
    title: 'Figma Design',
    subtitles: ['Designing interfaces & components.', 'Crafting sleek UI & UX magic.'],
  },
  sketch: {
    formattedName: 'Sketch',
    category: 'design',
    state: 'curious',
    title: 'Sketch Vector Studio',
    subtitles: ['Vector design in progress.', 'Refining typography & icons.'],
  },
  photoshop: {
    formattedName: 'Adobe Photoshop',
    category: 'design',
    state: 'curious',
    title: 'Photoshop Studio',
    subtitles: ['Retouching & creating visuals.', 'Art in the making.'],
  },
  illustrator: {
    formattedName: 'Adobe Illustrator',
    category: 'design',
    state: 'curious',
    title: 'Illustrator Studio',
    subtitles: ['Vector artwork & typography.', 'Precision vector craft.'],
  },
  blender: {
    formattedName: 'Blender 3D',
    category: 'design',
    state: 'curious',
    title: 'Blender 3D Studio',
    subtitles: ['Modeling & rendering 3D scenes.', '3D creation in flow.'],
  },
  canva: {
    formattedName: 'Canva',
    category: 'design',
    state: 'curious',
    title: 'Canva Design',
    subtitles: ['Creating graphic assets.', 'Visual layout design.'],
  },

  // Browsers
  'google chrome': {
    formattedName: 'Google Chrome',
    category: 'browser',
    state: 'thinking',
    title: 'Web Research',
    subtitles: ['Exploring docs & web resources.', 'Researching solutions online.'],
  },
  chrome: {
    formattedName: 'Chrome',
    category: 'browser',
    state: 'thinking',
    title: 'Web Research',
    subtitles: ['Browsing documentation.', 'Researching online.'],
  },
  arc: {
    formattedName: 'Arc Browser',
    category: 'browser',
    state: 'thinking',
    title: 'Arc Web Space',
    subtitles: ['Browsing thoughtfully with Arc.', 'Researching in your spaces.'],
  },
  safari: {
    formattedName: 'Safari',
    category: 'browser',
    state: 'thinking',
    title: 'Safari Research',
    subtitles: ['Apple Safari browsing.', 'Reading documentation & articles.'],
  },
  firefox: {
    formattedName: 'Firefox',
    category: 'browser',
    state: 'thinking',
    title: 'Firefox Browser',
    subtitles: ['Browsing with Firefox.', 'Testing web standards.'],
  },
  brave: {
    formattedName: 'Brave',
    category: 'browser',
    state: 'thinking',
    title: 'Brave Browser',
    subtitles: ['Privacy browsing with Brave.', 'Searching solutions.'],
  },
  edge: {
    formattedName: 'Microsoft Edge',
    category: 'browser',
    state: 'thinking',
    title: 'Edge Browser',
    subtitles: ['Browsing with Microsoft Edge.', 'Exploring documentation.'],
  },

  // Communication
  slack: {
    formattedName: 'Slack',
    category: 'communication',
    state: 'happy',
    title: 'Slack Workspace',
    subtitles: ['Syncing with team channels.', 'Quick check-in with colleagues.'],
  },
  discord: {
    formattedName: 'Discord',
    category: 'communication',
    state: 'happy',
    title: 'Discord Community',
    subtitles: ['Catching up with community chats.', 'Hanging out on Discord.'],
  },
  teams: {
    formattedName: 'Microsoft Teams',
    category: 'communication',
    state: 'happy',
    title: 'Teams Meeting & Chat',
    subtitles: ['Collaborating with team members.', 'Checking meetings and chats.'],
  },
  messages: {
    formattedName: 'iMessage',
    category: 'communication',
    state: 'happy',
    title: 'iMessage',
    subtitles: ['Chatting with friends & contacts.'],
  },

  // Productivity
  notion: {
    formattedName: 'Notion',
    category: 'productivity',
    state: 'focused',
    title: 'Notion Workspace',
    subtitles: ['Organizing thoughts & project docs.', 'Structuring knowledge base.'],
  },
  obsidian: {
    formattedName: 'Obsidian',
    category: 'productivity',
    state: 'focused',
    title: 'Obsidian Vault',
    subtitles: ['Connecting ideas & second brain.', 'Deep note-taking session.'],
  },
  linear: {
    formattedName: 'Linear',
    category: 'productivity',
    state: 'focused',
    title: 'Linear Issue Tracking',
    subtitles: ['Tracking sprint cycles and issues.', 'Planning the next release.'],
  },
  notes: {
    formattedName: 'Notes',
    category: 'productivity',
    state: 'focused',
    title: 'Quick Notes',
    subtitles: ['Jotting down quick ideas.', 'Writing thoughts.'],
  },

  // Entertainment / Audio
  spotify: {
    formattedName: 'Spotify',
    category: 'entertainment',
    state: 'listening',
    title: 'Spotify Audio',
    subtitles: ['Vibing to tunes.', 'Focus beats powering your flow.'],
  },
  music: {
    formattedName: 'Apple Music',
    category: 'entertainment',
    state: 'listening',
    title: 'Music Session',
    subtitles: ['Jamming to Apple Music.', 'Great soundtrack for productivity!'],
  },
};

export function classifyApplication(rawAppName: string): AppClassification {
  const normalized = rawAppName.trim().toLowerCase();

  for (const [key, config] of Object.entries(APP_DATABASE)) {
    if (normalized.includes(key)) {
      return config;
    }
  }

  // Format capitalized fallback
  const cleanName = rawAppName.replace(/[^\w\s-]/g, '').trim() || 'System';
  const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    formattedName: formatted,
    category: 'productivity',
    state: 'idle',
    title: `${formatted} Active`,
    subtitles: [`Working in ${formatted}.`],
  };
}

export class SystemActivityMonitor {
  private timeoutId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastAppName = '';
  private lastState: PetAnimationState = 'idle';
  private lastSubtitle = '';
  private lastInputActiveTime = 0;
  private typingStreak = 0;
  private lastBubbleEmitTime = 0;
  private lastCursorPos = { x: 0, y: 0 };
  private cachedRawApp = '';
  private lastAppCheckTime = 0;
  private onActivityChange: (event: SystemActivityEvent) => void;

  constructor(onActivityChange: (event: SystemActivityEvent) => void) {
    this.onActivityChange = onActivityChange;
  }

  public start() {
    this.stop();
    this.isRunning = true;
    this.scheduleNextCheck(100);
  }

  public stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleNextCheck(delayMs: number) {
    if (!this.isRunning) return;
    this.timeoutId = setTimeout(async () => {
      const nextDelay = await this.checkActivityLoop();
      this.scheduleNextCheck(nextDelay);
    }, delayMs);
  }

  private async checkActivityLoop(): Promise<number> {
    try {
      const event = await this.checkActivity();
      // Adaptive polling rate:
      // If actively typing, check rapidly (450ms) for instant responsiveness.
      // If idle, slow down to 1500ms or 2500ms to conserve resources.
      if (event?.isTyping || event?.state === 'typing') {
        return 450;
      }
      if (this.lastState === 'sleeping') {
        return 2500;
      }
      if (this.lastState === 'idle') {
        return 1600;
      }
      return 650;
    } catch {
      return 1000;
    }
  }

  public async checkActivity(): Promise<SystemActivityEvent | null> {
    try {
      const now = Date.now();

      // 1. Cross-platform user idle time detection
      let idleSeconds = 0;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(
            `ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF; exit}'`
          );
          const idleNanos = parseInt(stdout.trim(), 10);
          if (!isNaN(idleNanos)) {
            idleSeconds = idleNanos / 1_000_000_000;
          }
        } catch {
          if (electronPowerMonitor) {
            idleSeconds = electronPowerMonitor.getSystemIdleTime();
          }
        }
      } else if (process.platform === 'linux') {
        try {
          const { stdout } = await execAsync('xprintidle');
          const idleMs = parseInt(stdout.trim(), 10);
          if (!isNaN(idleMs)) {
            idleSeconds = idleMs / 1000;
          }
        } catch {
          if (electronPowerMonitor) {
            idleSeconds = electronPowerMonitor.getSystemIdleTime();
          }
        }
      } else {
        // Windows and general fallback
        if (electronPowerMonitor) {
          idleSeconds = electronPowerMonitor.getSystemIdleTime();
        }
      }

      // 2. Cross-platform frontmost application detection (throttled to 1200ms to minimize CPU load)
      let rawApp = this.cachedRawApp;
      if (now - this.lastAppCheckTime > 1200 || !this.cachedRawApp) {
        this.lastAppCheckTime = now;
        if (process.platform === 'darwin') {
          try {
            const { stdout } = await execAsync(`lsappinfo info -only name $(lsappinfo front)`);
            const match = stdout.match(/^"([^"]+)"/);
            if (match && match[1]) {
              rawApp = match[1];
            } else {
              rawApp = stdout.split('\n')[0].replace(/"/g, '').trim();
            }
          } catch {
            try {
              const { stdout } = await execAsync(
                `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`
              );
              rawApp = stdout.trim();
            } catch {
              // ignore
            }
          }
        } else if (process.platform === 'win32') {
          try {
            const { stdout } = await execAsync(
              `powershell -NoProfile -NonInteractive -Command "$h = (Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int p);' -Name W -Namespace W -PassThru)::GetForegroundWindow(); $p = 0; [W.W]::GetWindowThreadProcessId($h, [ref]$p); (Get-Process -Id $p).ProcessName"`
            );
            rawApp = stdout.trim().split('\r\n')[0].trim();
          } catch {
            // ignore
          }
        } else if (process.platform === 'linux') {
          try {
            const { stdout } = await execAsync(`xdotool getactivewindow getwindowname`);
            rawApp = stdout.trim();
          } catch {
            try {
              const { stdout } = await execAsync(
                `xprop -id $(xprop -root -notype _NET_ACTIVE_WINDOW | awk '{print $5}') WM_CLASS`
              );
              const match = stdout.match(/WM_CLASS.*= "(?:[^"]+)", "([^"]+)"/);
              if (match && match[1]) {
                rawApp = match[1];
              }
            } catch {
              // ignore
            }
          }
        }
        this.cachedRawApp = rawApp;
      }

      // 3. Audio stream detection (Content-Blind Security Feature)
      // Privacy Guarantee: NEVER captures audio data, microphone, song titles, or waveform.
      // Strictly inspects binary OS power assertions for whether audio hardware is active.
      let isAudioPlaying = false;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(`pmset -g assertions | grep -i "coreaudiod"`);
          if (
            stdout.includes('PreventUserIdleSystemSleep') ||
            stdout.includes('NoIdleSleepAssertion')
          ) {
            isAudioPlaying = true;
          }
        } catch {
          // grep exit code 1 if no match
        }
      } else if (process.platform === 'win32') {
        try {
          const { stdout } = await execAsync('powercfg -requests');
          // Windows powercfg outputs active audio assertions when media plays without revealing content
          if (stdout.includes('[AUDIO]') && !stdout.match(/\[AUDIO\]\s+None/i)) {
            isAudioPlaying = true;
          }
        } catch {
          // ignore
        }
      } else if (process.platform === 'linux') {
        try {
          const { stdout } = await execAsync(`pactl list sink-inputs | grep -i "state: RUNNING"`);
          if (stdout.includes('RUNNING')) {
            isAudioPlaying = true;
          }
        } catch {
          // ignore
        }
      }

      const classification = classifyApplication(rawApp);
      const isDevApp = classification.category === 'development';

      // On macOS we have high-resolution sub-second idle time (<0.75s).
      // On Windows and Linux with second-level granularity, idleSeconds === 0 indicates recent activity.
      const isRawInputActive =
        process.platform === 'darwin'
          ? idleSeconds < 0.75
          : idleSeconds === 0;

      // Check cursor motion to distinguish mouse pointing/movement from keyboard typing
      let isMouseMoving = false;
      if (electronScreen) {
        try {
          const currentCursor = electronScreen.getCursorScreenPoint();
          const dist = Math.hypot(
            currentCursor.x - this.lastCursorPos.x,
            currentCursor.y - this.lastCursorPos.y
          );
          this.lastCursorPos = currentCursor;
          if (dist > 4) {
            isMouseMoving = true;
          }
        } catch {
          // ignore
        }
      }

      // On non-macOS platforms, avoid false positive typing when the mouse is merely stationary:
      // only classify as typing if user is in an editor/terminal or already in an active streak
      const qualifiesForTyping =
        process.platform === 'darwin' || isDevApp || this.typingStreak > 0;
      const isKeyboardTyping = isRawInputActive && !isMouseMoving && qualifiesForTyping;

      if (isKeyboardTyping) {
        this.lastInputActiveTime = now;
        this.typingStreak++;
      } else if (isMouseMoving) {
        // Pointing/moving mouse - cool down typing streak
        this.typingStreak = 0;
      } else if (idleSeconds > 1.5) {
        this.typingStreak = 0;
      }

      const timeSinceLastInput = (now - this.lastInputActiveTime) / 1000;

      // Handle long periods of absence
      if (idleSeconds > 90) {
        if (this.lastState !== 'sleeping') {
          this.lastState = 'sleeping';
          this.lastAppName = 'System';
          const event: SystemActivityEvent = {
            appName: 'System',
            category: 'idle',
            state: 'sleeping',
            title: 'Sleeping Zzz',
            subtitle: 'Resting while you are away. Tap anytime!',
            timestamp: now,
            isTyping: false,
          };
          this.onActivityChange(event);
          return event;
        }
        return null;
      }

      // Waking up from sleep
      if (this.lastState === 'sleeping' && (isKeyboardTyping || isMouseMoving)) {
        this.lastState = 'waking';
        const wakeEvent: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: 'waking',
          title: 'Welcome Back',
          subtitle: `Ready to flow in ${classification.formattedName}.`,
          timestamp: now,
          isTyping: false,
        };
        this.onActivityChange(wakeEvent);
        return wakeEvent;
      }

      let finalState: PetAnimationState = classification.state;
      let finalTitle = classification.title;
      let finalSubtitle = classification.subtitles[0];

      // Logic for audio vibing vs coding vs focused vs general typing
      if (isAudioPlaying && (idleSeconds > 3.5 || !isDevApp)) {
        finalState = 'listening';
        finalTitle = 'Audio Playing 🎧';
        finalSubtitle = 'Headphones on & vibing to the beat 🎧';
      } else if (isDevApp) {
        // Active in VS Code, Antigravity IDE, Cursor, Xcode, etc.
        if (isKeyboardTyping || (timeSinceLastInput < 1.4 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = `Coding in ${classification.formattedName}`;
          finalSubtitle = `Typing code in ${classification.formattedName} 💻`;
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = classification.formattedName;
          finalSubtitle = `Navigating code in ${classification.formattedName}`;
        } else if (idleSeconds < 30) {
          finalState = 'focused';
          finalTitle = classification.formattedName;
          finalSubtitle = `Deep focus in ${classification.formattedName}`;
        } else {
          finalState = 'idle';
          finalTitle = classification.formattedName;
          finalSubtitle = `Active workspace in ${classification.formattedName}`;
        }
      } else {
        // Non-developer apps (Slack, Notion, Chrome, Spotify, etc.)
        if (isKeyboardTyping || (timeSinceLastInput < 1.2 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = `Typing in ${classification.formattedName}`;
          finalSubtitle = `Active typing in ${classification.formattedName}`;
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = classification.formattedName;
          finalSubtitle = `Working in ${classification.formattedName}`;
        } else if (idleSeconds < 25) {
          finalState = classification.state;
          finalTitle = classification.title;
          finalSubtitle = `Active in ${classification.formattedName}`;
        } else {
          finalState = 'idle';
          finalTitle = classification.formattedName;
          finalSubtitle = `Standing by in ${classification.formattedName}`;
        }
      }

      const appChanged = rawApp.toLowerCase() !== this.lastAppName.toLowerCase();
      const stateChanged = finalState !== this.lastState;
      const isBurstTyping = isKeyboardTyping && this.typingStreak > 5;

      // Decide if we should notify listeners
      if (appChanged || stateChanged || (isBurstTyping && now - this.lastBubbleEmitTime > 8000)) {
        this.lastAppName = rawApp;
        this.lastState = finalState;
        this.lastSubtitle = finalSubtitle;
        if (appChanged || stateChanged) {
          this.lastBubbleEmitTime = now;
        }

        const event: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: finalState,
          title: finalTitle,
          subtitle: finalSubtitle,
          timestamp: now,
          isTyping: isKeyboardTyping,
          typingBurst: isBurstTyping,
        };

        this.onActivityChange(event);
        return event;
      }

      return null;
    } catch (err) {
      console.error('[SystemActivityMonitor] error in checkActivity:', err);
      return null;
    }
  }
}
