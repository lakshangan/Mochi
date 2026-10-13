import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { AppSettings, PetPosition } from '../../shared/types';
import { PlatformAdapter } from '../platform/platform-adapter';

export class PetWindow {
  private window: BrowserWindow | null = null;
  private currentPosition: PetPosition;
  private petSize: number;

  constructor(initialPosition: PetPosition, settings: AppSettings) {
    this.currentPosition = initialPosition;
    this.petSize = settings.petSize || 115;
  }

  public create(preloadPath: string, isDev: boolean, devUrl: string): BrowserWindow {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    const bounds = primaryDisplay.workArea;

    // Boundary check initial position
    let x = this.currentPosition.x;
    let y = this.currentPosition.y;

    if (x < bounds.x || x > bounds.x + bounds.width - this.petSize) {
      x = bounds.x + bounds.width - this.petSize - 50;
    }
    if (y < bounds.y || y > bounds.y + bounds.height - this.petSize) {
      y = bounds.y + bounds.height - this.petSize - 50;
    }
    this.currentPosition = { x, y };

    const windowW = Math.max(300, this.petSize + 130);
    const windowH = Math.max(170, this.petSize + 90);

    const iconPath = path.join(__dirname, '../assets/trayIcon.png');

    this.window = new BrowserWindow({
      width: windowW,
      height: windowH,
      x,
      y,
      transparent: true,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      icon: iconPath,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true,
        backgroundThrottling: false, // keep pet smooth
      },
    });

    PlatformAdapter.configureWindowForPlatform(this.window, true);

    if (PlatformAdapter.isMac()) {
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      this.window.setAlwaysOnTop(true, 'floating');
    }

    if (isDev) {
      this.window.loadURL(`${devUrl}#pet`);
    } else {
      const prodPath = path.join(__dirname, '../renderer/index.html');
      this.window.loadFile(prodPath, { hash: 'pet' });
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public getPosition(): PetPosition {
    if (this.window && !this.window.isDestroyed()) {
      const [x, y] = this.window.getPosition();
      this.currentPosition = { x, y };
    }
    return this.currentPosition;
  }

  public setPosition(pos: PetPosition): void {
    if (this.window && !this.window.isDestroyed()) {
      this.currentPosition = pos;
      this.window.setPosition(Math.round(pos.x), Math.round(pos.y));
    }
  }

  public moveBy(deltaX: number, deltaY: number): void {
    if (this.window && !this.window.isDestroyed()) {
      const [x, y] = this.window.getPosition();
      const newX = Math.round(x + deltaX);
      const newY = Math.round(y + deltaY);
      this.window.setPosition(newX, newY);
      this.currentPosition = { x: newX, y: newY };
    }
  }

  public resize(size: number): void {
    this.petSize = size;
    if (this.window && !this.window.isDestroyed()) {
      const windowW = Math.max(260, size + 100);
      const windowH = Math.max(160, size + 85);
      this.window.setSize(windowW, windowH);
    }
  }

  public setAlwaysOnTop(val: boolean): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setAlwaysOnTop(val, val ? 'floating' : 'normal');
    }
  }

  public isVisible(): boolean {
    return !!(this.window && !this.window.isDestroyed() && this.window.isVisible());
  }

  public hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }

  public show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
    }
  }

  public toggle(): boolean {
    if (this.isVisible()) {
      this.hide();
      return false;
    } else {
      this.show();
      return true;
    }
  }
}
