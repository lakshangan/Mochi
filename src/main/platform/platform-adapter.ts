import { app, BrowserWindow } from 'electron';

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

  public static configureWindowForPlatform(win: BrowserWindow, isTransparent = true): void {
    if (this.isMac()) {
      // macOS specific window behavior
      if (isTransparent) {
        win.setHasShadow(false);
      }
    } else if (this.isWindows()) {
      // Windows specific
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
