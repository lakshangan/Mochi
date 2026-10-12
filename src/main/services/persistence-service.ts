import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { AppSettings, MochiFullState, PetPosition, TaskItem, NoteItem, ActiveTimerState } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  hasSeenWelcome: false,
  petSize: 115,
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

let electronSafeStorage: typeof import('electron').safeStorage | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require('electron');
  electronSafeStorage = electron.safeStorage || null;
} catch {
  // Non-electron test environments
}

export class PersistenceService {
  private filePath: string;
  private state: MochiFullState;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    const dataDir = app ? app.getPath('userData') : process.cwd();
    this.filePath = path.join(dataDir, 'mochi-companion-data.json');
    this.state = this.loadState();
  }

  private encryptApiKey(rawKey: string): string {
    if (!rawKey) return '';
    try {
      if (electronSafeStorage && electronSafeStorage.isEncryptionAvailable()) {
        const encrypted = electronSafeStorage.encryptString(rawKey);
        return encrypted.toString('base64');
      }
    } catch (err) {
      console.warn('[PersistenceService] safeStorage encryption error, using fallback:', err);
    }
    // Fallback reversible encoding when OS safeStorage is not available (e.g., test suites)
    return Buffer.from(rawKey, 'utf-8').toString('base64');
  }

  private decryptApiKey(cipherText: string): string {
    if (!cipherText) return '';
    try {
      if (electronSafeStorage && electronSafeStorage.isEncryptionAvailable()) {
        const buf = Buffer.from(cipherText, 'base64');
        return electronSafeStorage.decryptString(buf);
      }
    } catch {
      // safeStorage failed or payload was encoded via fallback
    }
    try {
      return Buffer.from(cipherText, 'base64').toString('utf-8');
    } catch {
      return '';
    }
  }

  private loadState(): MochiFullState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);

        // Recover and decrypt API key if present
        let recoveredApiKey = '';
        if (parsed.settings?.ai?.encryptedApiKey) {
          recoveredApiKey = this.decryptApiKey(parsed.settings.ai.encryptedApiKey);
        } else if (parsed.settings?.ai?.apiKey) {
          // If legacy plaintext key existed, adopt it and it will be encrypted on next save
          recoveredApiKey = parsed.settings.ai.apiKey;
        }

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
              apiKey: recoveredApiKey,
            },
          },
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : DEFAULT_STATE.tasks,
          notes: Array.isArray(parsed.notes) ? parsed.notes : DEFAULT_STATE.notes,
          position:
            parsed.position && typeof parsed.position.x === 'number'
              ? parsed.position
              : DEFAULT_STATE.position,
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

  /**
   * Performs a truly atomic write by writing to a unique temporary file
   * on the same filesystem and atomically renaming it over the destination.
   */
  public saveState(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveStateSync();
  }

  private saveStateSync(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Clone state for serialization without plaintext API keys
      const stateToPersist = JSON.parse(JSON.stringify(this.state)) as MochiFullState;

      // Encrypt API key using OS safeStorage (or fallback) and remove plaintext key from disk representation
      if (this.state.settings.ai.apiKey) {
        stateToPersist.settings.ai.encryptedApiKey = this.encryptApiKey(
          this.state.settings.ai.apiKey
        );
        delete stateToPersist.settings.ai.apiKey;
      } else {
        delete stateToPersist.settings.ai.apiKey;
        delete stateToPersist.settings.ai.encryptedApiKey;
      }

      const tempFile = path.join(
        dir,
        `.mochi-data.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`
      );

      fs.writeFileSync(tempFile, JSON.stringify(stateToPersist, null, 2), 'utf-8');
      fs.renameSync(tempFile, this.filePath);
    } catch (err) {
      console.error('[PersistenceService] Error performing atomic write to disk:', err);
    }
  }

  /**
   * Debounces saving to disk to prevent disk thrashing during rapid operations like window drag.
   */
  public scheduleDebouncedSave(delayMs = 400): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveStateSync();
    }, delayMs);
  }

  public flushPendingSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
      this.saveStateSync();
    }
  }

  public getState(): MochiFullState {
    return this.state;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.state.settings = {
      ...this.state.settings,
      ...partial,
      ai: {
        ...this.state.settings.ai,
        ...(partial.ai || {}),
      },
    };
    this.saveState();
    return this.state.settings;
  }

  public updatePosition(pos: PetPosition, immediate = false): void {
    this.state.position = pos;
    if (immediate) {
      this.saveState();
    } else {
      this.scheduleDebouncedSave(400);
    }
  }

  /**
   * Reconciles tasks across multiple windows to prevent last-writer-wins clobbering.
   */
  public updateTasks(incoming: TaskItem[]): TaskItem[] {
    const incomingIds = new Set(incoming.map((t) => t.id));
    const currentMap = new Map(this.state.tasks.map((t) => [t.id, t]));

    // 1. Process items in incoming list
    const merged: TaskItem[] = incoming.map((item) => {
      const existing = currentMap.get(item.id);
      if (!existing) return item;
      // Prefer whichever item has newer completion or modification
      const existingTime = existing.completedAt || existing.createdAt;
      const itemTime = item.completedAt || item.createdAt;
      if (existingTime > itemTime) {
        return existing;
      }
      return item;
    });

    // 2. Retain recently created items that incoming list didn't know about yet
    const now = Date.now();
    for (const existing of this.state.tasks) {
      if (!incomingIds.has(existing.id) && now - existing.createdAt < 5000) {
        merged.unshift(existing);
      }
    }

    this.state.tasks = merged;
    this.saveState();
    return this.state.tasks;
  }

  /**
   * Reconciles notes across multiple windows to prevent last-writer-wins clobbering.
   */
  public updateNotes(incoming: NoteItem[]): NoteItem[] {
    const incomingIds = new Set(incoming.map((n) => n.id));
    const currentMap = new Map(this.state.notes.map((n) => [n.id, n]));

    const merged: NoteItem[] = incoming.map((item) => {
      const existing = currentMap.get(item.id);
      if (!existing) return item;
      const existingTime = existing.updatedAt || existing.createdAt;
      const itemTime = item.updatedAt || item.createdAt;
      if (existingTime > itemTime) {
        return existing;
      }
      return item;
    });

    const now = Date.now();
    for (const existing of this.state.notes) {
      if (!incomingIds.has(existing.id) && now - existing.createdAt < 5000) {
        merged.unshift(existing);
      }
    }

    this.state.notes = merged;
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
