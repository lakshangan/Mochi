import fs from 'fs';
import path from 'path';
import { GitStatusState, GitCommitEvent, GitCompanionEvent, SystemActivityEvent } from '../../shared/types';

export class GitCompanionService {
  private repoPath: string = '';
  private isRepo: boolean = false;
  private currentBranch: string = 'main';
  private commitsToday: number = 0;
  private continuousCodingMinutes: number = 0;
  private lastActiveTimestamp: number = Date.now();
  private fatigueWarningFired: boolean = false;
  private lastKnownCommitHash: string = '';
  private lastCommitInfo?: GitCommitEvent;
  private streakDays: number = 1;
  private lastLogFileSize: number = 0;
  private fileWatcher: fs.FSWatcher | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private codingTicker: NodeJS.Timeout | null = null;
  private onEventCallbacks: ((event: GitCompanionEvent) => void)[] = [];

  constructor(targetDir: string = process.cwd()) {
    this.detectRepo(targetDir);
    this.startWatching();
    this.startCodingTracker();
  }

  public detectRepo(dir: string): boolean {
    let curr = path.resolve(dir);
    while (curr !== path.dirname(curr)) {
      const gitDir = path.join(curr, '.git');
      if (fs.existsSync(gitDir)) {
        this.repoPath = curr;
        this.isRepo = true;
        this.updateBranchInfo();
        this.parseGitLogs(true);
        return true;
      }
      curr = path.dirname(curr);
    }
    // Fallback to process.cwd()
    this.repoPath = process.cwd();
    this.isRepo = fs.existsSync(path.join(this.repoPath, '.git'));
    if (this.isRepo) {
      this.updateBranchInfo();
      this.parseGitLogs(true);
    }
    return this.isRepo;
  }

  private updateBranchInfo(): void {
    if (!this.isRepo) return;
    try {
      const headFile = path.join(this.repoPath, '.git', 'HEAD');
      if (fs.existsSync(headFile)) {
        const content = fs.readFileSync(headFile, 'utf-8').trim();
        if (content.startsWith('ref: refs/heads/')) {
          this.currentBranch = content.replace('ref: refs/heads/', '');
        } else {
          this.currentBranch = content.substring(0, 7);
        }
      }
    } catch {
      // ignore
    }
  }

  private parseGitLogs(initialScan: boolean = false): void {
    if (!this.isRepo) return;
    const logFile = path.join(this.repoPath, '.git', 'logs', 'HEAD');
    if (!fs.existsSync(logFile)) return;

    try {
      const stat = fs.statSync(logFile);
      this.lastLogFileSize = stat.size;
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      if (lines.length === 0) return;

      const todayStr = new Date().toDateString();
      let todayCount = 0;

      for (const line of lines) {
        // Format: <oldHash> <newHash> <author> <<email>> <timestamp> <tz> <action>: <message>
        const match = line.match(/^(\w+)\s+(\w+)\s+([^<]+)<[^>]+>\s+(\d+)\s+([+-]\d+)\t(.*)$/);
        if (match) {
          const timestamp = parseInt(match[4], 10) * 1000;
          if (new Date(timestamp).toDateString() === todayStr) {
            todayCount++;
          }
        }
      }
      this.commitsToday = todayCount;

      const lastLine = lines[lines.length - 1];
      const lastMatch = lastLine.match(/^(\w+)\s+(\w+)\s+([^<]+)<[^>]+>\s+(\d+)\s+([+-]\d+)\t(.*)$/);
      if (lastMatch) {
        const newHash = lastMatch[2];
        const author = lastMatch[3].trim();
        const timestamp = parseInt(lastMatch[4], 10) * 1000;
        let actionMessage = lastMatch[6].trim();

        const isCommit = actionMessage.startsWith('commit:') || actionMessage.startsWith('commit (amend):');
        const isPush = actionMessage.startsWith('push:') || actionMessage.includes('push');

        let cleanMessage = actionMessage.replace(/^commit(\s*\(amend\))?:\s*/i, '');

        const commitEvent: GitCommitEvent = {
          hash: newHash,
          shortHash: newHash.substring(0, 7),
          author,
          message: cleanMessage || 'Code update',
          timestamp,
        };

        if (!initialScan && this.lastKnownCommitHash && this.lastKnownCommitHash !== newHash) {
          if (isCommit) {
            this.commitsToday++;
            this.emitEvent({
              type: 'commit',
              message: `Git commit: "${commitEvent.message}" 🚀`,
              data: commitEvent,
            });
          } else if (isPush) {
            this.emitEvent({
              type: 'push',
              message: `Pushed commits to remote repository! 🌟`,
              data: commitEvent,
            });
          }
        }

        this.lastKnownCommitHash = newHash;
        this.lastCommitInfo = commitEvent;
      }
    } catch {
      // ignore
    }
  }

  public onEvent(callback: (event: GitCompanionEvent) => void): () => void {
    this.onEventCallbacks.push(callback);
    return () => {
      this.onEventCallbacks = this.onEventCallbacks.filter((cb) => cb !== callback);
    };
  }

  private emitEvent(event: GitCompanionEvent): void {
    for (const cb of this.onEventCallbacks) {
      try {
        cb(event);
      } catch {
        // ignore
      }
    }
  }

  private startWatching(): void {
    if (!this.isRepo) return;
    const logFile = path.join(this.repoPath, '.git', 'logs', 'HEAD');

    try {
      if (fs.existsSync(logFile)) {
        this.fileWatcher = fs.watch(logFile, () => {
          this.parseGitLogs(false);
          this.updateBranchInfo();
        });
      }
    } catch {
      // Fallback to polling
    }

    // Secondary poll every 3.5 seconds to ensure catch-up
    this.pollInterval = setInterval(() => {
      this.updateBranchInfo();
      if (fs.existsSync(logFile)) {
        try {
          const size = fs.statSync(logFile).size;
          if (size !== this.lastLogFileSize) {
            this.parseGitLogs(false);
          }
        } catch {
          // ignore
        }
      }
    }, 3500);
  }

  private startCodingTracker(): void {
    // 1-minute ticker to accumulate continuous coding time
    this.codingTicker = setInterval(() => {
      const now = Date.now();
      const idleMinutes = (now - this.lastActiveTimestamp) / 60000;

      // If inactive for > 12 minutes, user stepped away -> reset continuous streak
      if (idleMinutes > 12) {
        if (this.continuousCodingMinutes > 0) {
          this.continuousCodingMinutes = 0;
          this.fatigueWarningFired = false;
        }
      } else {
        this.continuousCodingMinutes += 1;

        // Check for 90-minute straight coding warning!
        if (this.continuousCodingMinutes >= 90 && !this.fatigueWarningFired) {
          this.fatigueWarningFired = true;
          this.emitEvent({
            type: 'fatigue_warning',
            message: `You've been in flow state coding for ${this.continuousCodingMinutes} minutes straight! Time for a quick stretch & eye break. 🧘‍♂️`,
            data: { continuousMinutes: this.continuousCodingMinutes },
          });
        }
      }
    }, 60000);
  }

  /**
   * Called by SystemActivityMonitor when user is detected typing, in IDE, or using dev tools.
   */
  public recordCodingActivity(event?: SystemActivityEvent): void {
    this.lastActiveTimestamp = Date.now();
    if (event?.category === 'development' || event?.state === 'coding' || event?.isTyping) {
      this.lastActiveTimestamp = Date.now();
    }
  }

  public simulateEvent(type: 'commit' | 'push' | 'fatigue_warning'): void {
    if (type === 'commit') {
      this.commitsToday++;
      this.emitEvent({
        type: 'commit',
        message: 'Git commit: "feat: implemented ultra-smooth UI & Git Companion" 🚀',
        data: {
          hash: 'a1b2c3d4e5f6',
          shortHash: 'a1b2c3d',
          author: 'Mochi Developer',
          message: 'feat: implemented ultra-smooth UI & Git Companion',
          timestamp: Date.now(),
        },
      });
    } else if (type === 'push') {
      this.emitEvent({
        type: 'push',
        message: 'Pushed 3 commits to origin/main! 🌟 Zero bugs!',
        data: {
          timestamp: Date.now(),
        },
      });
    } else if (type === 'fatigue_warning') {
      this.emitEvent({
        type: 'fatigue_warning',
        message: "You've been in flow state coding for 90 minutes straight! Time for a quick stretch & eye break. 🧘‍♂️",
        data: { continuousMinutes: 90 },
      });
    }
  }

  public getStatus(): GitStatusState {
    return {
      isRepo: this.isRepo,
      repoPath: this.repoPath,
      currentBranch: this.currentBranch,
      commitsToday: this.commitsToday,
      continuousCodingMinutes: this.continuousCodingMinutes,
      longestStreakDays: 5,
      currentStreakDays: this.streakDays,
      lastCommit: this.lastCommitInfo,
      fatigueWarningActive: this.continuousCodingMinutes >= 90,
    };
  }

  public stop(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
      this.fileWatcher = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.codingTicker) {
      clearInterval(this.codingTicker);
      this.codingTicker = null;
    }
  }
}
