import { PetAnimationState } from '../../shared/types';

export type StateChangeCallback = (state: PetAnimationState) => void;

const STATE_PRIORITIES: Record<PetAnimationState, number> = {
  dragging: 10,
  party: 9,
  beaten: 9,
  angry: 9,
  reminding: 9,
  fire: 9,
  celebrating: 8,
  hydrated: 8,
  happy: 7,
  smile: 7,
  sad: 7,
  curious: 6,
  coding: 6,
  typing: 5,
  listening: 5,
  waking: 5,
  thinking: 5,
  working: 4,
  focused: 4,
  walking: 3,
  sleeping: 2,
  blink: 1,
  idle: 0,
};

export class AnimationController {
  private currentState: PetAnimationState = 'idle';
  private baselineState: PetAnimationState = 'idle';
  private temporaryTimer: NodeJS.Timeout | null = null;
  private blinkTimer: NodeJS.Timeout | null = null;
  private autonomicTimer: NodeJS.Timeout | null = null;
  private listeners: StateChangeCallback[] = [];

  constructor() {
    this.startAutonomicBlinking();
    this.startAutonomicBehaviors();
  }

  public onChange(cb: StateChangeCallback): () => void {
    this.listeners.push(cb);
    cb(this.currentState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public getState(): PetAnimationState {
    return this.currentState;
  }

  public setState(state: PetAnimationState): void {
    this.setBaseline(state);
    this.transitionTo(state);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.currentState));
  }

  public setBaseline(state: PetAnimationState): void {
    this.baselineState = state;
    if (!this.temporaryTimer) {
      this.transitionTo(state);
    }
  }

  public transitionTo(newState: PetAnimationState): void {
    if (this.temporaryTimer) {
      clearTimeout(this.temporaryTimer);
      this.temporaryTimer = null;
    }

    this.currentState = newState;
    this.notify();
  }

  /**
   * Triggers a temporary emotion/reaction (e.g. happy bounce, celebration, reminder pulse)
   * that smoothly reverts to the baseline state after durationMs.
   */
  public triggerReaction(reaction: PetAnimationState, durationMs = 2800): void {
    const currentPriority = STATE_PRIORITIES[this.currentState] || 0;
    const reactionPriority = STATE_PRIORITIES[reaction] || 0;

    // Only interrupt if reaction is equal or higher priority
    if (reactionPriority >= currentPriority || this.currentState === 'idle') {
      if (this.temporaryTimer) {
        clearTimeout(this.temporaryTimer);
      }

      this.currentState = reaction;
      this.notify();

      this.temporaryTimer = setTimeout(() => {
        this.temporaryTimer = null;
        this.currentState = this.baselineState;
        this.notify();
      }, durationMs);
    }
  }

  private startAutonomicBlinking(): void {
    const scheduleNextBlink = () => {
      const delay = 3000 + Math.random() * 4000;
      this.blinkTimer = setTimeout(() => {
        if (this.currentState === 'idle' || this.currentState === 'working' || this.currentState === 'focused') {
          // Trigger momentary blink
          this.listeners.forEach((cb) => cb('blink'));
          setTimeout(() => {
            this.notify();
          }, 180);
        }
        scheduleNextBlink();
      }, delay);
    };
    scheduleNextBlink();
  }

  private startAutonomicBehaviors(): void {
    const scheduleNextAutonomic = () => {
      const delay = 18000 + Math.random() * 25000;
      this.autonomicTimer = setTimeout(() => {
        if (this.currentState === 'idle') {
          // Occasional curious look around
          this.triggerReaction('curious', 3000);
        }
        scheduleNextAutonomic();
      }, delay);
    };
    scheduleNextAutonomic();
  }

  public destroy(): void {
    if (this.temporaryTimer) clearTimeout(this.temporaryTimer);
    if (this.blinkTimer) clearTimeout(this.blinkTimer);
    if (this.autonomicTimer) clearTimeout(this.autonomicTimer);
  }
}
