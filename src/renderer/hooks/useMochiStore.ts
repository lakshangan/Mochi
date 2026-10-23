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
  PetGamificationState,
  GitCompanionEvent,
  GitStatusState,
} from '../../shared/types';
import { SoundEffects } from '../../shared/sound-effects';

export const LEVEL_TITLES = [
  'Baby Blob',
  'Curious Sprite',
  'Flow Apprentice',
  'Deep Work Wizard',
  'Cosmic Flow Master',
];

export const calculateLevelInfo = (xp: number = 0) => {
  const level = Math.min(5, Math.floor(xp / 150) + 1);
  const title = LEVEL_TITLES[level - 1] || 'Cosmic Flow Master';
  const currentLevelBaseXp = (level - 1) * 150;
  const nextLevelXp = level * 150;
  const progressPercent = Math.min(100, Math.round(((xp - currentLevelBaseXp) / 150) * 100));
  return { level, title, progressPercent, nextLevelXp };
};

const DEFAULT_GAMIFICATION: PetGamificationState = {
  xp: 0,
  level: 1,
  title: 'Baby Blob',
  pettingCount: 0,
  treatsFed: 0,
  streakDays: 1,
};

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
    gamification: DEFAULT_GAMIFICATION,
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
  gamification: DEFAULT_GAMIFICATION,
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

      const unsubGit = window.mochiApi.onGitEvent
        ? window.mochiApi.onGitEvent((ev: any) => {
            setLastGitEvent(ev);
            refreshGitStatus();
            if (ev.type === 'commit') {
              addXp(75);
              if (state.settings.soundEnabled) {
                SoundEffects.gitCommit(state.settings.soundVolume);
              }
            } else if (ev.type === 'push') {
              addXp(100);
              if (state.settings.soundEnabled) {
                SoundEffects.celebrate(state.settings.soundVolume);
              }
            }
          })
        : () => {};

      return () => {
        unsubTimerTick();
        unsubTimerComp();
        unsubReminder();
        unsubState();
        unsubPetState();
        unsubGit();
      };
    }
  }, [state.settings.soundEnabled, state.settings.soundVolume]);

  const [gitStatus, setGitStatus] = useState<GitStatusState | null>(null);
  const [lastGitEvent, setLastGitEvent] = useState<GitCompanionEvent | null>(null);

  // Sync theme attribute to HTML
  useEffect(() => {
    const theme = state.settings.theme || 'neon-dark';
    document.documentElement.setAttribute('data-theme', theme);
  }, [state.settings.theme]);

  // Fetch initial Git status
  const refreshGitStatus = useCallback(async () => {
    if (window.mochiApi?.getGitStatus) {
      try {
        const status = await window.mochiApi.getGitStatus();
        setGitStatus(status);
      } catch {
        // fallback
      }
    }
  }, []);

  useEffect(() => {
    refreshGitStatus();
  }, [refreshGitStatus]);

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

  const addXp = useCallback((amount: number) => {
    setState((prev) => {
      const curGam = prev.settings.gamification || DEFAULT_GAMIFICATION;
      const newXp = curGam.xp + amount;
      const { level, title } = calculateLevelInfo(newXp);
      const leveledUp = level > curGam.level;

      if (leveledUp && prev.settings.soundEnabled) {
        SoundEffects.celebrate(prev.settings.soundVolume);
      }

      const updatedGam: PetGamificationState = {
        ...curGam,
        xp: newXp,
        level,
        title,
      };

      const updatedSettings = {
        ...prev.settings,
        gamification: updatedGam,
      };

      if (window.mochiApi) {
        window.mochiApi.saveSettings({ gamification: updatedGam });
      }

      return {
        ...prev,
        settings: updatedSettings,
        gamification: updatedGam,
      };
    });
  }, []);

  const feedTreat = useCallback(
    (treat: 'espresso' | 'cookie' | 'water') => {
      if (treat === 'espresso') {
        SoundEffects.treatEat(state.settings.soundVolume);
        addXp(25);
        setPetState('fire');
      } else if (treat === 'cookie') {
        SoundEffects.treatEat(state.settings.soundVolume);
        addXp(20);
        setPetState('happy');
      } else if (treat === 'water') {
        if (window.mochiApi) {
          window.mochiApi.completeWater();
        }
        SoundEffects.waterDrop(state.settings.soundVolume);
        addXp(30);
        setPetState('hydrated');
      }
      setState((prev) => {
        const curGam = prev.settings.gamification || DEFAULT_GAMIFICATION;
        const updatedGam = { ...curGam, treatsFed: (curGam.treatsFed || 0) + 1 };
        if (window.mochiApi) {
          window.mochiApi.saveSettings({ gamification: updatedGam });
        }
        return {
          ...prev,
          settings: { ...prev.settings, gamification: updatedGam },
        };
      });
    },
    [addXp, setPetState, state.settings.soundVolume]
  );

  const recordPetting = useCallback(() => {
    SoundEffects.purr(state.settings.soundVolume);
    addXp(5);
    setState((prev) => {
      const curGam = prev.settings.gamification || DEFAULT_GAMIFICATION;
      const updatedGam = { ...curGam, pettingCount: (curGam.pettingCount || 0) + 1 };
      if (window.mochiApi) {
        window.mochiApi.saveSettings({ gamification: updatedGam });
      }
      return {
        ...prev,
        settings: { ...prev.settings, gamification: updatedGam },
      };
    });
  }, [addXp, state.settings.soundVolume]);

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
      if (justCompleted) {
        addXp(30);
        if (state.settings.soundEnabled) {
          SoundEffects.celebrate(state.settings.soundVolume);
        }
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
    addXp,
    feedTreat,
    recordPetting,
    gitStatus,
    lastGitEvent,
    refreshGitStatus,
  };
}
