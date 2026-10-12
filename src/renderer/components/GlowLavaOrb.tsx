import React, { useEffect, useRef } from 'react';
import { PetAnimationState } from '../../shared/types';
import '../styles/glow-lava-orb.css';

export interface GlowLavaOrbProps {
  state?: PetAnimationState;
  isSpeaking?: boolean;
  isTyping?: boolean;
  typingBurst?: boolean;
  gaze?: { x: number; y: number };
  timerProgress?: number;
  isTimerActive?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

type PixelGrid = number[][];

interface Expression {
  centered?: boolean;
  eye: PixelGrid;
  rightEye?: PixelGrid;
  eyeColor: string;
  glowColor: string;
  intensity: number;
  eyeOffset: number;
}

function mirrorGrid(g: PixelGrid): PixelGrid {
  return g.map((row) => [...row].reverse());
}

// ─── Reference Pixel Art Eye Matrices (100% matched to reference Divoom art) ──

// 1. Standby / Idle (待机): 5x8 rounded capsule with specular glint
const PILL_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 0.45, 1], // specular glimmer
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// Blink: Crisp horizontal line
const BLINK_EYE: PixelGrid = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
];

// 2. Smile / Happy (微笑 `∩ ∩`): Arched anime eyes
const ARCH_HAPPY_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
];

// 3. Resting / Sleeping (闭眼 `∪ ∪`): Gentle curved U
const SLEEP_EYE: PixelGrid = [
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

// 4. Energetic Focus / Active Typing: Bright alert anime eyes with pupil highlights
const FLOW_TYPING_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 0.35, 1, 1], // energetic shine
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// 5. Joyful Flow / High Streak Typing: Sweet curved anime eyes (`^ ^`)
const HAPPY_FLOW_EYE: PixelGrid = [
  [0, 1, 1, 1, 1, 0],
  [1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 1, 0],
];

// 6. Playful Wink: Left open, Right smooth curved happy wink
const WINK_ARC: PixelGrid = [
  [0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
];

// 7. Curious / Watching Eye: Wide attentive eyes that look toward the cursor
const CURIOUS_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 0.35, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// 8. Centered Heart (爱心)
const CENTERED_HEART: PixelGrid = [
  [0, 1, 1, 0, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
];

// 9. Cyber Shades (墨镜)
const SHADES_CENTERED: PixelGrid = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
];

// 10. Sparkle (星星)
const SPARKLE_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

// 11. Focused / Concentrated Attention: Sharp focused capsules
const FOCUSED_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
  [0, 1, 1, 1, 0],
];

// 12. Shocked Hollow Eyes (吓 `O O`)
const SHOCKED_HOLLOW_EYE: PixelGrid = [
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [0, 1, 1, 0],
];

// 13. Thinking / Skeptical
const SKEPTICAL_EYE_LEFT: PixelGrid = [
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
];
const SKEPTICAL_EYE_RIGHT: PixelGrid = [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1],
];

// Expression map for animation states
const EXPR_MAP: Record<PetAnimationState | 'wink' | 'curious_glance' | 'typing_curious' | 'typing_burst', Expression> = {
  idle: {
    eye: PILL_EYE,
    eyeColor: '#ffffff',
    glowColor: '#00d2ff',
    intensity: 1.0,
    eyeOffset: 26,
  },
  blink: {
    eye: BLINK_EYE,
    eyeColor: '#ffffff',
    glowColor: '#00d2ff',
    intensity: 0.8,
    eyeOffset: 26,
  },
  wink: {
    eye: PILL_EYE,
    rightEye: WINK_ARC,
    eyeColor: '#38bdf8',
    glowColor: '#00e5ff',
    intensity: 1.25,
    eyeOffset: 26,
  },
  curious_glance: {
    eye: CURIOUS_EYE,
    eyeColor: '#38bdf8',
    glowColor: '#0284c7',
    intensity: 1.25,
    eyeOffset: 26,
  },
  typing_curious: {
    eye: FLOW_TYPING_EYE,
    eyeColor: '#38bdf8',
    glowColor: '#00e5ff',
    intensity: 1.5,
    eyeOffset: 26,
  },
  typing_burst: {
    eye: HAPPY_FLOW_EYE,
    eyeColor: '#f472b6',
    glowColor: '#ec4899',
    intensity: 1.65,
    eyeOffset: 26,
  },
  happy: {
    eye: ARCH_HAPPY_EYE,
    eyeColor: '#ffe066',
    glowColor: '#f59e0b',
    intensity: 1.4,
    eyeOffset: 26,
  },
  celebrating: {
    centered: true,
    eye: CENTERED_HEART,
    eyeColor: '#ff4d6d',
    glowColor: '#f43f5e',
    intensity: 1.6,
    eyeOffset: 0,
  },
  curious: {
    eye: CURIOUS_EYE,
    eyeColor: '#38bdf8',
    glowColor: '#0284c7',
    intensity: 1.25,
    eyeOffset: 26,
  },
  sleeping: {
    eye: SLEEP_EYE,
    eyeColor: 'rgba(190, 205, 255, 0.55)',
    glowColor: '#6366f1',
    intensity: 0.45,
    eyeOffset: 26,
  },
  waking: {
    eye: WINK_ARC,
    rightEye: PILL_EYE,
    eyeColor: '#38bdf8',
    glowColor: '#00e5ff',
    intensity: 1.1,
    eyeOffset: 26,
  },
  thinking: {
    eye: SKEPTICAL_EYE_LEFT,
    rightEye: SKEPTICAL_EYE_RIGHT,
    eyeColor: '#a78bfa',
    glowColor: '#8b5cf6',
    intensity: 1.2,
    eyeOffset: 26,
  },
  working: {
    eye: PILL_EYE,
    eyeColor: '#00f7ff',
    glowColor: '#00f7ff',
    intensity: 1.5,
    eyeOffset: 26,
  },
  reminding: {
    eye: SPARKLE_EYE,
    eyeColor: '#fde047',
    glowColor: '#eab308',
    intensity: 1.4,
    eyeOffset: 28,
  },
  dragging: {
    eye: SHOCKED_HOLLOW_EYE,
    eyeColor: '#ffffff',
    glowColor: '#38bdf8',
    intensity: 1.3,
    eyeOffset: 26,
  },
  typing: {
    eye: FLOW_TYPING_EYE,
    eyeColor: '#c084fc',
    glowColor: '#a855f7',
    intensity: 1.6,
    eyeOffset: 26,
  },
  listening: {
    eye: ARCH_HAPPY_EYE,
    eyeColor: '#f472b6',
    glowColor: '#ec4899',
    intensity: 1.35,
    eyeOffset: 26,
  },
  coding: {
    centered: true,
    eye: SHADES_CENTERED,
    eyeColor: '#00f7ff',
    glowColor: '#00f7ff',
    intensity: 1.7,
    eyeOffset: 0,
  },
  focused: {
    eye: FOCUSED_EYE,
    eyeColor: '#00f5ff',
    glowColor: '#0284c7',
    intensity: 1.5,
    eyeOffset: 26,
  },
  walking: {
    eye: PILL_EYE,
    eyeColor: '#ffffff',
    glowColor: '#00d2ff',
    intensity: 1.1,
    eyeOffset: 26,
  },
};

export const GlowLavaOrb: React.FC<GlowLavaOrbProps> = ({
  state = 'idle',
  isSpeaking = false,
  isTyping = false,
  typingBurst = false,
  gaze = { x: 0, y: 0 },
  timerProgress = 0,
  isTimerActive = false,
  size = 115,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef(state);
  const isTypingRef = useRef(isTyping);
  const typingBurstRef = useRef(typingBurst);
  const gazeRef = useRef(gaze);
  const sizeRef = useRef(size);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { typingBurstRef.current = typingBurst; }, [typingBurst]);
  useEffect(() => { gazeRef.current = gaze; }, [gaze]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    // Cross-fade state transitions
    let prevState: PetAnimationState | 'wink' | 'curious_glance' | 'typing_curious' | 'typing_burst' = stateRef.current;
    let fromExpr = EXPR_MAP[prevState] || EXPR_MAP.idle;
    let toExpr = fromExpr;
    let transAlpha = 1.0;

    // Gaze tracking interpolation
    let smoothGazeX = 0;
    let smoothGazeY = 0;

    // Natural micro-saccades (subtle living eye shift when idle)
    let nextSaccadeTime = performance.now() + 2500;
    let saccadeTargetX = 0;
    let saccadeTargetY = 0;

    // Natural micro-expression timers
    let nextBlinkTime = performance.now() + 2400 + Math.random() * 1600;
    let blinkStage = 0; // 0 = not blinking, 1 = first blink, 2 = pause, 3 = second blink
    let blinkEndTime = 0;
    let isDoubleBlink = false;

    // Curious glance timer (eyes subtly look around desktop)
    let nextGlanceTime = performance.now() + 5500 + Math.random() * 3500;
    let glanceEndTime = 0;
    let isGlancing = false;

    // Playful wink timer
    let nextWinkTime = performance.now() + 14000 + Math.random() * 8000;
    let winkEndTime = 0;
    let isWinking = false;

    // Particle embers
    const embers: { x: number; y: number; vy: number; alpha: number; color: string; size: number }[] = [];
    let emberTimer = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentSize = sizeRef.current;
      const activeState = stateRef.current;
      const typingNow = isTypingRef.current || activeState === 'typing';

      // ── Dynamic Responsive Pixel Grid Sizing ────────────────────────────
      // Scales with perfect proportions at any size (from 70px to 220px)
      const scale = currentSize / 170;
      const CELL = Math.max(3.2, 9.0 * scale);
      const PX = Math.max(2.4, CELL * 0.72);
      const GAP = CELL - PX;

      // ── Natural Gaze & Micro-Saccade Tracking ────────────────────────────
      const rawGaze = gazeRef.current || { x: 0, y: 0 };
      const hasActiveCursor = Math.abs(rawGaze.x) > 0.04 || Math.abs(rawGaze.y) > 0.04;

      let targetGazeX = rawGaze.x;
      let targetGazeY = rawGaze.y;

      if (typingNow) {
        // While typing, eyes focus downwards toward editor/keyboard
        targetGazeY = Math.max(targetGazeY, 0.28);
      } else if (!hasActiveCursor && activeState === 'idle') {
        // Idle living micro-saccades: glance gently around
        if (now > nextSaccadeTime) {
          nextSaccadeTime = now + 2400 + Math.random() * 2800;
          saccadeTargetX = (Math.random() - 0.5) * 0.4;
          saccadeTargetY = (Math.random() - 0.5) * 0.25;
        }
        targetGazeX = saccadeTargetX;
        targetGazeY = saccadeTargetY;
      }

      // Smooth organic lerp
      const lerpSpeed = hasActiveCursor ? 12 : 6;
      smoothGazeX += (targetGazeX - smoothGazeX) * Math.min(1, dt * lerpSpeed);
      smoothGazeY += (targetGazeY - smoothGazeY) * Math.min(1, dt * lerpSpeed);

      // Helper: draw single pixel grid scaled
      const drawGrid = (
        grid: PixelGrid,
        cx: number,
        cy: number,
        color: string,
        glowColor: string,
        intensity: number,
        alpha: number
      ) => {
        if (alpha < 0.01) return;
        const cols = Math.max(...grid.map((r) => r.length));
        const rows = grid.length;
        const totalW = cols * CELL - GAP;
        const totalH = rows * CELL - GAP;
        const sx = cx - totalW / 2;
        const sy = cy - totalH / 2;

        ctx.save();
        ctx.shadowBlur = Math.round(8 * intensity * Math.max(0.65, scale));
        ctx.shadowColor = glowColor;
        ctx.fillStyle = color;

        for (let r = 0; r < rows; r++) {
          const row = grid[r];
          for (let c = 0; c < row.length; c++) {
            const val = row[c] ?? 0;
            if (val > 0) {
              ctx.globalAlpha = Math.max(0, Math.min(1, alpha * val));
              const x = sx + c * CELL;
              const y = sy + r * CELL;

              ctx.beginPath();
              ctx.roundRect(x, y, PX, PX, Math.max(1, 1.8 * scale));
              ctx.fill();
            }
          }
        }
        ctx.restore();
      };

      // Helper: draw full face expression with gaze shift
      const drawFace = (expr: Expression, alpha: number, cx: number, cy: number) => {
        if (alpha < 0.01) return;
        const offset = Math.round(expr.eyeOffset * scale);

        // Calculate smooth gaze shift
        const gazeShiftX = smoothGazeX * (6.5 * scale);
        const gazeShiftY = smoothGazeY * (4.5 * scale);

        if (expr.centered) {
          drawGrid(expr.eye, cx + gazeShiftX * 0.35, cy + gazeShiftY * 0.35, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
        } else {
          const lGrid = expr.eye;
          const rGrid = expr.rightEye ?? mirrorGrid(lGrid);

          drawGrid(lGrid, cx - offset + gazeShiftX, cy + gazeShiftY, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
          drawGrid(rGrid, cx + offset + gazeShiftX, cy + gazeShiftY, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
        }
      };

      // ── Handle spontaneous natural blinking with occasional double-blink ──
      const canBlink = activeState === 'idle' || activeState === 'focused' || activeState === 'curious' || typingNow;
      if (canBlink && blinkStage === 0 && now > nextBlinkTime) {
        blinkStage = 1;
        isDoubleBlink = Math.random() < 0.25; // 25% chance double-blink
        blinkEndTime = now + 120;
      }
      if (blinkStage === 1 && now > blinkEndTime) {
        if (isDoubleBlink) {
          blinkStage = 2; // brief pause open
          blinkEndTime = now + 70;
        } else {
          blinkStage = 0;
          nextBlinkTime = now + 2400 + Math.random() * 2000;
        }
      }
      if (blinkStage === 2 && now > blinkEndTime) {
        blinkStage = 3; // second blink
        blinkEndTime = now + 110;
      }
      if (blinkStage === 3 && now > blinkEndTime) {
        blinkStage = 0;
        nextBlinkTime = now + 2600 + Math.random() * 2200;
      }

      // ── Handle curious wandering glance when idle ───────────────────────
      if (activeState === 'idle' && !typingNow && blinkStage === 0 && !isGlancing && !isWinking && now > nextGlanceTime) {
        isGlancing = true;
        glanceEndTime = now + 1400; // look aside for 1.4s
      }
      if (isGlancing && now > glanceEndTime) {
        isGlancing = false;
        nextGlanceTime = now + 6500 + Math.random() * 4500;
      }

      // ── Handle playful wink when idle ────────────────────────────────────
      if (activeState === 'idle' && !typingNow && blinkStage === 0 && !isGlancing && !isWinking && now > nextWinkTime) {
        isWinking = true;
        winkEndTime = now + 650; // 650ms friendly wink
      }
      if (isWinking && now > winkEndTime) {
        isWinking = false;
        nextWinkTime = now + 16000 + Math.random() * 10000;
      }

      // Determine effective visual state
      let effectiveState: PetAnimationState | 'wink' | 'curious_glance' | 'typing_curious' | 'typing_burst' = activeState;

      if (blinkStage === 1 || blinkStage === 3) {
        effectiveState = 'blink';
      } else if (typingNow) {
        effectiveState = typingBurstRef.current ? 'typing_burst' : 'typing';
      } else if (isWinking && activeState === 'idle') {
        effectiveState = 'wink';
      } else if (isGlancing && activeState === 'idle') {
        effectiveState = 'curious_glance';
      }

      // ── State Transition cross-fade ──────────────────────────────────────
      if (effectiveState !== prevState) {
        fromExpr = toExpr;
        toExpr = EXPR_MAP[effectiveState] || EXPR_MAP.idle;
        transAlpha = 0;
        prevState = effectiveState;
      }
      if (transAlpha < 1) {
        transAlpha = Math.min(1, transAlpha + dt / 0.16);
      }

      // ── HiDPI Canvas Scaling ─────────────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const logW = currentSize;
      const logH = currentSize;
      const physW = Math.round(logW * dpr);
      const physH = Math.round(logH * dpr);

      if (canvas.width !== physW || canvas.height !== physH) {
        canvas.width = physW;
        canvas.height = physH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, logW, logH);

      const cx = logW / 2;
      const cy = logH / 2;

      // Keystroke bounce when typing
      const typingBob = typingNow ? Math.sin(now * 0.024) * (1.8 * scale) : 0;
      const faceY = cy + typingBob;

      // Render Face
      if (transAlpha < 1) {
        drawFace(fromExpr, 1 - transAlpha, cx, faceY);
      }
      drawFace(toExpr, transAlpha, cx, faceY);

      // Subtle rising sparkle embers
      emberTimer += dt;
      const shouldSpawnEmber = activeState === 'celebrating' || activeState === 'happy' || activeState === 'listening';
      if (shouldSpawnEmber && emberTimer > 0.4 && embers.length < 6) {
        emberTimer = 0;
        embers.push({
          x: cx + (Math.random() - 0.5) * (40 * scale),
          y: faceY + (12 * scale),
          vy: -(14 + Math.random() * 12),
          alpha: 0.75,
          color: toExpr.glowColor,
          size: Math.max(1.5, 2.2 * scale),
        });
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 0.55;
        if (p.alpha <= 0) {
          embers.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.size, p.size, 1);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const radius = Math.max(20, (size / 2) - 4);
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - Math.max(0, Math.min(1, timerProgress)) * circumference;

  return (
    <div
      className={`glow-orb-wrapper ${className}`}
      data-state={state}
      data-typing={isTyping}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* 0. Cyberpunk Glowing Headphones (Active in Audio Listening / Vibing state) */}
      {state === 'listening' && (
        <div className="glow-orb-headphones" style={{ width: size, height: size }}>
          <div className="headphone-band" />
          <div className="headphone-earcup left">
            <div className="earcup-cushion" />
            <div className="earcup-light" />
            <div className="earcup-soundwave">
              <span className="wave-bar bar-1" />
              <span className="wave-bar bar-2" />
              <span className="wave-bar bar-3" />
            </div>
          </div>
          <div className="headphone-earcup right">
            <div className="earcup-cushion" />
            <div className="earcup-light" />
            <div className="earcup-soundwave">
              <span className="wave-bar bar-1" />
              <span className="wave-bar bar-2" />
              <span className="wave-bar bar-3" />
            </div>
          </div>
        </div>
      )}

      {/* 1. Outer Ambient Halo Bloom */}
      <div className="glow-orb-halo" />

      {/* 2. Optional Orbital Timer Progress Ring */}
      {isTimerActive && (
        <div className="glow-orb-timer-ring">
          <svg className="glow-orb-timer-svg" viewBox={`0 0 ${size} ${size}`}>
            <circle
              className="glow-orb-timer-track"
              cx={size / 2}
              cy={size / 2}
              r={radius}
            />
            <circle
              className="glow-orb-timer-progress"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
        </div>
      )}

      {/* 3. Deep OLED Glass Chassis */}
      <div className="glow-orb-sphere">
        <div className="glow-orb-ambient-depth" />
        <div className="glow-orb-lens-sheen" />
        <div className="glow-orb-face-container">
          <canvas ref={canvasRef} className="glow-orb-face-canvas" />
        </div>
      </div>
    </div>
  );
};
