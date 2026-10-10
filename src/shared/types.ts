export type PetAnimationState =
  | 'idle'
  | 'blink'
  | 'curious'
  | 'happy'
  | 'walking'
  | 'sleeping'
  | 'waking'
  | 'thinking'
  | 'working'
  | 'reminding'
  | 'celebrating'
  | 'dragging'
  | 'typing'
  | 'listening'
  | 'coding'
  | 'focused';

export type PomodoroPhase = 'focus' | 'short-break' | 'long-break' | 'idle';

export interface PetPosition {
  x: number;
  y: number;
}

export interface WaterReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // default 45 min
  lastCompleted?: number;
  nextDue?: number;
}

export interface BreakReminderSettings {
  enabled: boolean;
  intervalMinutes: number; // default 60 min
  breakDurationMinutes: number; // default 5 min
  lastCompleted?: number;
  nextDue?: number;
}

export interface PomodoroSettings {
  focusMinutes: number; // default 25
  shortBreakMinutes: number; // default 5
  longBreakMinutes: number; // default 15
  autoTransition: boolean;
  completedSessions: number;
}

export interface AiSettings {
  provider: 'offline-local' | 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  temperature?: number;
}

export interface AppSettings {
  petSize: number; // 120 - 320 px (default 180)
  opacity: number; // 0.3 - 1.0 (default 0.98)
  animationIntensity: 'subtle' | 'normal' | 'vibrant';
  alwaysOnTop: boolean;
  autoWander: boolean;
  wanderIntervalSeconds: number; // default 45
  movementSpeed: number; // 0.5 - 2.0 (default 1.0)
  reducedMotion: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0 (default 0.7)
  launchAtLogin: boolean;
  activityAwareness: boolean;
  waterReminders: WaterReminderSettings;
  breakReminders: BreakReminderSettings;
  pomodoro: PomodoroSettings;
  ai: AiSettings;
  theme: 'neon-dark' | 'glass-midnight' | 'deep-space';
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface ActiveTimerState {
  mode: 'countdown' | 'pomodoro' | 'none';
  pomodoroPhase: PomodoroPhase;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  targetEndTime: number | null; // epoch ms (used for accurate clock & recovery)
  pausedRemainingSeconds: number; // stored when paused
  totalDurationSeconds: number;
  remainingSeconds: number;
  label: string;
  startedAt: number | null;
}

export interface ReminderNotificationEvent {
  type: 'water' | 'break';
  title: string;
  message: string;
  timestamp: number;
  dueAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mochi' | 'system';
  text: string;
  timestamp: number;
  suggestedAction?: {
    type: 'start_timer' | 'create_task' | 'add_note' | 'pet_mood';
    label: string;
    payload: any;
  };
}

export interface ParsedCommandResult {
  action:
    | 'timer_start'
    | 'timer_pause'
    | 'timer_resume'
    | 'timer_reset'
    | 'pomodoro_start'
    | 'water_reminder_set'
    | 'break_reminder_set'
    | 'task_add'
    | 'task_list'
    | 'task_clear_completed'
    | 'note_add'
    | 'pet_state'
    | 'help'
    | 'unknown';
  payload?: any;
  feedback: string;
  confidence: number;
}

export interface MochiFullState {
  settings: AppSettings;
  position: PetPosition;
  tasks: TaskItem[];
  notes: NoteItem[];
  timer: ActiveTimerState;
  activeReminder: ReminderNotificationEvent | null;
  petState: PetAnimationState;
}
