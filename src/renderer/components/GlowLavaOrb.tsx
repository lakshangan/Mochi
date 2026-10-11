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

// ─── Pixel LED renderer constants ─────────────────────────────────────────────
const PX   = 10;        // each LED block size (logical px)
const GAP  = 3;         // gap between LEDs
const CELL = PX + GAP;  // 13 px per grid cell

type PixelGrid = (0 | 1 | number)[][];

interface Expression {
  eye:       PixelGrid;
  rightEye?: PixelGrid;   // if omitted, mirrors left eye horizontally
  mouth:     PixelGrid;
  eyeColor:  string;
  glowColor: string;
  intensity: number;
  eyeOffset: number;      // half-distance center→each eye center
}

function mirrorGrid(g: PixelGrid): PixelGrid {
  return g.map(row => [...row].reverse());
}

// ─── Expression Library (Divoom-inspired pixel LED faces) ─────────────────────
const EXPR: Partial<Record<string, Expression>> = {
  idle: {
    eye:    [[1,1,1],[1,1,1],[1,1,1],[1,1,1]],
    mouth:  [[0,0,1,1,1,0,0]],
    eyeColor: '#ffffff', glowColor: '#00c8ff', intensity: 1.0, eyeOffset: 30,
  },
  blink: {
    eye:   [[1,1,1,1,1]],
    mouth: [[0,1,1,1,0]],
    eyeColor: '#ffffff', glowColor: '#00c8ff', intensity: 0.65, eyeOffset: 28,
  },
  happy: {
    eye:   [[1,0,1],[1,0,1],[0,1,0]],
    mouth: [[0,1,1,1,1,1,0],[1,0,0,0,0,0,1]],
    eyeColor: '#fde047', glowColor: '#f59e0b', intensity: 1.6, eyeOffset: 32,
  },
  celebrating: {
    eye:   [[0,1,0],[1,1,1],[0,1,0]],
    mouth: [[0,1,1,1,1,1,0],[1,0,0,0,0,0,1]],
    eyeColor: '#fde047', glowColor: '#f97316', intensity: 2.0, eyeOffset: 32,
  },
  curious: {
    eye:   [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]],
    mouth: [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0]],
    eyeColor: '#a5f3fc', glowColor: '#0284c7', intensity: 1.3, eyeOffset: 35,
  },
  sleeping: {
    eye:   [[1,1,1,1,1]],
    mouth: [[0,0,1,1,1,0,0]],
    eyeColor: 'rgba(180,190,255,0.45)', glowColor: '#818cf8', intensity: 0.32, eyeOffset: 28,
  },
  coding: {
    eye:      [[1,1,1,1],[1,1,1,1],[1,1,1,1]],
    rightEye: [[0,1,1,1],[0,1,1,1],[0,1,1,1]],   // pupil shifted (looking at screen)
    mouth:    [[0,0,1,1,1,0,0]],
    eyeColor: '#00f7ff', glowColor: '#00f7ff', intensity: 1.85, eyeOffset: 33,
  },
  focused: {
    eye:   [[1,1,1],[1,1,1],[1,1,1]],
    mouth: [[1,1,1,1]],
    eyeColor: '#a5f3fc', glowColor: '#0284c7', intensity: 1.4, eyeOffset: 30,
  },
  typing: {
    eye:      [[0,0,1],[0,1,0],[0,0,1]],   // > shape
    rightEye: [[1,0,0],[0,1,0],[1,0,0]],   // < shape
    mouth:    [[0,1,1,1,0]],
    eyeColor: '#c084fc', glowColor: '#a855f7', intensity: 1.55, eyeOffset: 28,
  },
  listening: {
    eye:   [[0,1,0],[1,1,1],[1,1,1],[0,1,0]],
    mouth: [[0,1,0],[1,1,1],[0,1,0]],
    eyeColor: '#f9a8d4', glowColor: '#ec4899', intensity: 1.45, eyeOffset: 30,
  },
  thinking: {
    eye:      [[0,1,1],[1,1,0],[1,1,0]],
    rightEye: [[1,1,0],[0,1,1],[0,1,1]],
    mouth:    [[0,0,0,1,1,1]],
    eyeColor: '#a5f3fc', glowColor: '#6366f1', intensity: 1.2, eyeOffset: 29,
  },
  reminding: {
    eye:      [[1,1,0],[0,1,1],[1,1,0]],
    rightEye: [[0,1,1],[1,1,0],[0,1,1]],
    mouth:    [[0,1,1,1,0],[1,0,0,0,1]],
    eyeColor: '#fde047', glowColor: '#f59e0b', intensity: 1.6, eyeOffset: 30,
  },
  waking: {
    eye:   [[1,1,1,1],[1,1,1,1]],
    mouth: [[0,1,1,1,0]],
    eyeColor: '#a5f3fc', glowColor: '#00c8ff', intensity: 0.85, eyeOffset: 30,
  },
  dragging: {
    eye:   [[1,0,1],[0,1,0],[1,0,1]],
    mouth: [[1,1,1,1,1]],
    eyeColor: '#ffffff', glowColor: '#00c8ff', intensity: 1.0, eyeOffset: 29,
  },
  working: {
    eye:   [[1,1,1,1],[1,1,1,1],[1,1,1,1]],
    mouth: [[1,1,1,1,1]],
    eyeColor: '#00f7ff', glowColor: '#0284c7', intensity: 1.65, eyeOffset: 33,
  },
  walking: {
    eye:   [[1,1,1],[1,1,1],[1,1,1]],
    mouth: [[0,1,1,1,0]],
    eyeColor: '#ffffff', glowColor: '#00c8ff', intensity: 1.1, eyeOffset: 29,
  },
};

const getExpr = (state: string): Expression =>
  (EXPR[state] ?? EXPR['idle']) as Expression;

// ─── Component ────────────────────────────────────────────────────────────────
export const GlowLavaOrb: React.FC<GlowLavaOrbProps> = ({
  state      = 'idle',
  isSpeaking = false,
  isTyping   = false,
  typingBurst = false,
  timerProgress = 0,
  isTimerActive = false,
  size      = 170,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live refs so render loop reads latest props without re-registering effect
  const stateRef     = useRef(state);
  const speakRef     = useRef(isSpeaking);
  const typingRef    = useRef(isTyping);

  useEffect(() => { stateRef.current   = state;     }, [state]);
  useEffect(() => { speakRef.current   = isSpeaking; }, [isSpeaking]);
  useEffect(() => { typingRef.current  = isTyping;   }, [isTyping]);

  // ── Main canvas render loop ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    // Transition state
    let prevState = stateRef.current;
    let fromExpr  = getExpr(prevState);
    let toExpr    = fromExpr;
    let transAlpha = 1.0;   // 0 = fromExpr, 1 = toExpr (fully arrived)

    // Simple rising-dot particle pool
    const dots: {
      x: number; y: number; vy: number; alpha: number; color: string; r: number;
    }[] = [];
    let dotTimer = 0;

    // ── Draw a pixel grid centered at (cx, cy) ───────────────────────────
    const drawGrid = (
      grid: PixelGrid,
      cx: number, cy: number,
      color: string, glowColor: string,
      intensity: number, alpha: number,
    ) => {
      if (alpha < 0.008) return;
      const cols = Math.max(...grid.map(r => r.length));
      const rows = grid.length;
      const totalW = cols * CELL - GAP;
      const totalH = rows * CELL - GAP;
      const sx = cx - totalW / 2;
      const sy = cy - totalH / 2;

      ctx.save();
      ctx.shadowBlur  = 18 * intensity;
      ctx.shadowColor = glowColor;
      ctx.fillStyle   = color;

      for (let r = 0; r < rows; r++) {
        const row = grid[r];
        for (let c = 0; c < row.length; c++) {
          const val = row[c] ?? 0;
          if (val > 0) {
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha * val));
            ctx.beginPath();
            ctx.roundRect(sx + c * CELL, sy + r * CELL, PX, PX, 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    };

    // ── Draw a full expression (both eyes + mouth) ───────────────────────
    const drawExpression = (
      expr: Expression, alpha: number,
      eyeY: number, mouthY: number, cx: number,
    ) => {
      if (alpha < 0.008) return;
      const lGrid = expr.eye;
      const rGrid = expr.rightEye ?? mirrorGrid(lGrid);

      drawGrid(lGrid, cx - expr.eyeOffset, eyeY,    expr.eyeColor, expr.glowColor, expr.intensity, alpha);
      drawGrid(rGrid, cx + expr.eyeOffset, eyeY,    expr.eyeColor, expr.glowColor, expr.intensity, alpha);
      if (expr.mouth.length > 0) {
        drawGrid(expr.mouth, cx, mouthY, expr.eyeColor, expr.glowColor, expr.intensity * 0.75, alpha * 0.85);
      }
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const curState  = stateRef.current;
      const speaking  = speakRef.current;
      const isTypingNow = typingRef.current || curState === 'coding' || curState === 'typing';

      // Detect state change → begin cross-fade
      if (curState !== prevState) {
        fromExpr   = toExpr;
        toExpr     = getExpr(curState);
        transAlpha = 0;
        prevState  = curState;
      }
      if (transAlpha < 1) {
        transAlpha = Math.min(1, transAlpha + dt / 0.26);  // 260 ms cross-fade
      }

      // ── Retina / HiDPI scaling ─────────────────────────────────────────
      const dpr   = Math.min(window.devicePixelRatio || 1, 3);
      const logW  = size;
      const logH  = size;
      const physW = Math.round(logW * dpr);
      const physH = Math.round(logH * dpr);
      if (canvas.width !== physW || canvas.height !== physH) {
        canvas.width  = physW;
        canvas.height = physH;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, logW, logH);

      const cx    = logW / 2;
      const cy    = logH / 2;
      // subtle typing bob
      const bobY  = isTypingNow ? Math.sin(now * 0.016) * 1.6 : 0;
      const eyeY  = cy - 8 + bobY;
      const mouthY = cy + 26 + bobY;

      // ── Cross-fade expressions ─────────────────────────────────────────
      if (transAlpha < 1) {
        drawExpression(fromExpr, 1 - transAlpha, eyeY, mouthY, cx);
      }
      drawExpression(toExpr, transAlpha, eyeY, mouthY, cx);

      // ── Speaking mouth pulse overlay ────────────────────────────────────
      if (speaking && transAlpha > 0.5) {
        const pulse = Math.abs(Math.sin(now * 0.014));
        if (pulse > 0.3) {
          const extraRow: PixelGrid = [[pulse > 0.6 ? 1 : 0.4, 1, pulse > 0.7 ? 1 : 0.4]];
          drawGrid(extraRow, cx, mouthY + 16, toExpr.eyeColor, toExpr.glowColor, toExpr.intensity * 0.6, transAlpha * 0.6);
        }
      }

      // ── Ambient rising dots ────────────────────────────────────────────
      dotTimer += dt;
      const dotInterval = curState === 'celebrating' ? 0.12
        : curState === 'happy' ? 0.7
        : isTypingNow ? 0.55
        : 2.8;
      if (dotTimer >= dotInterval && dots.length < 12) {
        dotTimer = 0;
        dots.push({
          x: cx + (Math.random() - 0.5) * 42,
          y: eyeY + 14,
          vy: -(20 + Math.random() * 18),
          alpha: 0.7,
          color: toExpr.glowColor,
          r: 2 + Math.random() * 2.2,
        });
      }
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        d.y    += d.vy * dt;
        d.alpha -= dt * 0.6;
        if (d.alpha <= 0) { dots.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = Math.max(0, d.alpha);
        ctx.shadowBlur  = 7;
        ctx.shadowColor = d.color;
        ctx.fillStyle   = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [size]);

  // ── Timer ring geometry ───────────────────────────────────────────────────
  const circumference = 2 * Math.PI * 80;
  const strokeOffset  = circumference - Math.max(0, Math.min(1, timerProgress)) * circumference;

  return (
    <div
      className={`glow-orb-wrapper ${className}`}
      data-state={state}
      data-typing={isTyping}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* Outer halo bloom */}
      <div className="glow-orb-halo" />

      {/* Countdown timer orbital ring */}
      {isTimerActive && (
        <div className="glow-orb-timer-ring">
          <svg className="glow-orb-timer-svg" viewBox="0 0 170 170">
            <circle className="glow-orb-timer-track"    cx="85" cy="85" r="80" />
            <circle
              className="glow-orb-timer-progress"
              cx="85" cy="85" r="80"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
        </div>
      )}

      {/* Glass sphere body */}
      <div className="glow-orb-sphere">
        {/* Fluid lava blobs (subtle depth/atmosphere) */}
        <div className="glow-orb-lava">
          <div className="lava-blob lava-blob-1" />
          <div className="lava-blob lava-blob-2" />
          <div className="lava-blob lava-blob-3" />
        </div>

        {/* Physical glass specular highlights */}
        <div className="glow-orb-specular" />
        <div className="glow-orb-bottom-rim" />

        {/* Pixel LED face canvas */}
        <div className="glow-orb-face-container">
          <canvas ref={canvasRef} className="glow-orb-face-canvas" />
        </div>
      </div>
    </div>
  );
};
