import { app, Tray, Menu, nativeImage, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import { PetWindow } from '../windows/pet-window';
import { AssistantWindow } from '../windows/assistant-window';
import { TimerService } from './timer-service';
import { ReminderService } from './reminder-service';
import { NotificationService } from './notification-service';
import { PersistenceService } from './persistence-service';
import { IPC_CHANNELS } from '../../shared/ipc-contracts';

// Genuine Apple macOS Template Icons (Monochrome alpha stencil for Dark/Light menu bar)
const TRAY_ICON_1X_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAqElEQVR4nGNgoCPQBmJ7KE2W5l1A/B8L3kWsoTVQDQ+BOB2IpaDiUlD+Q6h8DTGGNBCwrAGfYdpEGoJuGIY3QX5/SKQhMPAQqg8FgExPR+IfAeJ5aGrmQcVhIB2qDw5g3pJCEkNRgENMigHNe/ZYFP0nQcyekIsIGYThIpgi5DDqBuIcNINyoOIwgBFGIEC1WKNaOgIBqqRsdMMoymswQJXcj81QguURAKJcSvXWMGq9AAAAAElFTkSuQmCC';

const TRAY_ICON_2X_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAABh0lEQVR4nO1YMY7CQAzcNtWVNEg8IS1PoKKn5AGIMl/gAdciHnCfSJ0qTZp7AQ+IaO92JVuas+J4IYlkiRvJQsqO7cE43l1C+MebYB2tilZH66P9gPX0vCLeothH64QAyzrymxXpmzZKwjbaV7QbfbYKrwkzVewwEDwlLw2/knjS9zBFzEkESxUonoxRkB/GOb0iRlbm+EoQwDFMqNRaOO8mimHsRNzsnsIGnloZCaxUk+OwD397ZglgT5kjAefMsw2ciwJydGNE7J3bQmIYOBLUXqqANDRnPqLdaf1qJLwS705+EiXkqrQgNZCG8Anrj2grhbcC3jf5DYE5tSaIN8pWWecy8xjYKLwNiEm4KDzeZnpNkPV24e/+yBDEorR+xLdtVJAWQO5NOYJy440KyqnQHILMCuX20FyCzB6qDcVnkWgMyDsbnFoLYs0h5qRSbw1BW+JpMyZrDrmb1Amu9rIEd7t9gqvzUIK7E2OCqzM1w9Wtg+HqXsZwdXNFuLnbS7j59+P98AsIiSD3F0VT2QAAAABJRU5ErkJggg==';

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
    const candidateDirs = [
      path.join(__dirname, 'assets'),
      path.join(__dirname, '../assets'),
      path.join(app.getAppPath(), 'dist/main/assets'),
      path.join(app.getAppPath(), 'src/main/assets'),
      path.join(app.getAppPath(), 'build'),
      path.join(process.cwd(), 'dist/main/assets'),
      path.join(process.cwd(), 'src/main/assets'),
      path.join(process.cwd(), 'build'),
    ];

    for (const dir of candidateDirs) {
      const templatePath = path.join(dir, 'trayTemplate.png');
      try {
        if (fs.existsSync(templatePath)) {
          const img = nativeImage.createFromPath(templatePath);
          if (!img.isEmpty()) {
            img.setTemplateImage(true);
            return img;
          }
        }
      } catch {
        // Continue searching
      }
    }

    // High-resolution Retina in-memory template image fallback
    try {
      const img2x = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_2X_B64}`);
      if (!img2x.isEmpty()) {
        const resized = img2x.resize({ width: 18, height: 18 });
        resized.setTemplateImage(true);
        return resized;
      }
    } catch {
      // Fallback
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
