import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS, ElectronMochiAPI } from '../shared/ipc-contracts';
import {
  AppSettings,
  MochiFullState,
  PetAnimationState,
  PetPosition,
  TaskItem,
  NoteItem,
  ActiveTimerState,
  ReminderNotificationEvent,
  PomodoroPhase,
  SystemActivityEvent,
} from '../shared/types';

const mochiApi: ElectronMochiAPI = {
  // Window
  dragPet: (deltaX: number, deltaY: number) => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_DRAG, deltaX, deltaY);
  },
  setPosition: (pos: PetPosition) => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_POSITION, pos);
  },
  getPosition: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_POSITION);
  },
  toggleAssistant: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_ASSISTANT);
  },
  closeAssistant: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE_ASSISTANT);
  },
  setAlwaysOnTop: (alwaysOnTop: boolean) => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_ALWAYS_ON_TOP, alwaysOnTop);
  },
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => {
    return ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_IGNORE_MOUSE, ignore, forward);
  },

  // State
  getInitialState: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_INITIAL_STATE);
  },
  saveSettings: (settings: Partial<AppSettings>) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_SETTINGS, settings);
  },
  saveTasks: (tasks: TaskItem[]) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_TASKS, tasks);
  },
  saveNotes: (notes: NoteItem[]) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SAVE_NOTES, notes);
  },
  onStateUpdated: (callback: (state: Partial<MochiFullState>) => void) => {
    const handler = (_event: any, state: Partial<MochiFullState>) => callback(state);
    ipcRenderer.on(IPC_CHANNELS.STATE_UPDATED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.STATE_UPDATED, handler);
    };
  },

  // Timers
  startTimer: (seconds: number, label?: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_START, seconds, label);
  },
  pauseTimer: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE);
  },
  resumeTimer: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME);
  },
  resetTimer: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET);
  },
  startPomodoro: (phase?: PomodoroPhase) => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_START_POMODORO, phase);
  },
  skipPomodoro: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.TIMER_SKIP_POMODORO);
  },
  onTimerTick: (callback: (timer: ActiveTimerState) => void) => {
    const handler = (_event: any, timer: ActiveTimerState) => callback(timer);
    ipcRenderer.on(IPC_CHANNELS.TIMER_TICK, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.TIMER_TICK, handler);
    };
  },
  onTimerCompleted: (callback: (timer: ActiveTimerState) => void) => {
    const handler = (_event: any, timer: ActiveTimerState) => callback(timer);
    ipcRenderer.on(IPC_CHANNELS.TIMER_COMPLETED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.TIMER_COMPLETED, handler);
    };
  },

  // Reminders
  snoozeWater: (minutes?: number) => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_WATER_SNOOZE, minutes);
  },
  completeWater: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_WATER_COMPLETE);
  },
  dismissWater: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_WATER_DISMISS);
  },
  snoozeBreak: (minutes?: number) => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_BREAK_SNOOZE, minutes);
  },
  startBreakTimer: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_BREAK_START_TIMER);
  },
  dismissBreak: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.REMINDER_BREAK_DISMISS);
  },
  onReminderTriggered: (callback: (event: ReminderNotificationEvent) => void) => {
    const handler = (_event: any, ev: ReminderNotificationEvent) => callback(ev);
    ipcRenderer.on(IPC_CHANNELS.REMINDER_TRIGGERED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.REMINDER_TRIGGERED, handler);
    };
  },

  // Pet
  setPetState: (state: PetAnimationState) => {
    return ipcRenderer.invoke(IPC_CHANNELS.PET_SET_STATE, state);
  },
  triggerPetReaction: (reaction: PetAnimationState) => {
    return ipcRenderer.invoke(IPC_CHANNELS.PET_REACT, reaction);
  },
  onPetStateChange: (callback: (state: PetAnimationState) => void) => {
    const handler = (_event: any, state: PetAnimationState) => callback(state);
    ipcRenderer.on(IPC_CHANNELS.PET_SET_STATE, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PET_SET_STATE, handler);
    };
  },
  onGazeUpdate: (callback: (gaze: { x: number; y: number }) => void) => {
    const handler = (_event: any, gaze: { x: number; y: number }) => callback(gaze);
    ipcRenderer.on(IPC_CHANNELS.PET_GAZE_UPDATE, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.PET_GAZE_UPDATE, handler);
    };
  },

  // System
  onSystemActivity: (callback: (activity: SystemActivityEvent) => void) => {
    const handler = (_event: any, activity: SystemActivityEvent) => callback(activity);
    ipcRenderer.on(IPC_CHANNELS.SYSTEM_ACTIVITY_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SYSTEM_ACTIVITY_CHANGED, handler);
    };
  },
  showNotification: (title: string, body: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SHOW_NOTIFICATION, title, body);
  },
  getPlatform: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_PLATFORM);
  },
  quitApp: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_QUIT);
  },
};

contextBridge.exposeInMainWorld('mochiApi', mochiApi);
