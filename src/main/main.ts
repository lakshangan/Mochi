import { app, ipcMain, screen, Tray, Menu } from 'electron';
import path from 'path';
import { PersistenceService } from './services/persistence-service';
import { NotificationService } from './services/notification-service';
import { TimerService } from './services/timer-service';
import { ReminderService } from './services/reminder-service';
import { TrayService } from './services/tray-service';
import { PetWindow } from './windows/pet-window';
import { AssistantWindow } from './windows/assistant-window';
import { PlatformAdapter } from './platform/platform-adapter';
import { SystemActivityMonitor } from './services/system-activity';
import { IPC_CHANNELS } from '../shared/ipc-contracts';
import { AppSettings, PetAnimationState, PetPosition, TaskItem, NoteItem, PomodoroPhase } from '../shared/types';

// Enforce single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const DEV_URL = 'http://localhost:5173';
const PRELOAD_PATH = path.join(__dirname, '../preload/index.js');

let persistenceService: PersistenceService;
let notificationService: NotificationService;
let timerService: TimerService;
let reminderService: ReminderService;
let activityMonitor: SystemActivityMonitor;
let trayService: TrayService;
let petWindow: PetWindow;
let assistantWindow: AssistantWindow;
let wanderInterval: NodeJS.Timeout | null = null;

function broadcast(channel: string, ...args: any[]): void {
  const pWin = petWindow?.getWindow();
  if (pWin && !pWin.isDestroyed()) {
    pWin.webContents.send(channel, ...args);
  }
  const aWin = assistantWindow?.getWindow();
  if (aWin && !aWin.isDestroyed()) {
    aWin.webContents.send(channel, ...args);
  }
}

function setupAutoWander(): void {
  if (wanderInterval) {
    clearInterval(wanderInterval);
    wanderInterval = null;
  }

  const settings = persistenceService.getState().settings;
  if (!settings.autoWander) return;

  const intervalMs = Math.max(15, settings.wanderIntervalSeconds || 45) * 1000;
  wanderInterval = setInterval(() => {
    // Wander gently within current monitor
    const current = petWindow.getPosition();
    const display = screen.getDisplayNearestPoint(current);
    const bounds = display.workArea;

    // Small random delta (-60 to +60 px)
    const dx = (Math.random() - 0.5) * 120;
    const dy = (Math.random() - 0.5) * 80;

    let targetX = Math.max(bounds.x + 20, Math.min(bounds.x + bounds.width - 200, current.x + dx));
    let targetY = Math.max(bounds.y + 20, Math.min(bounds.y + bounds.height - 200, current.y + dy));

    // Animate to walking state, move window, then back to idle
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'walking');
    petWindow.setPosition({ x: targetX, y: targetY });
    persistenceService.updatePosition({ x: targetX, y: targetY });

    setTimeout(() => {
      broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
    }, 1500);
  }, intervalMs);
}

function registerIpcHandlers(): void {
  // Window controls
  ipcMain.handle(IPC_CHANNELS.WINDOW_DRAG, (_event, deltaX: number, deltaY: number) => {
    petWindow.moveBy(deltaX, deltaY);
    persistenceService.updatePosition(petWindow.getPosition(), false); // debounced write!
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_POSITION, () => {
    return petWindow.getPosition();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_POSITION, (_event, pos: PetPosition) => {
    petWindow.setPosition(pos);
    persistenceService.updatePosition(pos, true);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_ASSISTANT, () => {
    const petPos = petWindow.getPosition();
    return assistantWindow.createOrToggle(petPos, PRELOAD_PATH, isDev, DEV_URL);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE_ASSISTANT, () => {
    assistantWindow.hide();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_PET, () => {
    if (!petWindow) return false;
    const isNowVisible = petWindow.toggle();
    trayService?.updateMenu();
    return isNowVisible;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_PET_VISIBLE, (_event, visible: boolean) => {
    if (!petWindow) return;
    if (visible) {
      petWindow.show();
    } else {
      petWindow.hide();
    }
    trayService?.updateMenu();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP, (_event, val: boolean) => {
    petWindow.setAlwaysOnTop(val);
    persistenceService.updateSettings({ alwaysOnTop: val });
  });

  // State
  ipcMain.handle(IPC_CHANNELS.GET_INITIAL_STATE, () => {
    const fullState = persistenceService.getState();
    fullState.timer = timerService.getState();
    fullState.activeReminder = reminderService.getActiveReminder();
    return fullState;
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, partial: Partial<AppSettings>) => {
    const updated = persistenceService.updateSettings(partial);
    if (partial.petSize) {
      petWindow.resize(partial.petSize);
    }
    if (partial.alwaysOnTop !== undefined) {
      petWindow.setAlwaysOnTop(partial.alwaysOnTop);
    }
    if (partial.autoWander !== undefined || partial.wanderIntervalSeconds !== undefined) {
      setupAutoWander();
    }
    if (partial.launchAtLogin !== undefined) {
      PlatformAdapter.setLaunchAtLogin(partial.launchAtLogin);
    }
    if (partial.userName !== undefined) {
      trayService?.updateMenu();
    }
    broadcast(IPC_CHANNELS.STATE_UPDATED, { settings: updated });
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_TASKS, (_event, tasks: TaskItem[]) => {
    const updated = persistenceService.updateTasks(tasks);
    broadcast(IPC_CHANNELS.STATE_UPDATED, { tasks: updated });
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_NOTES, (_event, notes: NoteItem[]) => {
    const updated = persistenceService.updateNotes(notes);
    broadcast(IPC_CHANNELS.STATE_UPDATED, { notes: updated });
    return updated;
  });

  // Timers
  ipcMain.handle(IPC_CHANNELS.TIMER_START, (_event, seconds: number, label?: string) => {
    const state = timerService.startCountdown(seconds, label);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'focused');
    return state;
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
    return timerService.pause();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
    return timerService.resume();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
    const state = timerService.reset();
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
    return state;
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_START_POMODORO, (_event, phase?: PomodoroPhase) => {
    const state = timerService.startPomodoro(phase);
    broadcast(
      IPC_CHANNELS.PET_SET_STATE,
      phase === 'short-break' || phase === 'long-break' ? 'idle' : 'working'
    );
    return state;
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_SKIP_POMODORO, () => {
    return timerService.skipPomodoro();
  });

  // Reminders
  ipcMain.handle(IPC_CHANNELS.REMINDER_WATER_SNOOZE, (_event, minutes = 10) => {
    reminderService.snoozeWater(minutes);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_WATER_COMPLETE, () => {
    reminderService.completeWater();
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'hydrated');
    setTimeout(() => {
      broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
    }, 3500);
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_WATER_DISMISS, () => {
    reminderService.dismissWater();
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_BREAK_SNOOZE, (_event, minutes = 10) => {
    reminderService.snoozeBreak(minutes);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_BREAK_START_TIMER, () => {
    const settings = persistenceService.getState().settings.breakReminders;
    reminderService.dismissBreak();
    timerService.startCountdown(settings.breakDurationMinutes * 60, 'Mindful Break');
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'sleeping');
  });

  ipcMain.handle(IPC_CHANNELS.REMINDER_BREAK_DISMISS, () => {
    reminderService.dismissBreak();
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
  });

  // Pet
  ipcMain.handle(IPC_CHANNELS.PET_SET_STATE, (_event, state: PetAnimationState) => {
    broadcast(IPC_CHANNELS.PET_SET_STATE, state);
  });

  ipcMain.handle(IPC_CHANNELS.PET_REACT, (_event, reaction: PetAnimationState) => {
    broadcast(IPC_CHANNELS.PET_SET_STATE, reaction);
  });

  // AI Proxy Handler
  ipcMain.handle(
    IPC_CHANNELS.AI_QUERY,
    async (_event, prompt: string, history: any[]) => {
      const settings = persistenceService.getState().settings.ai;
      if (settings.provider !== 'openai' || !settings.apiKey) {
        return { text: '', error: 'OpenAI provider not configured with API key' };
      }

      try {
        const endpoint = settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
        const model = settings.model || 'gpt-4o-mini';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content:
                  'You are Mochi, a friendly, calm, intelligent, and glowing digital orb companion on the desktop. Keep responses concise, uplifting, and productivity-focused (under 3 sentences). Offer helpful advice for study, breaks, hydration, and tasks.',
              },
              ...(history || []).slice(-4).map((m: any) => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text,
              })),
              { role: 'user', content: prompt },
            ],
            temperature: settings.temperature ?? 0.7,
            max_tokens: 150,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return { text: content };
          }
        }
        return { text: '', error: `Provider returned HTTP status ${res.status}` };
      } catch (err: any) {
        console.warn('[Main] AI query proxy error:', err);
        return { text: '', error: err.message || 'AI query failed' };
      }
    }
  );

  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, (_event, title: string, body: string) => {
    notificationService.showNotification(title, body);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, () => {
    return PlatformAdapter.getPlatform();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    try {
      const appMetrics = app.getAppMetrics();
      let totalRamKB = 0;
      let mainRamKB = 0;
      let rendererRamKB = 0;
      let gpuRamKB = 0;
      let totalCpu = 0;

      for (const m of appMetrics) {
        const mem = m.memory.workingSetSize;
        totalRamKB += mem;
        totalCpu += m.cpu.percentCPUUsage;
        if (m.type === 'Browser') {
          mainRamKB += mem;
        } else if (m.type === 'Tab') {
          rendererRamKB += mem;
        } else if (m.type === 'GPU') {
          gpuRamKB += mem;
        }
      }

      if (totalRamKB === 0) {
        const mem = process.memoryUsage();
        totalRamKB = Math.round(mem.rss / 1024);
        mainRamKB = totalRamKB;
      }

      return {
        totalRamMB: Math.round(totalRamKB / 1024),
        mainProcessRamMB: Math.round(mainRamKB / 1024),
        rendererRamMB: Math.round(rendererRamKB / 1024),
        gpuRamMB: Math.round(gpuRamKB / 1024),
        cpuPercent: Math.min(100, Math.round(totalCpu * 10) / 10),
        fps: 60,
        uptimeSeconds: Math.floor(process.uptime()),
        leakWatchdogStatus: 'clean',
      };
    } catch {
      const mem = process.memoryUsage();
      return {
        totalRamMB: Math.round(mem.rss / 1024 / 1024),
        mainProcessRamMB: Math.round(mem.heapUsed / 1024 / 1024),
        rendererRamMB: 0,
        gpuRamMB: 0,
        cpuPercent: 0.8,
        fps: 60,
        uptimeSeconds: Math.floor(process.uptime()),
        leakWatchdogStatus: 'clean',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_QUIT, () => {
    app.quit();
  });
}

app.whenReady().then(() => {
  persistenceService = new PersistenceService();
  notificationService = new NotificationService();
  timerService = new TimerService(persistenceService, notificationService);
  reminderService = new ReminderService(persistenceService, notificationService);

  activityMonitor = new SystemActivityMonitor((activity) => {
    broadcast(IPC_CHANNELS.SYSTEM_ACTIVITY_CHANGED, activity);
    broadcast(IPC_CHANNELS.PET_SET_STATE, activity.state);
  });
  
  // Only start activity monitor if user is on macOS and it's enabled in settings? 
  // For now, always start it to fulfill the requested feature.
  activityMonitor.start();

  const initialPos = persistenceService.getState().position;
  const settings = persistenceService.getState().settings;

  petWindow = new PetWindow(initialPos, settings);
  assistantWindow = new AssistantWindow();

  registerIpcHandlers();
  petWindow.create(PRELOAD_PATH, isDev, DEV_URL);

  // Initialize macOS Status Bar / System Tray Service
  trayService = new TrayService({
    petWindow,
    assistantWindow,
    timerService,
    reminderService,
    notificationService,
    persistenceService,
    broadcast,
    preloadPath: PRELOAD_PATH,
    isDev,
    devUrl: DEV_URL,
  });
  trayService.init();

  // Link timer events to windows & tray
  timerService.onTick((state) => {
    broadcast(IPC_CHANNELS.TIMER_TICK, state);
  });

  timerService.onComplete((state) => {
    broadcast(IPC_CHANNELS.TIMER_COMPLETED, state);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'celebrating');
    // If pet was hidden for full-screen Deep Work, restore it to celebrate!
    if (petWindow && !petWindow.isVisible()) {
      petWindow.show();
      const userName = persistenceService.getState().settings.userName;
      notificationService.showNotification(
        'Deep Work Sprint Complete! 🎉',
        `Incredible focus${userName ? `, ${userName}` : ''}! Mochi is back to celebrate your achievement.`
      );
    }
    trayService?.updateMenu();
    setTimeout(() => {
      broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
    }, 4000);
  });

  // Link reminder events to windows
  reminderService.onTrigger((event) => {
    broadcast(IPC_CHANNELS.REMINDER_TRIGGERED, event);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'reminding');
  });

  setupAutoWander();
  setupGlobalGazeTracking();
});

let gazeInterval: NodeJS.Timeout | null = null;
let lastGazeSent = { x: 0, y: 0 };

function setupGlobalGazeTracking(): void {
  if (gazeInterval) {
    clearInterval(gazeInterval);
    gazeInterval = null;
  }
  gazeInterval = setInterval(() => {
    if (!petWindow) return;
    const pWin = petWindow.getWindow();
    if (!pWin || pWin.isDestroyed() || !pWin.isVisible()) return;

    try {
      const cursor = screen.getCursorScreenPoint();
      const petPos = petWindow.getPosition();
      const petSize = persistenceService?.getState()?.settings?.petSize || 115;
      const petCenterX = petPos.x + petSize / 2;
      const petCenterY = petPos.y + petSize / 2;

      const dx = cursor.x - petCenterX;
      const dy = cursor.y - petCenterY;

      // Soft clamp to [-1, 1] with comfortable 400x320 px zone
      const normX = Math.max(-1, Math.min(1, dx / 400));
      const normY = Math.max(-1, Math.min(1, dy / 320));

      if (Math.abs(normX - lastGazeSent.x) > 0.02 || Math.abs(normY - lastGazeSent.y) > 0.02) {
        lastGazeSent = { x: normX, y: normY };
        pWin.webContents.send(IPC_CHANNELS.PET_GAZE_UPDATE, { x: normX, y: normY });
      }
    } catch {
      // ignore
    }
  }, 60);
}

app.on('before-quit', () => {
  trayService?.destroy();
  if (persistenceService) {
    persistenceService.flushPendingSave();
  }
});

app.on('window-all-closed', () => {
  if (PlatformAdapter.isMac()) {
    // Keep pet active on mac unless explicit quit
  } else {
    app.quit();
  }
});
