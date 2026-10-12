export type PetAnimationState =
  | 'idle'
  | 'blink'
  | 'curious'
  | 'happy'
  | 'smile'
  | 'sad'
  | 'hydrated'
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

export type AppActivityCategory =
  | 'development'
  | 'design'
  | 'browser'
  | 'communication'
  | 'productivity'
  | 'entertainment'
  | 'idle'
  | 'system';

export interface SystemActivityEvent {
  appName: string;
  category: AppActivityCategory;
  state: PetAnimationState;
  title: string;
  subtitle: string;
  timestamp: number;
  isTyping?: boolean;
  typingBurst?: boolean;
}

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
  encryptedApiKey?: string;
  apiEndpoint?: string;
  model?: string;
  temperature?: number;
}

export interface AppSettings {
  userName?: string; // personalized user name (e.g. "Lakshan")
  hasSeenWelcome?: boolean; // whether first-time cinematic welcome was completed
  petSize: number; // 70 - 240 px (default 115)
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

export type ChatActionType =
  | 'start_timer'
  | 'start_pomodoro'
  | 'pause_timer'
  | 'resume_timer'
  | 'reset_timer'
  | 'set_water_reminder'
  | 'set_break_reminder'
  | 'create_task'
  | 'clear_completed_tasks'
  | 'add_note'
  | 'pet_mood'
  | 'view_tab';

export interface ChatSuggestedAction {
  type: ChatActionType;
  label: string;
  payload?: any;
  autoExecuted?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mochi' | 'system';
  text: string;
  timestamp: number;
  suggestedAction?: ChatSuggestedAction;
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

export interface SystemPerformanceMetrics {
  totalRamMB: number;
  mainProcessRamMB: number;
  rendererRamMB: number;
  gpuRamMB: number;
  cpuPercent: number;
  fps: number;
  uptimeSeconds: number;
  leakWatchdogStatus: 'clean' | 'nominal';
}
