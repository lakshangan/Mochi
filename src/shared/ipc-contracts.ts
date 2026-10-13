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
  SystemPerformanceMetrics,
} from './types';

export const IPC_CHANNELS = {
  // Window Management
  WINDOW_DRAG: 'window:drag',
  WINDOW_SET_POSITION: 'window:set-position',
  WINDOW_GET_POSITION: 'window:get-position',
  WINDOW_TOGGLE_ASSISTANT: 'window:toggle-assistant',
  WINDOW_CLOSE_ASSISTANT: 'window:close-assistant',
  WINDOW_CLOSE_ALERT: 'window:close-alert',
  ALERT_PREVIEW: 'alert:preview',
  WINDOW_TOGGLE_PET: 'window:toggle-pet',
  WINDOW_SET_PET_VISIBLE: 'window:set-pet-visible',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_SET_ALWAYS_ON_TOP: 'window:set-always-on-top',
  WINDOW_SET_IGNORE_MOUSE: 'window:set-ignore-mouse',

  // State & Persistence
  GET_INITIAL_STATE: 'state:get-initial',
  SAVE_SETTINGS: 'state:save-settings',
  SAVE_TASKS: 'state:save-tasks',
  SAVE_NOTES: 'state:save-notes',
  STATE_UPDATED: 'state:updated',

  // Timer Controls
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_RESET: 'timer:reset',
  TIMER_START_POMODORO: 'timer:start-pomodoro',
  TIMER_SKIP_POMODORO: 'timer:skip-pomodoro',
  TIMER_TICK: 'timer:tick',
  TIMER_COMPLETED: 'timer:completed',

  // Reminders
  REMINDER_TRIGGERED: 'reminder:triggered',
  REMINDER_WATER_SNOOZE: 'reminder:water-snooze',
  REMINDER_WATER_COMPLETE: 'reminder:water-complete',
  REMINDER_WATER_DISMISS: 'reminder:water-dismiss',
  REMINDER_BREAK_SNOOZE: 'reminder:break-snooze',
  REMINDER_BREAK_START_TIMER: 'reminder:break-start-timer',
  REMINDER_BREAK_DISMISS: 'reminder:break-dismiss',

  // Pet Behavior & Emotion
  PET_SET_STATE: 'pet:set-state',
  PET_REACT: 'pet:react',
  PET_GAZE_UPDATE: 'pet:gaze-update',

  // AI & External Services
  AI_QUERY: 'ai:query',

  // Platform & System
  SYSTEM_ACTIVITY_CHANGED: 'system:activity-changed',
  SYSTEM_SHOW_NOTIFICATION: 'system:show-notification',
  SYSTEM_GET_PLATFORM: 'system:get-platform',
  SYSTEM_GET_METRICS: 'system:get-metrics',
  SYSTEM_QUIT: 'system:quit',
} as const;

export interface ElectronMochiAPI {
  // Window
  dragPet: (deltaX: number, deltaY: number) => Promise<void>;
  setPosition: (pos: PetPosition) => Promise<void>;
  getPosition: () => Promise<PetPosition>;
  toggleAssistant: () => Promise<boolean>;
  closeAssistant: () => Promise<void>;
  closeAlertWindow?: () => Promise<void>;
  triggerFullScreenAlertPreview?: () => Promise<void>;
  togglePetVisibility: () => Promise<boolean>;
  setPetVisible: (visible: boolean) => Promise<void>;
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>;

  // State & Data
  getInitialState: () => Promise<MochiFullState>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  saveTasks: (tasks: TaskItem[]) => Promise<TaskItem[]>;
  saveNotes: (notes: NoteItem[]) => Promise<NoteItem[]>;
  onStateUpdated: (callback: (state: Partial<MochiFullState>) => void) => () => void;

  // Timers
  startTimer: (seconds: number, label?: string) => Promise<ActiveTimerState>;
  pauseTimer: () => Promise<ActiveTimerState>;
  resumeTimer: () => Promise<ActiveTimerState>;
  resetTimer: () => Promise<ActiveTimerState>;
  startPomodoro: (phase?: PomodoroPhase) => Promise<ActiveTimerState>;
  skipPomodoro: () => Promise<ActiveTimerState>;
  onTimerTick: (callback: (timer: ActiveTimerState) => void) => () => void;
  onTimerCompleted: (callback: (timer: ActiveTimerState) => void) => () => void;

  // Reminders
  snoozeWater: (minutes?: number) => Promise<void>;
  completeWater: () => Promise<void>;
  dismissWater: () => Promise<void>;
  snoozeBreak: (minutes?: number) => Promise<void>;
  startBreakTimer: () => Promise<void>;
  dismissBreak: () => Promise<void>;
  onReminderTriggered: (callback: (event: ReminderNotificationEvent) => void) => () => void;
  onAlertEvent?: (callback: (event: ReminderNotificationEvent) => void) => () => void;

  // Pet
  setPetState: (state: PetAnimationState) => Promise<void>;
  triggerPetReaction: (reaction: PetAnimationState) => Promise<void>;
  onPetStateChange: (callback: (state: PetAnimationState) => void) => () => void;
  onGazeUpdate?: (callback: (gaze: { x: number; y: number }) => void) => () => void;

  // AI Main Process Proxy
  queryAi: (prompt: string, history: any[]) => Promise<{ text: string; error?: string }>;

  // System
  onSystemActivity: (callback: (activity: SystemActivityEvent) => void) => () => void;
  showNotification: (title: string, body: string) => Promise<void>;
  getPlatform: () => Promise<'darwin' | 'win32' | 'linux'>;
  getSystemMetrics: () => Promise<SystemPerformanceMetrics>;
  quitApp: () => Promise<void>;
}

declare global {
  interface Window {
    mochiApi?: ElectronMochiAPI;
  }
}
