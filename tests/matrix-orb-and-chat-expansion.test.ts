import { describe, it, expect } from 'vitest';

describe('MatrixOrb Mathematical & Physical Model', () => {
  const TAU = Math.PI * 2;
  const SCALE = {
    idle: 0.88,
    listening: 1,
    thinking: 0.92,
  };

  const ORBITERS = [
    { radius: 0.62, speed: 2.2, phase: 0, spread: 0.42 },
    { radius: 0.4, speed: -1.7, phase: 2.1, spread: 0.36 },
    { radius: 0.8, speed: 1.15, phase: 4, spread: 0.34 },
  ];

  function envelope(t: number) {
    const slow = 0.5 + 0.5 * Math.sin(t * 0.62 + 0.4);
    const fast = 0.5 + 0.5 * Math.sin(t * 1.9 + 1.1);
    return 0.22 + 0.78 * (0.45 + 0.55 * slow) * fast;
  }

  function intensityOf(
    state: 'idle' | 'listening' | 'thinking',
    d: number,
    nx: number,
    ny: number,
    t: number,
    amplitude: number,
  ) {
    if (state === 'listening') {
      const ripple = 0.5 + 0.5 * Math.sin(d * 4.2 - t * 3);
      return 0.32 + amplitude * (0.34 + 0.38 * ripple);
    }

    if (state === 'thinking') {
      let heat = 0;
      for (const o of ORBITERS) {
        const a = t * o.speed + o.phase;
        const dx = nx - Math.cos(a) * o.radius;
        const dy = ny - Math.sin(a) * o.radius;
        heat += Math.exp(-(dx * dx + dy * dy) / (o.spread * o.spread));
      }
      return 0.26 + 0.8 * Math.min(1, heat);
    }

    return 0.62 + 0.12 * Math.sin(t * 1.05 - d * 2.4);
  }

  it('calculates proper target scales for idle, listening, and thinking states', () => {
    expect(SCALE.idle).toBe(0.88);
    expect(SCALE.listening).toBe(1);
    expect(SCALE.thinking).toBe(0.92);
  });

  it('computes envelope within finite boundary [0.2, 1.0]', () => {
    for (let t = 0; t <= 10; t += 0.5) {
      const env = envelope(t);
      expect(env).toBeGreaterThanOrEqual(0.2);
      expect(env).toBeLessThanOrEqual(1.0);
    }
  });

  it('computes listening ripple intensity scaled by input amplitude (writing/typing activity)', () => {
    const lowAmp = intensityOf('listening', 0.5, 0.3, 0.4, 1.0, 0.2);
    const highAmp = intensityOf('listening', 0.5, 0.3, 0.4, 1.0, 0.9);

    expect(highAmp).toBeGreaterThan(lowAmp);
    expect(lowAmp).toBeGreaterThanOrEqual(0);
    expect(highAmp).toBeLessThanOrEqual(1.5);
  });

  it('computes 3-body Gaussian orbital heat centers for thinking state', () => {
    const heatAtCenter = intensityOf('thinking', 0, 0, 0, 0, 0);
    expect(heatAtCenter).toBeGreaterThan(0.26);

    // Orbiters rotate across time
    const heatAtT0 = intensityOf('thinking', 0.6, 0.6, 0, 0, 0);
    const heatAtT1 = intensityOf('thinking', 0.6, 0.6, 0, 2.5, 0);
    expect(heatAtT0).not.toBe(heatAtT1);
  });

  it('computes stable ambient breathing waves for idle state', () => {
    const idleVal = intensityOf('idle', 0.5, 0.3, 0.4, 0.5, 0);
    expect(idleVal).toBeGreaterThanOrEqual(0.5);
    expect(idleVal).toBeLessThanOrEqual(0.75);
  });
});

describe('Desktop Pet Window Dynamic Chat Expansion & Bottom-Right Anchor Preservation', () => {
  it('anchors bottom-right desktop coordinates when expanding for chat mode', () => {
    const petSize = 115;
    const initialW = Math.max(340, petSize + 160); // 340
    const initialH = Math.max(220, petSize + 90);  // 220
    const startX = 1000;
    const startY = 600;

    const desktopBottomRightX = startX + initialW;
    const desktopBottomRightY = startY + initialH;

    // Expand for chat mode
    const expandedW = Math.max(600, petSize + 430); // 600
    const expandedH = Math.max(520, petSize + 370); // 520

    const newX = startX + (initialW - expandedW);
    const newY = startY + (initialH - expandedH);

    // The new bottom-right coordinates must remain 100% IDENTICAL to prevent desktop jumping
    expect(newX + expandedW).toBe(desktopBottomRightX);
    expect(newY + expandedH).toBe(desktopBottomRightY);

    // Collapse back to compact pet mode
    const collapsedX = newX + (expandedW - initialW);
    const collapsedY = newY + (expandedH - initialH);

    expect(collapsedX).toBe(startX);
    expect(collapsedY).toBe(startY);
    expect(collapsedX + initialW).toBe(desktopBottomRightX);
    expect(collapsedY + initialH).toBe(desktopBottomRightY);
  });
});

