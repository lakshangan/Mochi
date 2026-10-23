import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GitCompanionService } from '../src/main/services/git-companion-service';

describe('GitCompanionService & Coding Streak Tracker', () => {
  let service: GitCompanionService;

  beforeEach(() => {
    service = new GitCompanionService();
  });

  afterEach(() => {
    service.stop();
  });

  it('initializes and reports repository status', () => {
    const status = service.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.isRepo).toBe('boolean');
    expect(typeof status.currentBranch).toBe('string');
    expect(typeof status.commitsToday).toBe('number');
    expect(typeof status.continuousCodingMinutes).toBe('number');
  });

  it('emits commit celebration when simulated', () => {
    let capturedEvent: any = null;
    service.onEvent((ev) => {
      capturedEvent = ev;
    });

    service.simulateEvent('commit');
    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.type).toBe('commit');
    expect(capturedEvent.message).toContain('Git commit');
    expect(capturedEvent.data.hash).toBeDefined();
  });

  it('emits push celebration when simulated', () => {
    let capturedEvent: any = null;
    service.onEvent((ev) => {
      capturedEvent = ev;
    });

    service.simulateEvent('push');
    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.type).toBe('push');
    expect(capturedEvent.message).toContain('Pushed');
  });

  it('emits 90-minute straight coding fatigue warning when simulated', () => {
    let capturedEvent: any = null;
    service.onEvent((ev) => {
      capturedEvent = ev;
    });

    service.simulateEvent('fatigue_warning');
    expect(capturedEvent).toBeDefined();
    expect(capturedEvent.type).toBe('fatigue_warning');
    expect(capturedEvent.message).toContain('90 minutes straight');
  });
});
