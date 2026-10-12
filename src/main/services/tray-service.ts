import { app, Tray, Menu, nativeImage, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { PetWindow } from '../windows/pet-window';
import { AssistantWindow } from '../windows/assistant-window';
import { TimerService } from './timer-service';
import { ReminderService } from './reminder-service';
import { NotificationService } from './notification-service';
import { PersistenceService } from './persistence-service';
import { IPC_CHANNELS } from '../../shared/ipc-contracts';

// High-fidelity self-contained macOS Template Icon fallback (16x16 8-bit RGBA PNG)
const TRAY_ICON_1X_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANElEQVR4nGNgoDH4D8UkKSYWU6QZw5BhYACuUCfEp60B2JxLtAEk+51qBhBjCFGAIs30BQAOO3uFlUMB/QAAAABJRU5ErkJggg==';

export class TrayService {
  private tray: Tray | null = null;
  private petWindow: PetWindow;
  private assistantWindow: AssistantWindow;
  private timerService: TimerService;
  private reminderService: ReminderService;
  private notificationService: NotificationService;
  private persistenceService: PersistenceService;
  private broadcast: (channel: string, ...args: any[]) => void;
  private preloadPath: string;
  private isDev: boolean;
  private devUrl: string;

  constructor(options: {
    petWindow: PetWindow;
    assistantWindow: AssistantWindow;
    timerService: TimerService;
    reminderService: ReminderService;
    notificationService: NotificationService;
    persistenceService: PersistenceService;
    broadcast: (channel: string, ...args: any[]) => void;
    preloadPath: string;
    isDev: boolean;
    devUrl: string;
  }) {
    this.petWindow = options.petWindow;
    this.assistantWindow = options.assistantWindow;
    this.timerService = options.timerService;
    this.reminderService = options.reminderService;
    this.notificationService = options.notificationService;
    this.persistenceService = options.persistenceService;
    this.broadcast = options.broadcast;
    this.preloadPath = options.preloadPath;
    this.isDev = options.isDev;
    this.devUrl = options.devUrl;
  }

  public init(): void {
    const icon = this.loadTrayIcon();
    this.tray = new Tray(icon);
    this.tray.setToolTip('Mochi Desktop Companion');
    this.updateMenu();

    this.tray.on('click', () => {
      this.updateMenu();
    });
  }

  private loadTrayIcon(): Electron.NativeImage {
    const filePaths = [
      path.join(__dirname, 'assets/trayTemplate.png'),
      path.join(__dirname, '../assets/trayTemplate.png'),
      path.join(app.getAppPath(), 'build/trayTemplate.png'),
      path.join(process.cwd(), 'build/trayTemplate.png'),
    ];

    for (const p of filePaths) {
      try {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) {
          img.setTemplateImage(true);
          return img;
        }
      } catch {
        // Continue to fallback
      }
    }

    const b64Img = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_1X_B64}`);
    b64Img.setTemplateImage(true);
    return b64Img;
  }

  public updateMenu(): void {
    if (!this.tray) return;

    const isPetVisible = this.petWindow.isVisible();
    const isAssistantVisible = this.assistantWindow.isVisible();
    const state = this.persistenceService.getState();
    const userName = state.settings.userName;
    const currentTimer = this.timerService.getState();
    const isTimerRunning = currentTimer && currentTimer.status === 'running';

    const menuTemplate: MenuItemConstructorOptions[] = [
      {
        label: userName ? `Mochi (${userName}'s Pet) ✨` : 'Mochi Desktop Companion ✨',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: isPetVisible ? 'Hide Mochi (Deep Work Mode) 🧘' : 'Show Mochi on Desktop 👁️',
        click: () => {
          if (isPetVisible) {
            this.petWindow.hide();
            this.notificationService.showNotification(
              'Deep Work Mode Active 🧘',
              'Mochi is tucked away for full-screen focus. Click this status bar icon at top anytime to restore!'
            );
          } else {
            this.petWindow.show();
            this.broadcast(IPC_CHANNELS.PET_SET_STATE, 'happy');
          }
          this.updateMenu();
        },
      },
      {
        label: isAssistantVisible ? 'Close Assistant Panel' : 'Open Mochi Assistant ⚡',
        click: () => {
          this.assistantWindow.createOrToggle(
            this.petWindow.getPosition(),
            this.preloadPath,
            this.isDev,
            this.devUrl
          );
          this.updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: isTimerRunning
          ? `Timer Running: ${Math.floor(currentTimer.remainingSeconds / 60)}m left (${currentTimer.label || 'Focus'})`
          : 'Start 25m Focus Sprint (Deep Work) 🔥',
        click: () => {
          if (!isTimerRunning) {
            this.timerService.startCountdown(25 * 60, 'Deep Work');
            this.broadcast(IPC_CHANNELS.PET_SET_STATE, 'focused');
            // Auto hide pet for undisturbed deep work
            this.petWindow.hide();
            this.notificationService.showNotification(
              'Deep Work Focus Sprint (25m) 🔥',
              'Mochi is hidden for full-screen distraction-free focus. We will notify you when the sprint finishes!'
            );
            this.updateMenu();
          }
        },
      },
      {
        label: 'Drink Water 💧',
        click: () => {
          this.reminderService.completeWater();
          this.broadcast(IPC_CHANNELS.PET_SET_STATE, 'hydrated');
          setTimeout(() => {
            this.broadcast(IPC_CHANNELS.PET_SET_STATE, 'idle');
          }, 3500);
        },
      },
      {
        label: 'Take 5m Break ☕',
        click: () => {
          this.timerService.startCountdown(5 * 60, 'Mindful Break');
          this.petWindow.show();
          this.broadcast(IPC_CHANNELS.PET_SET_STATE, 'sleeping');
          this.updateMenu();
        },
      },
      { type: 'separator' },
      {
        label: 'Preferences / Settings...',
        click: () => {
          this.assistantWindow.createOrToggle(
            this.petWindow.getPosition(),
            this.preloadPath,
            this.isDev,
            this.devUrl
          );
          this.updateMenu();
        },
      },
      {
        label: 'Turn Off Mochi (Quit)',
        click: () => {
          app.quit();
        },
      },
    ];

    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    this.tray.setContextMenu(contextMenu);
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
