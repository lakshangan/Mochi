import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { PetPosition } from '../../shared/types';
import { PlatformAdapter } from '../platform/platform-adapter';

export class AssistantWindow {
  private window: BrowserWindow | null = null;
  private width = 440;
  private height = 660;

  public createOrToggle(
    petPosition: PetPosition,
    preloadPath: string,
    isDev: boolean,
    devUrl: string
  ): boolean {
    if (this.window && !this.window.isDestroyed()) {
      if (this.window.isVisible()) {
        this.window.hide();
        return false;
      } else {
        this.repositionNearPet(petPosition);
        this.window.show();
        this.window.focus();
        return true;
      }
    }

    const { x, y } = this.calculatePositionNearPet(petPosition);

    const iconPath = path.join(__dirname, '../assets/mochi-logo.png');

    this.window = new BrowserWindow({
      title: '',
      width: this.width,
      height: this.height,
      x,
      y,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      resizable: true,
      minWidth: 380,
      minHeight: 520,
      alwaysOnTop: true,
      hasShadow: true,
      thickFrame: false,
      roundedCorners: false,
      icon: iconPath,
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
      this.window.setVibrancy('under-window');
    }

    if (isDev) {
      this.window.loadURL(`${devUrl}#assistant`);
    } else {
      const prodPath = path.join(__dirname, '../renderer/index.html');
      this.window.loadFile(prodPath, { hash: 'assistant' });
    }

    this.window.on('closed', () => {
      this.window = null;
    });

    return true;
  }

  public hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }

  public show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
    }
  }

  public isVisible(): boolean {
    return this.window ? this.window.isVisible() : false;
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  private calculatePositionNearPet(petPos: PetPosition): { x: number; y: number } {
    const display = screen.getDisplayNearestPoint({ x: petPos.x, y: petPos.y });
    const bounds = display.workArea;

    let targetX = petPos.x + 200;
    let targetY = petPos.y - 100;

    // Boundary checks
    if (targetX + this.width > bounds.x + bounds.width) {
      targetX = petPos.x - this.width - 20;
    }
    if (targetX < bounds.x) {
      targetX = bounds.x + 20;
    }
    if (targetY + this.height > bounds.y + bounds.height) {
      targetY = bounds.y + bounds.height - this.height - 20;
    }
    if (targetY < bounds.y) {
      targetY = bounds.y + 20;
    }

    return { x: Math.round(targetX), y: Math.round(targetY) };
  }

  private repositionNearPet(petPos: PetPosition): void {
    if (this.window && !this.window.isDestroyed()) {
      const { x, y } = this.calculatePositionNearPet(petPos);
      this.window.setPosition(x, y);
    }
  }
}
