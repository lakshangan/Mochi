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

// ─── Micro-LED Grid Configuration ─────────────────────────────────────────────
// Sized so expressions occupy ~55% of the 170px orb with high-definition clarity
const PX = 6.5;         // Size of each LED pixel
const GAP = 2.5;        // Gap between LED pixels
const CELL = PX + GAP;  // 9.0px cell pitch

type PixelGrid = number[][];

interface Expression {
  // If centered is true, 'eye' is drawn once at center (e.g. Heart, Sunglasses)
  centered?: boolean;
  eye: PixelGrid;
  rightEye?: PixelGrid;   // If omitted and not centered, mirrors left eye
  eyeColor: string;
  glowColor: string;
  intensity: number;
  eyeOffset: number;      // Distance from center to each eye center
  dimEyeColor?: string;
}

function mirrorGrid(g: PixelGrid): PixelGrid {
  return g.map((row) => [...row].reverse());
}

// ─── Pixel Expression Library (Faithfully matching reference Divoom LED art) ───
// Reference: 4-6 columns, 7-8 rows per eye for crisp, instantly recognizable faces

// 1. 待机 (Standby / Idle): Iconic 4x8 rounded capsules
const PILL_EYE: PixelGrid = [
  [0, 1, 1, 0],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [1, 1, 1, 1],
  [0, 1, 1, 0],
];

// Blink: single horizontal bar
const BLINK_EYE: PixelGrid = [
  [1, 1, 1, 1, 1, 1],
];

// 2. 微笑 (Smile / Joy / Happy `∩ ∩`): Inverted U arches
const ARCH_HAPPY_EYE: PixelGrid = [
  [0, 1, 1, 0],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
];

// 3. 闭眼 (Closed / Sleeping `∪ ∪`): Gentle curved U
const SLEEP_EYE: PixelGrid = [
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [0, 1, 1, 0],
];

// 4. 激动 / Typing (Excited squeeze `> <`): Bold 5x7 chevrons (2px thick)
const CHEVRON_LEFT: PixelGrid = [
  [1, 1, 0, 0, 0],
  [0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0],
  [0, 0, 0, 1, 1],
  [0, 0, 1, 1, 0],
  [0, 1, 1, 0, 0],
  [1, 1, 0, 0, 0],
];

// 5. 狡黠 (Mischievous / Wink): Left standard pill, Right `<` wink
const WINK_CHEVRON: PixelGrid = [
  [0, 0, 0, 1],
  [0, 0, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [0, 1, 1, 0],
  [0, 0, 1, 1],
  [0, 0, 0, 1],
];

// 6. 爱心 (Heart / Loved / Celebrating): Big centered pixel heart
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

// 7. 墨镜 (Sunglasses / Dev Boss / Coding): Iconic pixel sunglasses across face
const SHADES_CENTERED: PixelGrid = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
];

// 8. 星星 (Sparkle / Star eyes): Glint inside box
const SPARKLE_EYE: PixelGrid = [
  [0, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1],
  [1, 0, 1, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

// 9. 冷淡 (Deadpan / Chill): Flat horizontal bars
const DEADPAN_BAR: PixelGrid = [
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
];

// 10. 皱眉 (Skeptical / Thinking): Eyebrow dot over bar
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

// 11. 生气 / 专注 (Determined / Angry `\ /`): Sharp angled eyes
const ANGRY_EYE_LEFT: PixelGrid = [
  [1, 1, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 1, 1],
];

// 12. 吓 (Shocked / Wide open `O O`): Hollow capsules
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

// 13. 斜视 (Side glance / Curious): Eyes shifted to the left
const SIDE_GLANCE_EYE: PixelGrid = [
  [1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 1, 1, 1, 1],
];

// Complete map of all pet animation states to premium LED expressions
const EXPR_MAP: Record<PetAnimationState, Expression> = {
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
    eye: SIDE_GLANCE_EYE,
    rightEye: SIDE_GLANCE_EYE, // both look same direction
    eyeColor: '#38bdf8',
    glowColor: '#0284c7',
    intensity: 1.2,
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
    eye: WINK_CHEVRON,
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
    eye: CHEVRON_LEFT,
    // rightEye is mirrored CHEVRON_LEFT (<)
    eyeColor: '#c084fc',
    glowColor: '#a855f7',
    intensity: 1.6,
    eyeOffset: 27,
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
    eye: ANGRY_EYE_LEFT,
    // rightEye will mirror to /
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
  timerProgress = 0,
  isTimerActive = false,
  size = 170,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stateRef = useRef(state);
  const isTypingRef = useRef(isTyping);
  const isSpeakingRef = useRef(isSpeaking);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isTypingRef.current = isTyping; }, [isTyping]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    // Cross-fade state transitions
    let prevState = stateRef.current;
    let fromExpr = EXPR_MAP[prevState] || EXPR_MAP.idle;
    let toExpr = fromExpr;
    let transAlpha = 1.0;

    // Natural blink timer for idle state
    let nextBlinkTime = performance.now() + 2500 + Math.random() * 2000;
    let isBlinking = false;
    let blinkEndTime = 0;

    // Particle embers (ultra subtle)
    const embers: { x: number; y: number; vy: number; alpha: number; color: string; size: number }[] = [];
    let emberTimer = 0;

    // Helper: draw single pixel grid
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
      // LED Glow halo
      ctx.shadowBlur = Math.round(10 * intensity);
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

            // Physical LED bead with subtle rounded corners
            ctx.beginPath();
            ctx.roundRect(x, y, PX, PX, 1.8);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    };

    // Helper: draw full face expression
    const drawFace = (expr: Expression, alpha: number, cx: number, cy: number) => {
      if (alpha < 0.01) return;

      if (expr.centered) {
        // Single central motif (Heart, Sunglasses)
        drawGrid(expr.eye, cx, cy, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
      } else {
        // Two distinct eyes
        const lGrid = expr.eye;
        const rGrid = expr.rightEye ?? mirrorGrid(lGrid);

        drawGrid(lGrid, cx - expr.eyeOffset, cy, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
        drawGrid(rGrid, cx + expr.eyeOffset, cy, expr.eyeColor, expr.glowColor, expr.intensity, alpha);
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const activeState = stateRef.current;
      const typingNow = isTypingRef.current || activeState === 'coding' || activeState === 'typing';

      // ── Handle spontaneous natural blinking when idle ───────────────────
      if (activeState === 'idle' && !isBlinking && now > nextBlinkTime) {
        isBlinking = true;
        blinkEndTime = now + 120; // quick 120ms blink
      }
      if (isBlinking && now > blinkEndTime) {
        isBlinking = false;
        nextBlinkTime = now + 3200 + Math.random() * 2800;
      }

      const effectiveState = (isBlinking && activeState === 'idle') ? 'blink' : activeState;

      // ── State Transition cross-fade ──────────────────────────────────────
      if (effectiveState !== prevState) {
        fromExpr = toExpr;
        toExpr = EXPR_MAP[effectiveState] || EXPR_MAP.idle;
        transAlpha = 0;
        prevState = effectiveState;
      }
      if (transAlpha < 1) {
        transAlpha = Math.min(1, transAlpha + dt / 0.18); // 180ms fast crisp transition
      }

      // ── HiDPI / Retina Canvas Setup ───────────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const logW = size;
      const logH = size;
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

      // Subtle dynamic bounce when typing / coding
      const typingBob = typingNow ? Math.sin(now * 0.018) * 1.5 : 0;
      const faceY = cy + typingBob;

      // ── Render Face Expressions ──────────────────────────────────────────
      if (transAlpha < 1) {
        drawFace(fromExpr, 1 - transAlpha, cx, faceY);
      }
      drawFace(toExpr, transAlpha, cx, faceY);

      // ── Subtle Floating LED Sparkles when celebrating / music ────────────
      emberTimer += dt;
      const shouldSpawnEmber = activeState === 'celebrating' || activeState === 'happy' || activeState === 'listening';
      if (shouldSpawnEmber && emberTimer > 0.35 && embers.length < 8) {
        emberTimer = 0;
        embers.push({
          x: cx + (Math.random() - 0.5) * 60,
          y: faceY + 18,
          vy: -(16 + Math.random() * 14),
          alpha: 0.8,
          color: toExpr.glowColor,
          size: 2 + Math.random() * 1.5,
        });
      }

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.y += p.vy * dt;
        p.alpha -= dt * 0.5;
        if (p.alpha <= 0) {
          embers.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
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
  }, [size]);

  // Timer ring geometry
  const circumference = 2 * Math.PI * 80;
  const strokeOffset = circumference - Math.max(0, Math.min(1, timerProgress)) * circumference;

  return (
    <div
      className={`glow-orb-wrapper ${className}`}
      data-state={state}
      data-typing={isTyping}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* 1. Precision Ethereal Ambient Halo Bloom */}
      <div className="glow-orb-halo" />

      {/* 2. Optional Orbital Timer Progress Ring */}
      {isTimerActive && (
        <div className="glow-orb-timer-ring">
          <svg className="glow-orb-timer-svg" viewBox="0 0 170 170">
            <circle className="glow-orb-timer-track" cx="85" cy="85" r="80" />
            <circle
              className="glow-orb-timer-progress"
              cx="85" cy="85" r="80"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
        </div>
      )}

      {/* 3. Deep OLED Glass Chassis */}
      <div className="glow-orb-sphere">
        {/* Subtle dark internal ambient depth */}
        <div className="glow-orb-ambient-depth" />

        {/* Precision Optical Edge Reflection Arc (Razor-thin Apple glass edge) */}
        <div className="glow-orb-lens-sheen" />

        {/* Micro-LED Display Canvas */}
        <div className="glow-orb-face-container">
          <canvas ref={canvasRef} className="glow-orb-face-canvas" />
        </div>
      </div>
    </div>
  );
};
