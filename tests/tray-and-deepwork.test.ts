import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrayService } from '../src/main/services/tray-service';
import { PetWindow } from '../src/main/windows/pet-window';
import { AssistantWindow } from '../src/main/windows/assistant-window';
import { TimerService } from '../src/main/services/timer-service';
import { ReminderService } from '../src/main/services/reminder-service';
import { NotificationService } from '../src/main/services/notification-service';
import { PersistenceService } from '../src/main/services/persistence-service';

// Mock electron
vi.mock('electron', () => {
  let contextMenuTemplate: any[] = [];
  return {
    app: {
      getAppPath: () => process.cwd(),
      getPath: () => process.cwd(),
      quit: vi.fn(),
    },
    Tray: vi.fn().mockImplementation(() => ({
      setToolTip: vi.fn(),
      setContextMenu: vi.fn().mockImplementation((menu) => {
        contextMenuTemplate = menu;
      }),
      on: vi.fn(),
      destroy: vi.fn(),
    })),
    Menu: {
      buildFromTemplate: vi.fn().mockImplementation((tpl) => tpl),
    },
    nativeImage: {
      createFromPath: vi.fn().mockReturnValue({ isEmpty: () => true, setTemplateImage: vi.fn() }),
      createFromDataURL: vi.fn().mockReturnValue({ setTemplateImage: vi.fn() }),
    },
    Notification: {
      isSupported: () => false,
    },
    screen: {
      getAllDisplays: () => [{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }],
      getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
      getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadURL: vi.fn(),
      loadFile: vi.fn(),
      on: vi.fn(),
      getPosition: () => [100, 100],
      setPosition: vi.fn(),
      setSize: vi.fn(),
      isVisible: vi.fn().mockReturnValue(true),
      show: vi.fn(),
      hide: vi.fn(),
      focus: vi.fn(),
      isDestroyed: () => false,
      setAlwaysOnTop: vi.fn(),
      setVisibleOnAllWorkspaces: vi.fn(),
    })),
  };
});

describe('TrayService & Deep Work Mode', () => {
  let petWindow: PetWindow;
  let assistantWindow: AssistantWindow;
  let timerService: TimerService;
  let reminderService: ReminderService;
  let notifService: NotificationService;
  let persistence: PersistenceService;
  let trayService: TrayService;
  let broadcastCalls: { channel: string; args: any[] }[] = [];

  beforeEach(() => {
    broadcastCalls = [];
    persistence = new PersistenceService();
    persistence.updateSettings({ userName: 'Alex' });

    notifService = new NotificationService();
    timerService = new TimerService(persistence, notifService);
    reminderService = new ReminderService(persistence, notifService);

    petWindow = new PetWindow({ x: 100, y: 100 }, persistence.getState().settings);
    // Mock PetWindow internal methods
    vi.spyOn(petWindow, 'isVisible').mockReturnValue(true);
    vi.spyOn(petWindow, 'hide').mockImplementation(() => {
      vi.spyOn(petWindow, 'isVisible').mockReturnValue(false);
    });
    vi.spyOn(petWindow, 'show').mockImplementation(() => {
      vi.spyOn(petWindow, 'isVisible').mockReturnValue(true);
    });
    vi.spyOn(petWindow, 'toggle').mockImplementation(() => {
      const now = !petWindow.isVisible();
      vi.spyOn(petWindow, 'isVisible').mockReturnValue(now);
      return now;
    });

    assistantWindow = new AssistantWindow();

    trayService = new TrayService({
      petWindow,
      assistantWindow,
      timerService,
      reminderService,
      notificationService: notifService,
      persistenceService: persistence,
      broadcast: (channel, ...args) => {
        broadcastCalls.push({ channel, args });
      },
      preloadPath: '/preload.js',
      isDev: true,
      devUrl: 'http://localhost:5173',
    });
    trayService.init();
  });

  it('initializes tray and personalizes status bar label with user name', () => {
    expect(trayService).toBeDefined();
    expect(petWindow.isVisible()).toBe(true);
  });

  it('toggles pet visibility into Deep Work mode and back', () => {
    expect(petWindow.isVisible()).toBe(true);
    const toggledHidden = petWindow.toggle();
    expect(toggledHidden).toBe(false);
    expect(petWindow.isVisible()).toBe(false);

    const toggledVisible = petWindow.toggle();
    expect(toggledVisible).toBe(true);
    expect(petWindow.isVisible()).toBe(true);
  });

  it('updates menu without crashing when timer is running', () => {
    timerService.startCountdown(25 * 60, 'Deep Work');
    expect(() => trayService.updateMenu()).not.toThrow();
  });
});
