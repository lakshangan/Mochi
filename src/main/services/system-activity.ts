import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemActivityEvent, AppActivityCategory, PetAnimationState } from '../../shared/types';

const execAsync = promisify(exec);

export interface AppClassification {
  formattedName: string;
  category: AppActivityCategory;
  state: PetAnimationState;
  title: string;
  subtitles: string[];
}

const DEV_SUBTITLES = [
  'What are you building today?',
  'Flow state activated. Crafting clean code!',
  'VS Code workspace active. Need a focus timer?',
  'Building something great. Stay hydrated!',
];

const APP_DATABASE: Record<string, AppClassification> = {
  // Development
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
    subtitles: ['AI-assisted coding session in progress!', 'Writing software with AI precision.'],
  },
  xcode: {
    formattedName: 'Xcode',
    category: 'development',
    state: 'coding',
    title: 'Apple Development',
    subtitles: ['Building for Apple platforms in Xcode.', 'Compiling Swift & SwiftUI magic.'],
  },
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
    subtitles: ['Modern CLI session active.', 'Running commands smoothly.'],
  },
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
  postman: {
    formattedName: 'Postman',
    category: 'development',
    state: 'focused',
    title: 'API Testing',
    subtitles: ['Testing endpoints & payloads.', 'Refining REST/GraphQL APIs.'],
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
  blender: {
    formattedName: 'Blender 3D',
    category: 'design',
    state: 'curious',
    title: 'Blender 3D Studio',
    subtitles: ['Modeling & rendering 3D scenes.', '3D creation in flow.'],
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

  // Entertainment / Audio
  spotify: {
    formattedName: 'Spotify',
    category: 'entertainment',
    state: 'listening',
    title: 'Spotify Audio',
    subtitles: ['Vibing to tunes ♫', 'Focus beats powering your flow.'],
  },
  music: {
    formattedName: 'Apple Music',
    category: 'entertainment',
    state: 'listening',
    title: 'Music Session',
    subtitles: ['Jamming to Apple Music ♫', 'Great soundtrack for productivity!'],
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
  private interval: NodeJS.Timeout | null = null;
  private lastAppName = '';
  private lastState: PetAnimationState = 'idle';
  private lastEventTime = 0;
  private onActivityChange: (event: SystemActivityEvent) => void;
  private pollIntervalMs = 2000;

  constructor(onActivityChange: (event: SystemActivityEvent) => void) {
    this.onActivityChange = onActivityChange;
  }

  public start() {
    this.stop();
    this.checkActivity();
    this.interval = setInterval(() => this.checkActivity(), this.pollIntervalMs);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public async checkActivity(): Promise<SystemActivityEvent | null> {
    try {
      // 1. Check user idle time via IOHIDSystem (macOS)
      let idleSeconds = 0;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(`ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF; exit}'`);
          const idleNanos = parseInt(stdout.trim(), 10);
          if (!isNaN(idleNanos)) {
            idleSeconds = idleNanos / 1_000_000_000;
          }
        } catch {
          // ignore
        }
      }

      // If user is away for > 90 seconds, transition smoothly to sleeping
      if (idleSeconds > 90) {
        if (this.lastState !== 'sleeping') {
          this.lastState = 'sleeping';
          const event: SystemActivityEvent = {
            appName: 'System',
            category: 'idle',
            state: 'sleeping',
            title: 'Sleeping Zzz',
            subtitle: 'Resting while you are away. Tap anytime!',
            timestamp: Date.now(),
          };
          this.onActivityChange(event);
          return event;
        }
        return null;
      }

      // 2. Check frontmost application
      let rawApp = '';
      if (process.platform === 'darwin') {
        try {
          // lsappinfo is instantaneous and requires no Accessibility permissions
          const { stdout } = await execAsync(`lsappinfo info -only name $(lsappinfo front)`);
          const match = stdout.match(/^"([^"]+)"/);
          if (match && match[1]) {
            rawApp = match[1];
          } else {
            rawApp = stdout.split('\n')[0].replace(/"/g, '').trim();
          }
        } catch {
          // Fallback to osascript
          try {
            const { stdout } = await execAsync(
              `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`
            );
            rawApp = stdout.trim();
          } catch {
            // ignore
          }
        }
      }

      // 3. Check audio assertions (coreaudiod playing sound)
      let isAudioPlaying = false;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(`pmset -g assertions | grep -i "coreaudiod"`);
          if (stdout.includes('PreventUserIdleSystemSleep') || stdout.includes('NoIdleSleepAssertion')) {
            isAudioPlaying = true;
          }
        } catch {
          // grep exit code 1 if no match
        }
      }

      // Decide category and reaction
      const classification = classifyApplication(rawApp);

      let finalState = classification.state;
      let finalTitle = classification.title;
      let finalSubtitle = classification.subtitles[Math.floor(Math.random() * classification.subtitles.length)];

      // Audio takes priority if user is listening to music/podcast unless they are heavily coding
      if (isAudioPlaying && classification.category !== 'development') {
        finalState = 'listening';
        finalTitle = 'Audio Stream ♫';
        finalSubtitle = 'Soundtrack active. Vibing along with you!';
      } else if (idleSeconds < 2.5 && finalState === 'idle') {
        // Fast keyboard / mouse activity
        finalState = 'typing';
        finalTitle = 'Active Flow';
        finalSubtitle = `Working in ${classification.formattedName}.`;
      }

      // Has the app or key state changed?
      const appChanged = rawApp.toLowerCase() !== this.lastAppName.toLowerCase();
      const stateChanged = finalState !== this.lastState;

      if (appChanged || stateChanged) {
        this.lastAppName = rawApp;
        this.lastState = finalState;
        this.lastEventTime = Date.now();

        const event: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: finalState,
          title: finalTitle,
          subtitle: finalSubtitle,
          timestamp: Date.now(),
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
