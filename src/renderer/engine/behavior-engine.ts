import { PetAnimationState } from '../../shared/types';
import { AnimationController } from './animation-controller';

export class BehaviorEngine {
  private animationController: AnimationController;
  private lastActivityTime = Date.now();
  private inactivityCheckInterval: NodeJS.Timeout | null = null;
  private isSleeping = false;
  private sleepThresholdMs = 8 * 60 * 1000; // 8 minutes of inactivity -> sleeping

  constructor(animationController: AnimationController) {
    this.animationController = animationController;
    this.startInactivityMonitoring();
  }

  public registerUserActivity(): void {
    this.lastActivityTime = Date.now();
    if (this.isSleeping) {
      this.isSleeping = false;
      this.animationController.triggerReaction('waking', 2000);
      setTimeout(() => {
        this.animationController.setBaseline('idle');
      }, 2000);
    }
  }

  public handlePetClick(): void {
    this.registerUserActivity();
    const current = this.animationController.getState();
    if (current === 'sleeping') {
      this.isSleeping = false;
      this.animationController.triggerReaction('waking', 2000);
      return;
    }

    // Toggle between curious and happy upon user interaction
    const reaction: PetAnimationState = Math.random() > 0.4 ? 'happy' : 'curious';
    this.animationController.triggerReaction(reaction, 2500);
  }

  public handleTimerStart(isPomodoro: boolean): void {
    this.registerUserActivity();
    this.animationController.setBaseline(isPomodoro ? 'working' : 'focused');
  }

  public handleTimerComplete(): void {
    this.animationController.triggerReaction('celebrating', 4000);
    this.animationController.setBaseline('idle');
  }

  public handleReminderTriggered(): void {
    this.animationController.triggerReaction('reminding', 6000);
  }

  public handleDragStart(): void {
    this.registerUserActivity();
    this.animationController.transitionTo('dragging');
  }

  public handleDragEnd(): void {
    this.registerUserActivity();
    this.animationController.transitionTo('idle');
  }

  private startInactivityMonitoring(): void {
    this.inactivityCheckInterval = setInterval(() => {
      const now = Date.now();
      const current = this.animationController.getState();
      // Don't fall asleep if working on pomodoro or timer is active
      if (
        !this.isSleeping &&
        current === 'idle' &&
        now - this.lastActivityTime > this.sleepThresholdMs
      ) {
        this.isSleeping = true;
        this.animationController.setBaseline('sleeping');
      }
    }, 30000);
  }

  public destroy(): void {
    if (this.inactivityCheckInterval) {
      clearInterval(this.inactivityCheckInterval);
    }
  }
}
