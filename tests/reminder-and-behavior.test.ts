import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReminderService } from '../src/main/services/reminder-service';
import { PersistenceService } from '../src/main/services/persistence-service';
import { NotificationService } from '../src/main/services/notification-service';
import { AnimationController } from '../src/renderer/engine/animation-controller';

vi.mock('electron', () => ({
  app: {
    getPath: () => process.cwd(),
  },
  Notification: {
    isSupported: () => false,
  },
}));

describe('Reminder Service & Behavior Controller', () => {
  let persistence: PersistenceService;
  let notifService: NotificationService;
  let reminderService: ReminderService;

  beforeEach(() => {
    persistence = new PersistenceService();
    notifService = new NotificationService();
    reminderService = new ReminderService(persistence, notifService);
  });

  it('triggers water reminder when due and prevents duplicates while pending', () => {
    // Force nextDue to past
    persistence.updateSettings({
      waterReminders: {
        enabled: true,
        intervalMinutes: 30,
        nextDue: Date.now() - 5000,
      },
    });

    let triggeredCount = 0;
    reminderService.onTrigger(() => {
      triggeredCount++;
    });

    reminderService.checkReminders();
    expect(triggeredCount).toBe(1);
    expect(reminderService.getActiveReminder()?.type).toBe('water');

    // Calling check again should NOT duplicate
    reminderService.checkReminders();
    expect(triggeredCount).toBe(1);

    // After snoozing, active event is cleared and nextDue is pushed forward
    reminderService.snoozeWater(15);
    expect(reminderService.getActiveReminder()).toBeNull();
  });

  it('handles animation state transitions and priority interruptions', () => {
    const anim = new AnimationController();
    expect(anim.getState()).toBe('idle');

    // Trigger temporary celebration
    anim.triggerReaction('celebrating', 100);
    expect(anim.getState()).toBe('celebrating');

    // Dragging has higher priority than celebrating
    anim.transitionTo('dragging');
    expect(anim.getState()).toBe('dragging');

    anim.destroy();
  });

  it('increments water loggedCount and todayCount on completeWater', () => {
    persistence.updateSettings({
      waterReminders: {
        enabled: true,
        intervalMinutes: 30,
        loggedCount: 2,
        todayCount: 2,
        lastLoggedDate: new Date().toISOString().slice(0, 10),
      },
    });

    reminderService.completeWater();
    const updated = persistence.getState().settings.waterReminders;
    expect(updated.loggedCount).toBe(3);
    expect(updated.todayCount).toBe(3);
    expect(updated.lastLoggedDate).toBe(new Date().toISOString().slice(0, 10));
  });

  it('triggers angry animation state properly with high priority', () => {
    const anim = new AnimationController();
    expect(anim.getState()).toBe('idle');

    anim.triggerReaction('angry', 200);
    expect(anim.getState()).toBe('angry');

    // Dragging (10) can interrupt angry (9)
    anim.transitionTo('dragging');
    expect(anim.getState()).toBe('dragging');

    anim.destroy();
  });
});
