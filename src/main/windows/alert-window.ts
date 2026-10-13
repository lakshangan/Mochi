import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { ReminderNotificationEvent } from '../../shared/types';
import { PlatformAdapter } from '../platform/platform-adapter';

export class AlertWindow {
  private window: BrowserWindow | null = null;
  private currentEvent: ReminderNotificationEvent | null = null;

  public show(
    event: ReminderNotificationEvent,
    preloadPath: string,
    isDev: boolean,
    devUrl: string
  ): void {
    this.currentEvent = event;

    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('alert:event', event);
      this.window.show();
      this.window.focus();
      return;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height, x, y } = primaryDisplay.bounds;

    this.window = new BrowserWindow({
      width,
      height,
      x,
      y,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      hasShadow: false,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true,
      },
    });

    PlatformAdapter.configureWindowForPlatform(this.window, true);

    if (PlatformAdapter.isMac()) {
      this.window.setAlwaysOnTop(true, 'screen-saver');
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    }

    if (isDev) {
      this.window.loadURL(`${devUrl}#fullscreen-alert`);
    } else {
      const prodPath = path.join(__dirname, '../renderer/index.html');
      this.window.loadFile(prodPath, { hash: 'fullscreen-alert' });
    }

    this.window.webContents.once('did-finish-load', () => {
      if (this.currentEvent && this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('alert:event', this.currentEvent);
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    this.window.show();
    this.window.focus();
  }

  public close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }
}
