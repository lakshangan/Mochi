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

// 14. Classic Smile Emoticon `:)` (Eyes + Cheerful Smiling Mouth)
const SMILE_EMOTICON: PixelGrid = [
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
];

// 15. Sad / Pouty Emoticon `:(` (Eyes + Downturned Pout Mouth)
const SAD_EMOTICON: PixelGrid = [
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
  [0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
];

// 16. Water Drop with Glowing Heart Core (Hydrated 💧💖)
const WATER_DROP_HEART: PixelGrid = [
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 0, 2, 2, 1, 1, 0],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [1, 1, 0, 2, 2, 2, 2, 2, 0, 1, 1],
  [0, 1, 1, 0, 2, 2, 2, 0, 1, 1, 0],
  [0, 0, 1, 1, 0, 2, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
];

// 17. Code Tag Brackets `</>` for developer coding mode
const CODE_TAGS_CENTERED: PixelGrid = [
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
];

// 18. Flaming Fire Face (`🔥`) for high-velocity typing/flow streak
const FIRE_FACE: PixelGrid = [
  [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 2, 2, 1, 2, 2, 1, 1, 0],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1],
  [0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0],
  [0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
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
  smile: {
    centered: true,
    eye: SMILE_EMOTICON,
    eyeColor: '#fde047',
    glowColor: '#eab308',
    intensity: 1.5,
    eyeOffset: 0,
  },
  sad: {
    centered: true,
    eye: SAD_EMOTICON,
    eyeColor: '#60a5fa',
    glowColor: '#3b82f6',
    intensity: 1.3,
    eyeOffset: 0,
  },
  hydrated: {
    centered: true,
    eye: WATER_DROP_HEART,
    eyeColor: '#00f7ff',
    glowColor: '#00f7ff',
    intensity: 1.6,
    eyeOffset: 0,
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
    eye: CODE_TAGS_CENTERED,
    eyeColor: '#00f7ff',
    glowColor: '#00f7ff',
    intensity: 1.7,
    eyeOffset: 0,
  },
  fire: {
    centered: true,
    eye: FIRE_FACE,
    eyeColor: '#ff9900',
    glowColor: '#ff2d55',
    intensity: 1.8,
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
              const isAccentPixel = val >= 2;
              const isFire = activeState === 'fire';
              ctx.shadowColor = isAccentPixel
                ? (isFire ? '#ff3b30' : '#f43f5e')
                : glowColor;
              ctx.fillStyle = isAccentPixel
                ? (isFire ? '#ff1e56' : '#ff3b88')
                : color;
              ctx.globalAlpha = Math.max(0, Math.min(1, alpha * (isAccentPixel ? 1 : val)));

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
      {/* 0. Cyberpunk Over-Ear Headphones (Active in Audio Listening / Vibing state) */}
      {state === 'listening' && (
        <div className="glow-orb-headphones" style={{ width: size, height: size }}>
          <svg
            className="headphones-svg"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="bandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
              <linearGradient id="cupShell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2d2b3b" />
                <stop offset="100%" stopColor="#0f1017" />
              </linearGradient>
              <filter id="neonPinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Padded Headband Cushion (hugs the top contour of the orb snugly) */}
            <path
              d="M 18 42 Q 50 10 82 42"
              stroke="#1a1a26"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Structural Outer Band with Cyberpunk Neon Glow */}
            <path
              d="M 16 41 Q 50 7 84 41"
              stroke="url(#bandGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonPinkGlow)"
            />
            {/* Top Specular Sheen on Band */}
            <path
              d="M 38 12 Q 50 9 62 12"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.8"
              fill="none"
            />

            {/* Left Hinge Joint */}
            <rect x="14" y="38" width="4" height="6" rx="1.5" fill="#f472b6" />
            {/* Right Hinge Joint */}
            <rect x="82" y="38" width="4" height="6" rx="1.5" fill="#f472b6" />

            {/* Left Over-Ear Cup */}
            <g className="earcup-assembly left">
              <rect
                x="6"
                y="34"
                width="14"
                height="32"
                rx="7"
                fill="url(#cupShell)"
                stroke="#f472b6"
                strokeWidth="1.8"
                filter="url(#neonPinkGlow)"
              />
              <rect x="8.5" y="36.5" width="9" height="27" rx="4.5" fill="#0c0d14" />
              <circle cx="13" cy="50" r="3.2" fill="#00f7ff" className="earcup-led-ring" />
              <circle cx="13" cy="50" r="1.4" fill="#ffffff" />
            </g>

            {/* Right Over-Ear Cup */}
            <g className="earcup-assembly right">
              <rect
                x="80"
                y="34"
                width="14"
                height="32"
                rx="7"
                fill="url(#cupShell)"
                stroke="#f472b6"
                strokeWidth="1.8"
                filter="url(#neonPinkGlow)"
              />
              <rect x="82.5" y="36.5" width="9" height="27" rx="4.5" fill="#0c0d14" />
              <circle cx="87" cy="50" r="3.2" fill="#00f7ff" className="earcup-led-ring" />
              <circle cx="87" cy="50" r="1.4" fill="#ffffff" />
            </g>
          </svg>
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
