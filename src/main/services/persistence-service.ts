import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings, MochiFullState, PetPosition, TaskItem, NoteItem, ActiveTimerState } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  petSize: 180,
  opacity: 0.98,
  animationIntensity: 'normal',
  alwaysOnTop: true,
  autoWander: false,
  wanderIntervalSeconds: 45,
  movementSpeed: 1.0,
  reducedMotion: false,
  soundEnabled: true,
  soundVolume: 0.7,
  launchAtLogin: false,
  activityAwareness: true,
  theme: 'neon-dark',
  waterReminders: {
    enabled: true,
    intervalMinutes: 45,
  },
  breakReminders: {
    enabled: true,
    intervalMinutes: 60,
    breakDurationMinutes: 5,
  },
  pomodoro: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    autoTransition: true,
    completedSessions: 0,
  },
  ai: {
    provider: 'offline-local',
  },
};

const DEFAULT_STATE: MochiFullState = {
  settings: DEFAULT_SETTINGS,
  position: { x: 300, y: 300 },
  tasks: [
    {
      id: 'task-1',
      title: 'Welcome to Mochi! Click me to explore',
      completed: false,
      createdAt: Date.now(),
      priority: 'high',
    },
    {
      id: 'task-2',
      title: 'Stay hydrated & take mindful breaks',
      completed: false,
      createdAt: Date.now(),
      priority: 'medium',
    },
  ],
  notes: [
    {
      id: 'note-1',
      title: 'Welcome to Mochi 🌟',
      content:
        'Mochi is your living desktop companion.\n• Drag Mochi anywhere on your screen\n• Click Mochi to open the assistant\n• Try natural commands like "Start a 10-minute timer"',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: '#4facfe',
    },
  ],
  timer: {
    mode: 'none',
    pomodoroPhase: 'idle',
    status: 'stopped',
    targetEndTime: null,
    pausedRemainingSeconds: 0,
    totalDurationSeconds: 0,
    remainingSeconds: 0,
    label: '',
    startedAt: null,
  },
  activeReminder: null,
  petState: 'idle',
};

export class PersistenceService {
  private filePath: string;
  private state: MochiFullState;

  constructor() {
    const dataDir = app ? app.getPath('userData') : process.cwd();
    this.filePath = path.join(dataDir, 'mochi-companion-data.json');
    this.state = this.loadState();
  }

  private loadState(): MochiFullState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Deep merge with defaults to handle new fields or missing properties
        const merged: MochiFullState = {
          ...DEFAULT_STATE,
          ...parsed,
          settings: {
            ...DEFAULT_SETTINGS,
            ...(parsed.settings || {}),
            waterReminders: {
              ...DEFAULT_SETTINGS.waterReminders,
              ...(parsed.settings?.waterReminders || {}),
            },
            breakReminders: {
              ...DEFAULT_SETTINGS.breakReminders,
              ...(parsed.settings?.breakReminders || {}),
            },
            pomodoro: {
              ...DEFAULT_SETTINGS.pomodoro,
              ...(parsed.settings?.pomodoro || {}),
            },
            ai: {
              ...DEFAULT_SETTINGS.ai,
              ...(parsed.settings?.ai || {}),
            },
          },
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_STATE.tasks,
          notes: Array.isArray(parsed.notes) ? parsed.notes : DEFAULT_STATE.notes,
          position: parsed.position && typeof parsed.position.x === 'number' ? parsed.position : DEFAULT_STATE.position,
        };

        // Recover timer state if it was running before shutdown
        if (merged.timer && merged.timer.status === 'running' && merged.timer.targetEndTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.round((merged.timer.targetEndTime - now) / 1000));
          if (remaining > 0) {
            merged.timer.remainingSeconds = remaining;
          } else {
            merged.timer.remainingSeconds = 0;
            merged.timer.status = 'completed';
          }
        }

        return merged;
      }
    } catch (err) {
      console.error('[PersistenceService] Failed to read state from disk, using defaults:', err);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  public saveState(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PersistenceService] Error writing state to disk:', err);
    }
  }

  public getState(): MochiFullState {
    return this.state;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.state.settings = {
      ...this.state.settings,
      ...partial,
    };
    this.saveState();
    return this.state.settings;
  }

  public updatePosition(pos: PetPosition): void {
    this.state.position = pos;
    this.saveState();
  }

  public updateTasks(tasks: TaskItem[]): TaskItem[] {
    this.state.tasks = tasks;
    this.saveState();
    return this.state.tasks;
  }

  public updateNotes(notes: NoteItem[]): NoteItem[] {
    this.state.notes = notes;
    this.saveState();
    return this.state.notes;
  }

  public updateTimer(timer: ActiveTimerState): void {
    this.state.timer = timer;
    this.saveState();
  }

  public resetAllData(): MochiFullState {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
    return this.state;
  }
}
