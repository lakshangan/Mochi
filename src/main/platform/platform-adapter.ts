import { app, BrowserWindow, shell } from 'electron';
import { SecurityValidator } from '../security/security-validator';

export class PlatformAdapter {
  public static getPlatform(): 'darwin' | 'win32' | 'linux' {
    return process.platform as 'darwin' | 'win32' | 'linux';
  }

  public static isMac(): boolean {
    return process.platform === 'darwin';
  }

  public static isWindows(): boolean {
    return process.platform === 'win32';
  }

  public static isLinux(): boolean {
    return process.platform === 'linux';
  }

  /**
   * Configures OS-specific window visual properties, transparency, and chrome borders.
   */
  public static configureWindowForPlatform(win: BrowserWindow, isTransparent = true): void {
    // Prevent any native OS window title or DWM title bar caption from displaying
    win.setTitle('');
    win.webContents.on('page-title-updated', (e) => {
      e.preventDefault();
    });

    if (this.isMac()) {
      // macOS specific window behavior
      if (isTransparent) {
        win.setHasShadow(false);
      }
    } else if (this.isWindows()) {
      // Windows specific: prevent DWM from rendering white title/caption borders on blur
      if (isTransparent) {
        win.setBackgroundColor('#00000000');
      }
    } else {
      // Linux specific
      // Some Linux compositors require particular handling for alpha channel
      if (isTransparent) {
        win.setBackgroundColor('#00000000');
      }
    }
  }

  /**
   * Applies rigorous Electron security restrictions to webContents:
   * - Blocks arbitrary window creation via window.open
   * - Restricts navigation to external pages
   * - Prevents malicious redirects
   * - Safely opens verified external URLs in default system browser
   */
  public static applySecurityRestrictions(
    win: BrowserWindow,
    isDev: boolean,
    devUrl: string
  ): void {
    const webContents = win.webContents;

    // 1. Intercept window.open calls and deny internal window creation
    webContents.setWindowOpenHandler(({ url }) => {
      const check = SecurityValidator.validateExternalUrl(url);
      if (check.allow && check.openExternally) {
        shell.openExternal(url).catch((err) => {
          console.warn('[Security] Failed to open external URL:', err);
        });
      } else {
        console.warn(`[Security] Blocked window.open attempt to: ${url}. Reason: ${check.reason}`);
      }
      return { action: 'deny' };
    });

    // 2. Intercept renderer-driven navigation (will-navigate)
    webContents.on('will-navigate', (event, navigationUrl) => {
      // In dev mode, allow navigation to the local Vite dev server
      if (isDev && navigationUrl.startsWith(devUrl)) {
        return;
      }

      // In production, allow file:// navigation only within app resources
      try {
        const parsed = new URL(navigationUrl);
        if (!isDev && parsed.protocol === 'file:') {
          return;
        }
      } catch {
        // malformed URL
      }

      // Block navigation inside this window
      event.preventDefault();

      // Open safe external links in system browser instead
      const check = SecurityValidator.validateExternalUrl(navigationUrl);
      if (check.allow && check.openExternally) {
        shell.openExternal(navigationUrl).catch((err) => {
          console.warn('[Security] Failed to open external URL:', err);
        });
      } else {
        console.warn(`[Security] Blocked will-navigate attempt to: ${navigationUrl}`);
      }
    });

    // 3. Prevent will-redirect attacks
    webContents.on('will-redirect', (event, redirectUrl) => {
      if (isDev && redirectUrl.startsWith(devUrl)) {
        return;
      }
      try {
        const parsed = new URL(redirectUrl);
        if (!isDev && parsed.protocol === 'file:') {
          return;
        }
      } catch {
        // malformed
      }

      event.preventDefault();
      console.warn(`[Security] Blocked unauthorized redirect to: ${redirectUrl}`);
    });
  }

  public static setLaunchAtLogin(openAtLogin: boolean): void {
    try {
      app.setLoginItemSettings({
        openAtLogin,
        openAsHidden: true,
      });
    } catch (err) {
      console.warn('[PlatformAdapter] Launch at login not supported or failed:', err);
    }
  }
}
