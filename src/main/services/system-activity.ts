import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SystemActivityMonitor {
  private interval: NodeJS.Timeout | null = null;
  private lastState = 'idle';
  private onStateChange: (state: string) => void;

  constructor(onStateChange: (state: string) => void) {
    this.onStateChange = onStateChange;
  }

  public start() {
    this.interval = setInterval(() => this.checkActivity(), 2500);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async checkActivity() {
    try {
      // 1. Check if audio is playing (fast, no permissions needed)
      let isMusicPlaying = false;
      try {
        const { stdout } = await execAsync(`pmset -g assertions | grep "coreaudiod"`);
        if (stdout.includes('PreventUserIdleSystemSleep') || stdout.includes('NoIdleSleepAssertion')) {
          isMusicPlaying = true;
        }
      } catch (e) {
        // grep returns exit code 1 if no match, handled here.
      }

      if (isMusicPlaying) {
        this.notifyState('listening');
        return;
      }

      // 2. Check active app for Coding (fast, no permissions needed)
      let activeApp = '';
      try {
        const { stdout } = await execAsync(`lsappinfo info -only name $(lsappinfo front)`);
        activeApp = stdout.trim().toLowerCase();
      } catch (e) {}

      const codingApps = ['code', 'cursor', 'antigravity', 'terminal', 'iterm', 'xcode', 'webstorm'];
      if (codingApps.some(c => activeApp.includes(c))) {
        this.notifyState('coding');
        return;
      }

      // 3. Detect generic "Typing/Working" vs "Idle" using HIDIdleTime
      let idleSeconds = 0;
      try {
        const { stdout } = await execAsync(`ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF; exit}'`);
        const idleNanos = parseInt(stdout.trim(), 10);
        idleSeconds = idleNanos / 1_000_000_000;
      } catch (e) {}

      if (idleSeconds < 3.0) {
        this.notifyState('typing');
        return;
      }

      this.notifyState('idle');

    } catch (err) {
      console.error('[SystemActivityMonitor] error:', err);
    }
  }

  private notifyState(state: string) {
    if (this.lastState !== state) {
      this.lastState = state;
      this.onStateChange(state);
    }
  }
}
