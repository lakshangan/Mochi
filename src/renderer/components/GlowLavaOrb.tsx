import React, { useEffect, useRef } from 'react';
import { PetAnimationState } from '../../shared/types';
import '../styles/glow-lava-orb.css';

export interface GlowLavaOrbProps {
  state?: PetAnimationState;
  isSpeaking?: boolean;
  gaze?: { x: number; y: number };
  timerProgress?: number; // 0 to 1
  isTimerActive?: boolean;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const GlowLavaOrb: React.FC<GlowLavaOrbProps> = ({
  state = 'idle',
  isSpeaking = false,
  gaze = { x: 0, y: 0 },
  timerProgress = 0,
  isTimerActive = false,
  size = 170,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const speakingRef = useRef(isSpeaking);
  const gazeRef = useRef(gaze);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    speakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    gazeRef.current = gaze;
  }, [gaze]);

  // Face Rendering Engine inside the Glow Orb
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();

    // Eye interpolation states
    let curEyeWidth = 18;
    let curEyeHeight = 36;
    let curEyeCurve = 0; // positive = happy, negative = sleeping
    let curGlow = 1.0;
    let curPupilX = 0;
    let curPupilY = 0;

    // Mouth interpolation states
    let curMouthWidth = 18;
    let curMouthHeight = 4;
    let curMouthCurve = 4;
    let curMouthOpen = 0;
    let curMouthOpacity = 0.8;

    let speechPhase = 0;
    let blinkTimer = 0;
    let isBlinking = false;
    let blinkDuration = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const currentState = stateRef.current;
      const speaking = speakingRef.current;
      const targetGaze = gazeRef.current;

      // Natural random blinking
      blinkTimer += dt;
      if (blinkTimer > 3.5 + Math.sin(now * 0.001) * 1.5) {
        if (!isBlinking && currentState !== 'sleeping') {
          isBlinking = true;
          blinkDuration = 0;
          blinkTimer = 0;
        }
      }

      if (isBlinking) {
        blinkDuration += dt;
        if (blinkDuration > 0.16) {
          isBlinking = false;
        }
      }

      // Target geometry based on pet state
      let tgtEyeWidth = 18;
      let tgtEyeHeight = 36;
      let tgtEyeCurve = 0;
      let tgtGlow = 1.0;
      let tgtPupilX = Math.max(-1, Math.min(1, targetGaze.x)) * 6;
      let tgtPupilY = Math.max(-1, Math.min(1, targetGaze.y)) * 5;

      let tgtMouthWidth = 18;
      let tgtMouthHeight = 4;
      let tgtMouthCurve = 4;
      let tgtMouthOpen = 0;
      let tgtMouthOpacity = 0.8;

      if (isBlinking || currentState === 'blink') {
        tgtEyeHeight = 2.5;
        tgtEyeWidth = 20;
        tgtEyeCurve = 0;
        tgtGlow = 0.8;
      } else {
        switch (currentState) {
          case 'happy':
          case 'celebrating':
            tgtEyeHeight = 12;
            tgtEyeWidth = 22;
            tgtEyeCurve = 12; // Happy inverted crescent
            tgtGlow = 1.5;
            tgtPupilY = -3;
            tgtMouthWidth = 24;
            tgtMouthHeight = 12;
            tgtMouthCurve = 14;
            tgtMouthOpen = 0.7;
            tgtMouthOpacity = 0.95;
            break;

          case 'curious':
            tgtEyeHeight = 44;
            tgtEyeWidth = 20;
            tgtEyeCurve = 0;
            tgtGlow = 1.3;
            tgtMouthWidth = 10;
            tgtMouthHeight = 10;
            tgtMouthCurve = 0;
            tgtMouthOpen = 0.9; // Open cute 'o'
            tgtMouthOpacity = 0.9;
            break;

          case 'sleeping':
            tgtEyeHeight = 6;
            tgtEyeWidth = 20;
            tgtEyeCurve = -8; // Peaceful sleep curve
            tgtGlow = 0.4;
            tgtPupilX = 0;
            tgtPupilY = 0;
            tgtMouthWidth = 12;
            tgtMouthHeight = 2;
            tgtMouthCurve = 2;
            tgtMouthOpen = 0;
            tgtMouthOpacity = 0.35;
            break;

          case 'coding':
          case 'focused':
            tgtEyeHeight = 26;
            tgtEyeWidth = 20;
            tgtEyeCurve = 0;
            tgtGlow = 1.6;
            tgtMouthWidth = 16;
            tgtMouthHeight = 2.5;
            tgtMouthCurve = 2;
            tgtMouthOpen = 0;
            tgtMouthOpacity = 0.85;
            break;

          case 'listening':
            tgtEyeHeight = 32;
            tgtEyeWidth = 18;
            tgtEyeCurve = 4;
            tgtGlow = 1.4;
            tgtPupilY = Math.sin(now * 0.008) * 3;
            tgtMouthWidth = 20;
            tgtMouthHeight = 6;
            tgtMouthCurve = 8;
            tgtMouthOpen = 0.35;
            tgtMouthOpacity = 0.9;
            break;

          case 'typing':
            tgtEyeHeight = 30;
            tgtEyeWidth = 18;
            tgtEyeCurve = 0;
            tgtGlow = 1.3;
            tgtPupilX += (Math.random() - 0.5) * 2;
            tgtMouthWidth = 16;
            tgtMouthHeight = 3;
            tgtMouthCurve = 3;
            tgtMouthOpen = 0;
            tgtMouthOpacity = 0.75;
            break;

          case 'idle':
          default:
            tgtEyeHeight = 36;
            tgtEyeWidth = 18;
            tgtEyeCurve = 0;
            tgtGlow = 1.0;
            tgtMouthWidth = 16;
            tgtMouthHeight = 3.5;
            tgtMouthCurve = 3.5;
            tgtMouthOpen = 0;
            tgtMouthOpacity = 0.75;
            break;
        }
      }

      // Smooth lerp
      const lerpFactor = Math.min(1, dt * 14);
      curEyeWidth += (tgtEyeWidth - curEyeWidth) * lerpFactor;
      curEyeHeight += (tgtEyeHeight - curEyeHeight) * lerpFactor;
      curEyeCurve += (tgtEyeCurve - curEyeCurve) * lerpFactor;
      curGlow += (tgtGlow - curGlow) * lerpFactor;
      curPupilX += (tgtPupilX - curPupilX) * lerpFactor;
      curPupilY += (tgtPupilY - curPupilY) * lerpFactor;

      curMouthWidth += (tgtMouthWidth - curMouthWidth) * lerpFactor;
      curMouthHeight += (tgtMouthHeight - curMouthHeight) * lerpFactor;
      curMouthCurve += (tgtMouthCurve - curMouthCurve) * lerpFactor;
      curMouthOpen += (tgtMouthOpen - curMouthOpen) * lerpFactor;
      curMouthOpacity += (tgtMouthOpacity - curMouthOpacity) * lerpFactor;

      if (speaking) {
        speechPhase += dt * 14;
      }

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const eyeSpacing = 34;

      // Draw Left & Right Eyes
      drawEye(ctx, cx - eyeSpacing + curPupilX, cy - 6 + curPupilY, curEyeWidth, curEyeHeight, curEyeCurve, curGlow);
      drawEye(ctx, cx + eyeSpacing + curPupilX, cy - 6 + curPupilY, curEyeWidth, curEyeHeight, curEyeCurve, curGlow);

      // Draw Expressive Cyber Mouth
      drawMouth(
        ctx,
        cx + curPupilX * 0.5,
        cy + 26 + curPupilY * 0.5,
        curMouthWidth,
        curMouthHeight,
        curMouthCurve,
        curMouthOpen,
        curMouthOpacity,
        speaking,
        speechPhase
      );

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const drawEye = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    curve: number,
    glow: number
  ) => {
    ctx.save();
    ctx.shadowBlur = 18 * glow;
    ctx.shadowColor = 'rgba(0, 247, 255, 0.95)';
    ctx.fillStyle = '#ffffff';

    if (curve > 2) {
      // Happy inverted crescent
      ctx.lineWidth = Math.min(w * 0.42, 6.5);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y + curve * 0.45, w * 0.78, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (curve < -2) {
      // Sleeping downward curve
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y - Math.abs(curve) * 0.45, w * 0.78, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (h <= 3) {
      // Blink line
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - w * 0.5, y);
      ctx.lineTo(x + w * 0.5, y);
      ctx.stroke();
    } else {
      // Capsule Eye
      ctx.beginPath();
      const r = Math.min(w / 2, h / 2);
      ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
      ctx.fill();

      // Specular pupil reflection glints
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(x - w * 0.16, y - h * 0.2, Math.max(2, w * 0.22), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(0, 247, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(x + w * 0.18, y + h * 0.16, Math.max(1.5, w * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawMouth = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    curve: number,
    open: number,
    opacity: number,
    speaking: boolean,
    speechPhase: number
  ) => {
    if (opacity <= 0.05) return;

    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(0, 247, 255, 0.75)';

    let finalOpen = open;
    let finalH = h;
    let finalW = w;

    if (speaking) {
      const talkPulse = Math.abs(Math.sin(speechPhase));
      finalOpen = Math.max(finalOpen, talkPulse * 0.8);
      finalH = Math.max(finalH, 4 + talkPulse * 7);
      finalW = finalW + talkPulse * 3;
    }

    if (finalOpen > 0.3) {
      // Open cute mouth
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.ellipse(x, y, finalW * 0.45, Math.max(2.5, finalH * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cyber curved/straight line
      ctx.lineWidth = Math.max(2.2, finalH);
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;

      ctx.beginPath();
      if (Math.abs(curve) > 2) {
        ctx.arc(x, y - curve * 0.5, finalW * 0.55, Math.PI * 0.2, Math.PI * 0.8);
      } else {
        ctx.moveTo(x - finalW * 0.4, y);
        ctx.lineTo(x + finalW * 0.4, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  };

  const circumference = 2 * Math.PI * 80;
  const strokeOffset = circumference - Math.max(0, Math.min(1, timerProgress)) * circumference;

  return (
    <div
      className={`glow-orb-wrapper ${className}`}
      data-state={state}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* 1. Outer Soft Glow Halo */}
      <div className="glow-orb-halo" />

      {/* 2. Optional Countdown Timer Orbital Ring */}
      {isTimerActive && (
        <div className="glow-orb-timer-ring">
          <svg className="glow-orb-timer-svg" viewBox="0 0 170 170">
            <circle className="glow-orb-timer-track" cx="85" cy="85" r="80" />
            <circle
              className="glow-orb-timer-progress"
              cx="85"
              cy="85"
              r="80"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          </svg>
        </div>
      )}

      {/* 3. The Glass Sphere Body from CodePen */}
      <div className="glow-orb-sphere">
        {/* Animated Fluid Lava Blobs */}
        <div className="glow-orb-lava">
          <div className="lava-blob lava-blob-1" />
          <div className="lava-blob lava-blob-2" />
          <div className="lava-blob lava-blob-3" />
        </div>

        {/* Realistic Physical Specular Curvature Reflections */}
        <div className="glow-orb-specular" />
        <div className="glow-orb-bottom-rim" />

        {/* Embedded Living Face Canvas */}
        <div className="glow-orb-face-container">
          <canvas
            ref={canvasRef}
            className="glow-orb-face-canvas"
            width={240}
            height={240}
          />
        </div>
      </div>
    </div>
  );
};
