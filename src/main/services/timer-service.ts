import { ActiveTimerState, PomodoroPhase, PomodoroSettings } from '../../shared/types';
import { PersistenceService } from './persistence-service';
import { NotificationService } from './notification-service';

export type TimerEventCallback = (timer: ActiveTimerState) => void;
export type TimerCompleteCallback = (timer: ActiveTimerState) => void;

export class TimerService {
  private timerState: ActiveTimerState;
  private intervalId: NodeJS.Timeout | null = null;
  private persistenceService: PersistenceService;
  private notificationService: NotificationService;
  private onTickListeners: TimerEventCallback[] = [];
  private onCompleteListeners: TimerCompleteCallback[] = [];

  constructor(persistenceService: PersistenceService, notificationService: NotificationService) {
    this.persistenceService = persistenceService;
    this.notificationService = notificationService;
    const initial = persistenceService.getState().timer;
    this.timerState = { ...initial };

    // If timer was running before app relaunch, evaluate targetEndTime
    if (this.timerState.status === 'running' && this.timerState.targetEndTime) {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((this.timerState.targetEndTime - now) / 1000));
      if (remaining > 0) {
        this.timerState.remainingSeconds = remaining;
        this.startTickInterval();
      } else {
        this.timerState.remainingSeconds = 0;
        this.timerState.status = 'completed';
        this.persistenceService.updateTimer(this.timerState);
      }
    }
  }

  public onTick(cb: TimerEventCallback): () => void {
    this.onTickListeners.push(cb);
    return () => {
      this.onTickListeners = this.onTickListeners.filter((l) => l !== cb);
    };
  }

  public onComplete(cb: TimerCompleteCallback): () => void {
    this.onCompleteListeners.push(cb);
    return () => {
      this.onCompleteListeners = this.onCompleteListeners.filter((l) => l !== cb);
    };
  }

  public getState(): ActiveTimerState {
    return { ...this.timerState };
  }

  private notifyTick(): void {
    this.onTickListeners.forEach((cb) => cb(this.getState()));
  }

  private notifyComplete(): void {
    this.onCompleteListeners.forEach((cb) => cb(this.getState()));
  }

  private startTickInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  private stopTickInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    if (this.timerState.status !== 'running' || !this.timerState.targetEndTime) {
      this.stopTickInterval();
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.round((this.timerState.targetEndTime - now) / 1000));
    this.timerState.remainingSeconds = remaining;

    if (remaining <= 0) {
      this.handleTimerEnd();
    } else {
      this.notifyTick();
    }
  }

  private handleTimerEnd(): void {
    this.stopTickInterval();
    this.timerState.status = 'completed';
    this.timerState.remainingSeconds = 0;
    this.timerState.targetEndTime = null;

    if (this.timerState.mode === 'pomodoro') {
      const settings = this.persistenceService.getState().settings.pomodoro;
      if (this.timerState.pomodoroPhase === 'focus') {
        const newCompleted = (settings.completedSessions || 0) + 1;
        this.persistenceService.updateSettings({
          pomodoro: {
            ...settings,
            completedSessions: newCompleted,
          },
        });

        this.notificationService.showNotification(
          'Mochi Pomodoro Finished! 🎉',
          `Awesome focus session completed! Total finished: ${newCompleted}. Take a break.`
        );

        if (settings.autoTransition) {
          // 4th session -> long break, else short break
          const nextPhase: PomodoroPhase = newCompleted % 4 === 0 ? 'long-break' : 'short-break';
          this.notifyComplete();
          this.startPomodoro(nextPhase);
          return;
        }
      } else {
        this.notificationService.showNotification(
          'Break Over! ⚡',
          'Break time is over. Ready to focus again?'
        );
      }
    } else {
      this.notificationService.showNotification(
        'Timer Complete! ⏰',
        `Your timer "${this.timerState.label || 'Countdown'}" has finished!`
      );
    }

    this.persistenceService.updateTimer(this.timerState);
    this.notifyTick();
    this.notifyComplete();
  }

  public startCountdown(seconds: number, label = 'Countdown'): ActiveTimerState {
    this.stopTickInterval();
    const now = Date.now();
    this.timerState = {
      mode: 'countdown',
      pomodoroPhase: 'idle',
      status: 'running',
      startedAt: now,
      totalDurationSeconds: seconds,
      remainingSeconds: seconds,
      pausedRemainingSeconds: 0,
      targetEndTime: now + seconds * 1000,
      label,
    };

    this.persistenceService.updateTimer(this.timerState);
    this.startTickInterval();
    this.notifyTick();
    return this.getState();
  }

  public startPomodoro(phase: PomodoroPhase = 'focus'): ActiveTimerState {
    this.stopTickInterval();
    const settings = this.persistenceService.getState().settings.pomodoro;
    let durationMinutes = settings.focusMinutes;
    let label = 'Focus Session';

    if (phase === 'short-break') {
      durationMinutes = settings.shortBreakMinutes;
      label = 'Short Break';
    } else if (phase === 'long-break') {
      durationMinutes = settings.longBreakMinutes;
      label = 'Long Rest Break';
    }

    const seconds = durationMinutes * 60;
    const now = Date.now();

    this.timerState = {
      mode: 'pomodoro',
      pomodoroPhase: phase,
      status: 'running',
      startedAt: now,
      totalDurationSeconds: seconds,
      remainingSeconds: seconds,
      pausedRemainingSeconds: 0,
      targetEndTime: now + seconds * 1000,
      label,
    };

    this.persistenceService.updateTimer(this.timerState);
    this.startTickInterval();
    this.notifyTick();
    return this.getState();
  }

  public pause(): ActiveTimerState {
    if (this.timerState.status !== 'running') return this.getState();
    this.stopTickInterval();

    const remaining = this.timerState.targetEndTime
      ? Math.max(0, Math.round((this.timerState.targetEndTime - Date.now()) / 1000))
      : this.timerState.remainingSeconds;

    this.timerState.status = 'paused';
    this.timerState.pausedRemainingSeconds = remaining;
    this.timerState.remainingSeconds = remaining;
    this.timerState.targetEndTime = null;

    this.persistenceService.updateTimer(this.timerState);
    this.notifyTick();
    return this.getState();
  }

  public resume(): ActiveTimerState {
    if (this.timerState.status !== 'paused' || this.timerState.pausedRemainingSeconds <= 0) {
      return this.getState();
    }

    const now = Date.now();
    this.timerState.status = 'running';
    this.timerState.targetEndTime = now + this.timerState.pausedRemainingSeconds * 1000;
    this.timerState.remainingSeconds = this.timerState.pausedRemainingSeconds;
    this.timerState.pausedRemainingSeconds = 0;

    this.persistenceService.updateTimer(this.timerState);
    this.startTickInterval();
    this.notifyTick();
    return this.getState();
  }

  public reset(): ActiveTimerState {
    this.stopTickInterval();
    this.timerState = {
      mode: 'none',
      pomodoroPhase: 'idle',
      status: 'stopped',
      targetEndTime: null,
      pausedRemainingSeconds: 0,
      totalDurationSeconds: 0,
      remainingSeconds: 0,
      label: '',
      startedAt: null,
    };

    this.persistenceService.updateTimer(this.timerState);
    this.notifyTick();
    return this.getState();
  }

  public skipPomodoro(): ActiveTimerState {
    if (this.timerState.mode !== 'pomodoro') return this.getState();
    const nextPhase: PomodoroPhase =
      this.timerState.pomodoroPhase === 'focus' ? 'short-break' : 'focus';
    return this.startPomodoro(nextPhase);
  }
}
