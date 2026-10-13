import { ReminderNotificationEvent } from '../../shared/types';
import { PersistenceService } from './persistence-service';
import { NotificationService } from './notification-service';

export type ReminderTriggerCallback = (event: ReminderNotificationEvent) => void;

export class ReminderService {
  private persistenceService: PersistenceService;
  private notificationService: NotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private activeEvent: ReminderNotificationEvent | null = null;
  private listeners: ReminderTriggerCallback[] = [];

  constructor(persistenceService: PersistenceService, notificationService: NotificationService) {
    this.persistenceService = persistenceService;
    this.notificationService = notificationService;
    this.initSchedules();
    this.startCheckLoop();
  }

  public onTrigger(cb: ReminderTriggerCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getActiveReminder(): ReminderNotificationEvent | null {
    return this.activeEvent;
  }

  private initSchedules(): void {
    const settings = this.persistenceService.getState().settings;
    const now = Date.now();

    // Init Water
    if (settings.waterReminders.enabled && !settings.waterReminders.nextDue) {
      settings.waterReminders.nextDue = now + settings.waterReminders.intervalMinutes * 60 * 1000;
    }

    // Init Break
    if (settings.breakReminders.enabled && !settings.breakReminders.nextDue) {
      settings.breakReminders.nextDue = now + settings.breakReminders.intervalMinutes * 60 * 1000;
    }

    this.persistenceService.updateSettings({
      waterReminders: settings.waterReminders,
      breakReminders: settings.breakReminders,
    });
  }

  private startCheckLoop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    // Check every 10 seconds
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 10000);
  }

  public checkReminders(): void {
    const settings = this.persistenceService.getState().settings;
    const now = Date.now();

    // If an active reminder is currently pending user action, don't spam new ones
    if (this.activeEvent) return;

    // Check Water
    if (
      settings.waterReminders.enabled &&
      settings.waterReminders.nextDue &&
      now >= settings.waterReminders.nextDue
    ) {
      this.triggerWaterReminder();
      return;
    }

    // Check Break
    if (
      settings.breakReminders.enabled &&
      settings.breakReminders.nextDue &&
      now >= settings.breakReminders.nextDue
    ) {
      this.triggerBreakReminder();
    }
  }

  private triggerWaterReminder(): void {
    const settings = this.persistenceService.getState().settings.waterReminders;
    const event: ReminderNotificationEvent = {
      type: 'water',
      title: 'Time to Hydrate! 💧',
      message: 'Mochi reminds you: Grab a glass of fresh water to keep your mind energized.',
      timestamp: Date.now(),
      dueAt: Date.now(),
      fullScreenAlert: Boolean(settings.fullScreenAlert),
    };
    this.activeEvent = event;

    this.notificationService.showNotification(event.title, event.message);
    this.listeners.forEach((cb) => cb(event));
  }

  private triggerBreakReminder(): void {
    const settings = this.persistenceService.getState().settings.breakReminders;
    const event: ReminderNotificationEvent = {
      type: 'break',
      title: 'Rest Your Eyes & Stretch! 🌿',
      message: `You have been working hard. Take a ${settings.breakDurationMinutes}-minute break to refresh.`,
      timestamp: Date.now(),
      dueAt: Date.now(),
      fullScreenAlert: Boolean(settings.fullScreenAlert),
    };
    this.activeEvent = event;

    this.notificationService.showNotification(event.title, event.message);
    this.listeners.forEach((cb) => cb(event));
  }

  public completeWater(): void {
    const settings = this.persistenceService.getState().settings.waterReminders;
    const now = Date.now();
    this.activeEvent = null;

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const isNewDay = settings.lastLoggedDate !== todayDateStr;
    const newTodayCount = isNewDay ? 1 : (settings.todayCount || 0) + 1;
    const newLoggedCount = (settings.loggedCount || 0) + 1;

    this.persistenceService.updateSettings({
      waterReminders: {
        ...settings,
        loggedCount: newLoggedCount,
        todayCount: newTodayCount,
        lastLoggedDate: todayDateStr,
        lastCompleted: now,
        nextDue: now + settings.intervalMinutes * 60 * 1000,
      },
    });
  }

  public snoozeWater(minutes = 10): void {
    const settings = this.persistenceService.getState().settings.waterReminders;
    const now = Date.now();
    this.activeEvent = null;

    this.persistenceService.updateSettings({
      waterReminders: {
        ...settings,
        nextDue: now + minutes * 60 * 1000,
      },
    });
  }

  public dismissWater(): void {
    const settings = this.persistenceService.getState().settings.waterReminders;
    const now = Date.now();
    this.activeEvent = null;

    this.persistenceService.updateSettings({
      waterReminders: {
        ...settings,
        nextDue: now + settings.intervalMinutes * 60 * 1000,
      },
    });
  }

  public dismissBreak(): void {
    const settings = this.persistenceService.getState().settings.breakReminders;
    const now = Date.now();
    this.activeEvent = null;

    this.persistenceService.updateSettings({
      breakReminders: {
        ...settings,
        nextDue: now + settings.intervalMinutes * 60 * 1000,
      },
    });
  }

  public snoozeBreak(minutes = 10): void {
    const settings = this.persistenceService.getState().settings.breakReminders;
    const now = Date.now();
    this.activeEvent = null;

    this.persistenceService.updateSettings({
      breakReminders: {
        ...settings,
        nextDue: now + minutes * 60 * 1000,
      },
    });
  }

  public resetWaterSchedule(): void {
    const settings = this.persistenceService.getState().settings.waterReminders;
    const now = Date.now();
    this.activeEvent = null;
    this.persistenceService.updateSettings({
      waterReminders: {
        ...settings,
        nextDue: now + settings.intervalMinutes * 60 * 1000,
      },
    });
  }

  public resetBreakSchedule(): void {
    const settings = this.persistenceService.getState().settings.breakReminders;
    const now = Date.now();
    this.activeEvent = null;
    this.persistenceService.updateSettings({
      breakReminders: {
        ...settings,
        nextDue: now + settings.intervalMinutes * 60 * 1000,
      },
    });
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
