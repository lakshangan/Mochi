import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppSettings,
  MochiFullState,
  PetAnimationState,
  TaskItem,
  NoteItem,
  ActiveTimerState,
  ReminderNotificationEvent,
  ChatMessage,
  PomodoroPhase,
} from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';

const DEFAULT_STATE: MochiFullState = {
  settings: {
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
  },
  position: { x: 300, y: 300 },
  tasks: [],
  notes: [],
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

export function useMochiStore() {
  const [state, setState] = useState<MochiFullState>(DEFAULT_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'mochi',
      text: 'Hi there! I am Mochi, your desktop companion orb. Click any shortcut below or give me a command like "Start a 25-minute timer" or "Remind me to drink water". ✨',
      timestamp: Date.now(),
    },
  ]);
  const isLoaded = useRef(false);

  // Initialize from electron main process
  useEffect(() => {
    if (window.mochiApi) {
      window.mochiApi.getInitialState().then((initial) => {
        setState((prev) => ({
          ...prev,
          ...initial,
        }));
        isLoaded.current = true;
      });

      const unsubTimerTick = window.mochiApi.onTimerTick((timer) => {
        setState((prev) => ({ ...prev, timer }));
      });

      const unsubTimerComp = window.mochiApi.onTimerCompleted((timer) => {
        setState((prev) => ({ ...prev, timer, petState: 'celebrating' }));
        if (state.settings.soundEnabled) {
          SoundEffects.timerComplete(state.settings.soundVolume);
        }
      });

      const unsubReminder = window.mochiApi.onReminderTriggered((reminder) => {
        setState((prev) => ({ ...prev, activeReminder: reminder, petState: 'reminding' }));
        if (state.settings.soundEnabled) {
          if (reminder.type === 'water') {
            SoundEffects.waterDrop(state.settings.soundVolume);
          } else {
            SoundEffects.breakChime(state.settings.soundVolume);
          }
        }
      });

      const unsubState = window.mochiApi.onStateUpdated((partial) => {
        setState((prev) => ({ ...prev, ...partial }));
      });

      const unsubPetState = window.mochiApi.onPetStateChange((petState) => {
        setState((prev) => ({ ...prev, petState }));
      });

      return () => {
        unsubTimerTick();
        unsubTimerComp();
        unsubReminder();
        unsubState();
        unsubPetState();
      };
    }
  }, [state.settings.soundEnabled, state.settings.soundVolume]);

  // Actions
  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
    if (window.mochiApi) {
      await window.mochiApi.saveSettings(partial);
    }
  }, []);

  const setPetState = useCallback(async (petState: PetAnimationState) => {
    setState((prev) => ({ ...prev, petState }));
    if (window.mochiApi) {
      await window.mochiApi.setPetState(petState);
    }
  }, []);

  // Timer actions
  const startTimer = useCallback(
    async (seconds: number, label?: string) => {
      if (window.mochiApi) {
        const timer = await window.mochiApi.startTimer(seconds, label);
        setState((prev) => ({ ...prev, timer }));
      }
      if (state.settings.soundEnabled) {
        SoundEffects.chirp(state.settings.soundVolume);
      }
    },
    [state.settings.soundEnabled, state.settings.soundVolume]
  );

  const pauseTimer = useCallback(async () => {
    if (window.mochiApi) {
      const timer = await window.mochiApi.pauseTimer();
      setState((prev) => ({ ...prev, timer }));
    }
  }, []);

  const resumeTimer = useCallback(async () => {
    if (window.mochiApi) {
      const timer = await window.mochiApi.resumeTimer();
      setState((prev) => ({ ...prev, timer }));
    }
  }, []);

  const resetTimer = useCallback(async () => {
    if (window.mochiApi) {
      const timer = await window.mochiApi.resetTimer();
      setState((prev) => ({ ...prev, timer }));
    }
  }, []);

  const startPomodoro = useCallback(
    async (phase: PomodoroPhase = 'focus') => {
      if (window.mochiApi) {
        const timer = await window.mochiApi.startPomodoro(phase);
        setState((prev) => ({ ...prev, timer }));
      }
      if (state.settings.soundEnabled) {
        SoundEffects.chirp(state.settings.soundVolume);
      }
    },
    [state.settings.soundEnabled, state.settings.soundVolume]
  );

  const skipPomodoro = useCallback(async () => {
    if (window.mochiApi) {
      const timer = await window.mochiApi.skipPomodoro();
      setState((prev) => ({ ...prev, timer }));
    }
  }, []);

  // Reminder actions
  const snoozeWater = useCallback(async (minutes = 10) => {
    setState((prev) => ({ ...prev, activeReminder: null }));
    if (window.mochiApi) {
      await window.mochiApi.snoozeWater(minutes);
    }
  }, []);

  const completeWater = useCallback(async () => {
    setState((prev) => ({ ...prev, activeReminder: null, petState: 'hydrated' }));
    if (state.settings.soundEnabled) {
      SoundEffects.waterDrop(state.settings.soundVolume);
    }
    if (window.mochiApi) {
      await window.mochiApi.completeWater();
      await window.mochiApi.triggerPetReaction('hydrated');
    }
  }, [state.settings.soundEnabled, state.settings.soundVolume]);

  const dismissWater = useCallback(async () => {
    setState((prev) => ({ ...prev, activeReminder: null }));
    if (window.mochiApi) {
      await window.mochiApi.dismissWater();
    }
  }, []);

  const snoozeBreak = useCallback(async (minutes = 10) => {
    setState((prev) => ({ ...prev, activeReminder: null }));
    if (window.mochiApi) {
      await window.mochiApi.snoozeBreak(minutes);
    }
  }, []);

  const startBreakTimer = useCallback(async () => {
    setState((prev) => ({ ...prev, activeReminder: null }));
    if (window.mochiApi) {
      await window.mochiApi.startBreakTimer();
    }
  }, []);

  const dismissBreak = useCallback(async () => {
    setState((prev) => ({ ...prev, activeReminder: null }));
    if (window.mochiApi) {
      await window.mochiApi.dismissBreak();
    }
  }, []);

  // Tasks
  const addTask = useCallback(
    async (title: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        completed: false,
        createdAt: Date.now(),
        priority,
      };
      const updated = [newTask, ...state.tasks];
      setState((prev) => ({ ...prev, tasks: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveTasks(updated);
      }
      return newTask;
    },
    [state.tasks]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const updated = state.tasks.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined }
          : t
      );
      setState((prev) => ({ ...prev, tasks: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveTasks(updated);
      }
      const justCompleted = updated.find((t) => t.id === id)?.completed;
      if (justCompleted && state.settings.soundEnabled) {
        SoundEffects.celebrate(state.settings.soundVolume);
      }
    },
    [state.tasks, state.settings.soundEnabled, state.settings.soundVolume]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const updated = state.tasks.filter((t) => t.id !== id);
      setState((prev) => ({ ...prev, tasks: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveTasks(updated);
      }
    },
    [state.tasks]
  );

  const clearCompletedTasks = useCallback(async () => {
    const updated = state.tasks.filter((t) => !t.completed);
    setState((prev) => ({ ...prev, tasks: updated }));
    if (window.mochiApi) {
      await window.mochiApi.saveTasks(updated);
    }
  }, [state.tasks]);

  // Notes
  const addNote = useCallback(
    async (title: string, content: string, color = '#4facfe') => {
      const newNote: NoteItem = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: title || 'Quick Note',
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        color,
      };
      const updated = [newNote, ...state.notes];
      setState((prev) => ({ ...prev, notes: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveNotes(updated);
      }
      return newNote;
    },
    [state.notes]
  );

  const updateNote = useCallback(
    async (id: string, partial: Partial<NoteItem>) => {
      const updated = state.notes.map((n) =>
        n.id === id ? { ...n, ...partial, updatedAt: Date.now() } : n
      );
      setState((prev) => ({ ...prev, notes: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveNotes(updated);
      }
    },
    [state.notes]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const updated = state.notes.filter((n) => n.id !== id);
      setState((prev) => ({ ...prev, notes: updated }));
      if (window.mochiApi) {
        await window.mochiApi.saveNotes(updated);
      }
    },
    [state.notes]
  );

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const fullMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, fullMsg]);
  }, []);

  return {
    state,
    messages,
    addMessage,
    updateSettings,
    setPetState,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    startPomodoro,
    skipPomodoro,
    snoozeWater,
    completeWater,
    dismissWater,
    snoozeBreak,
    startBreakTimer,
    dismissBreak,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks,
    addNote,
    updateNote,
    deleteNote,
  };
}
