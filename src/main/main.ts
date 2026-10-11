import { app, ipcMain, screen, Tray, Menu } from 'electron';
import path from 'path';
import { PersistenceService } from './services/persistence-service';
import { NotificationService } from './services/notification-service';
import { TimerService } from './services/timer-service';
import { ReminderService } from './services/reminder-service';
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
    persistenceService.updatePosition(petWindow.getPosition());
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_POSITION, () => {
    return petWindow.getPosition();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_POSITION, (_event, pos: PetPosition) => {
    petWindow.setPosition(pos);
    persistenceService.updatePosition(pos);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_ASSISTANT, () => {
    const petPos = petWindow.getPosition();
    return assistantWindow.createOrToggle(petPos, PRELOAD_PATH, isDev, DEV_URL);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE_ASSISTANT, () => {
    assistantWindow.hide();
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
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'celebrating');
    setTimeout(() => {
      broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
    }, 2500);
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

  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, (_event, title: string, body: string) => {
    notificationService.showNotification(title, body);
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_PLATFORM, () => {
    return PlatformAdapter.getPlatform();
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

  // Link timer events to windows
  timerService.onTick((state) => {
    broadcast(IPC_CHANNELS.TIMER_TICK, state);
  });

  timerService.onComplete((state) => {
    broadcast(IPC_CHANNELS.TIMER_COMPLETED, state);
    broadcast(IPC_CHANNELS.PET_SET_STATE, 'celebrating');
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
});

app.on('window-all-closed', () => {
  if (PlatformAdapter.isMac()) {
    // Keep pet active on mac unless explicit quit
  } else {
    app.quit();
  }
});
