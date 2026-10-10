import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimerService } from '../src/main/services/timer-service';
import { PersistenceService } from '../src/main/services/persistence-service';
import { NotificationService } from '../src/main/services/notification-service';

// Mock electron app getPath and Notification
vi.mock('electron', () => ({
  app: {
    getPath: () => process.cwd(),
  },
  Notification: {
    isSupported: () => false,
  },
}));

describe('Timer Service & Recovery Engine', () => {
  let persistence: PersistenceService;
  let notifService: NotificationService;
  let timerService: TimerService;

  beforeEach(() => {
    persistence = new PersistenceService();
    notifService = new NotificationService();
    timerService = new TimerService(persistence, notifService);
    timerService.reset();
  });

  it('starts countdown timer and sets accurate targetEndTime', () => {
    const timer = timerService.startCountdown(60, 'Test Timer');
    expect(timer.status).toBe('running');
    expect(timer.remainingSeconds).toBe(60);
    expect(timer.targetEndTime).toBeGreaterThan(Date.now());
    expect(timer.label).toBe('Test Timer');
  });

  it('pauses and resumes without losing remaining duration', () => {
    timerService.startCountdown(300, 'Work');
    const paused = timerService.pause();
    expect(paused.status).toBe('paused');
    expect(paused.pausedRemainingSeconds).toBeGreaterThan(0);
    expect(paused.targetEndTime).toBeNull();

    const resumed = timerService.resume();
    expect(resumed.status).toBe('running');
    expect(resumed.targetEndTime).toBeGreaterThan(Date.now());
  });

  it('resets timer to clean idle state', () => {
    timerService.startCountdown(120);
    const resetState = timerService.reset();
    expect(resetState.status).toBe('stopped');
    expect(resetState.mode).toBe('none');
    expect(resetState.remainingSeconds).toBe(0);
  });

  it('starts pomodoro and tracks phase correctly', () => {
    const focusState = timerService.startPomodoro('focus');
    expect(focusState.mode).toBe('pomodoro');
    expect(focusState.pomodoroPhase).toBe('focus');
    expect(focusState.totalDurationSeconds).toBe(25 * 60);

    const breakState = timerService.skipPomodoro();
    expect(breakState.pomodoroPhase).toBe('short-break');
    expect(breakState.totalDurationSeconds).toBe(5 * 60);
  });

  it('recovers running timer from target timestamp upon app restart', () => {
    // Simulate timer running that was scheduled to end in 100 seconds
    const futureEndTime = Date.now() + 100 * 1000;
    persistence.updateTimer({
      mode: 'countdown',
      pomodoroPhase: 'idle',
      status: 'running',
      targetEndTime: futureEndTime,
      pausedRemainingSeconds: 0,
      totalDurationSeconds: 100,
      remainingSeconds: 100,
      label: 'Pre-shutdown Timer',
      startedAt: Date.now() - 5000,
    });

    // Instantiate fresh TimerService simulating app reboot
    const rebootedTimerService = new TimerService(persistence, notifService);
    const state = rebootedTimerService.getState();

    expect(state.status).toBe('running');
    expect(state.remainingSeconds).toBeGreaterThan(90);
    expect(state.remainingSeconds).toBeLessThanOrEqual(100);
    expect(state.label).toBe('Pre-shutdown Timer');
  });
});
