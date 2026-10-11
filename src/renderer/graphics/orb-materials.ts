import * as THREE from 'three';
import { PetAnimationState } from '../../shared/types';

export interface EyeState {
  width: number;
  height: number;
  spacing: number;
  curve: number; // positive = happy curve, negative = sleeping curve, 0 = straight
  roundness: number;
  pupilX: number;
  pupilY: number;
  glowIntensity: number;
  color: string;
}

export interface MouthState {
  width: number;
  height: number;
  curve: number; // positive = smile, negative = frown, 0 = neutral
  open: number;  // 0 = line, 1 = open 'o'
  opacity: number;
}

export class FaceTextureManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;

  // Animation values (current interpolated)
  private currentEye: EyeState;
  private targetEye: EyeState;
  private currentMouth: MouthState;
  private targetMouth: MouthState;

  private auraAngle = 0;
  private breathPhase = 0;
  private speechWave = 0;
  private isSpeaking = false;
  private timerActive = false;
  private timerProgress = 0;
  private timerText = '';
  private currentState: PetAnimationState = 'idle';

  constructor(size = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not create 2D canvas context for face texture');
    this.ctx = context;

    this.currentEye = {
      width: 22,
      height: 48,
      spacing: 52,
      curve: 0,
      roundness: 11,
      pupilX: 0,
      pupilY: 0,
      glowIntensity: 1.0,
      color: '#ffffff',
    };
    this.targetEye = { ...this.currentEye };

    this.currentMouth = {
      width: 20,
      height: 4,
      curve: 4,
      open: 0,
      opacity: 0.85,
    };
    this.targetMouth = { ...this.currentMouth };

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    this.draw();
  }

  public setSpeaking(speaking: boolean) {
    this.isSpeaking = speaking;
  }

  public setTimer(active: boolean, progress = 0, remainingText = '') {
    this.timerActive = active;
    this.timerProgress = progress;
    this.timerText = remainingText;
  }

  public setExpression(
    state: PetAnimationState,
    targetGaze: { x: number; y: number } = { x: 0, y: 0 }
  ): void {
    this.currentState = state;
    const gazeX = Math.max(-1, Math.min(1, targetGaze.x)) * 8;
    const gazeY = Math.max(-1, Math.min(1, targetGaze.y)) * 6;

    switch (state) {
      case 'blink':
        this.targetEye.height = 3;
        this.targetEye.width = 24;
        this.targetEye.curve = 0;
        this.targetEye.glowIntensity = 0.8;
        break;

      case 'happy':
      case 'celebrating':
        this.targetEye.height = 14;
        this.targetEye.width = 28;
        this.targetEye.curve = 14; // Happy inverted crescent
        this.targetEye.glowIntensity = 1.6;
        this.targetEye.pupilX = gazeX;
        this.targetEye.pupilY = -4;

        this.targetMouth.width = 28;
        this.targetMouth.height = 14;
        this.targetMouth.curve = 16;
        this.targetMouth.open = 0.8;
        this.targetMouth.opacity = 1.0;
        break;

      case 'curious':
        this.targetEye.height = 54;
        this.targetEye.width = 26;
        this.targetEye.curve = 0;
        this.targetEye.glowIntensity = 1.4;
        this.targetEye.pupilX = gazeX * 1.2;
        this.targetEye.pupilY = gazeY * 1.2;

        this.targetMouth.width = 12;
        this.targetMouth.height = 12;
        this.targetMouth.curve = 0;
        this.targetMouth.open = 1.0; // Cute little 'o'
        this.targetMouth.opacity = 0.9;
        break;

      case 'sleeping':
        this.targetEye.height = 8;
        this.targetEye.width = 24;
        this.targetEye.curve = -10; // Calm sleeping curve
        this.targetEye.glowIntensity = 0.45;
        this.targetEye.pupilX = 0;
        this.targetEye.pupilY = 0;

        this.targetMouth.width = 14;
        this.targetMouth.height = 2;
        this.targetMouth.curve = 2;
        this.targetMouth.open = 0;
        this.targetMouth.opacity = 0.4;
        break;

      case 'coding':
      case 'focused':
        // Focused intelligent cyber gaze
        this.targetEye.height = 34;
        this.targetEye.width = 24;
        this.targetEye.curve = 0;
        this.targetEye.glowIntensity = 1.6;
        this.targetEye.pupilX = gazeX * 0.7;
        this.targetEye.pupilY = gazeY * 0.7;

        this.targetMouth.width = 18;
        this.targetMouth.height = 3;
        this.targetMouth.curve = 3;
        this.targetMouth.open = 0;
        this.targetMouth.opacity = 0.8;
        break;

      case 'listening':
        this.targetEye.height = 42;
        this.targetEye.width = 24;
        this.targetEye.curve = 4;
        this.targetEye.glowIntensity = 1.5;
        this.targetEye.pupilX = gazeX;
        this.targetEye.pupilY = gazeY;

        this.targetMouth.width = 22;
        this.targetMouth.height = 8;
        this.targetMouth.curve = 10;
        this.targetMouth.open = 0.4;
        this.targetMouth.opacity = 0.95;
        break;

      case 'typing':
        this.targetEye.height = 38;
        this.targetEye.width = 22;
        this.targetEye.curve = 0;
        this.targetEye.glowIntensity = 1.3;
        this.targetEye.pupilX = gazeX + (Math.random() - 0.5) * 3;
        this.targetEye.pupilY = gazeY + (Math.random() - 0.5) * 2;

        this.targetMouth.width = 16;
        this.targetMouth.height = 3;
        this.targetMouth.curve = 4;
        this.targetMouth.open = 0;
        this.targetMouth.opacity = 0.75;
        break;

      case 'idle':
      default:
        this.targetEye.height = 48;
        this.targetEye.width = 22;
        this.targetEye.curve = 0;
        this.targetEye.glowIntensity = 1.0;
        this.targetEye.pupilX = gazeX;
        this.targetEye.pupilY = gazeY;

        this.targetMouth.width = 16;
        this.targetMouth.height = 4;
        this.targetMouth.curve = 4;
        this.targetMouth.open = 0;
        this.targetMouth.opacity = 0.7;
        break;
    }
  }

  public update(delta: number): void {
    const lerpSpeed = Math.min(1.0, delta * 14);

    // Smooth eye interpolation
    this.currentEye.width += (this.targetEye.width - this.currentEye.width) * lerpSpeed;
    this.currentEye.height += (this.targetEye.height - this.currentEye.height) * lerpSpeed;
    this.currentEye.curve += (this.targetEye.curve - this.currentEye.curve) * lerpSpeed;
    this.currentEye.glowIntensity += (this.targetEye.glowIntensity - this.currentEye.glowIntensity) * lerpSpeed;
    this.currentEye.pupilX += (this.targetEye.pupilX - this.currentEye.pupilX) * lerpSpeed;
    this.currentEye.pupilY += (this.targetEye.pupilY - this.currentEye.pupilY) * lerpSpeed;

    // Smooth mouth interpolation
    this.currentMouth.width += (this.targetMouth.width - this.currentMouth.width) * lerpSpeed;
    this.currentMouth.height += (this.targetMouth.height - this.currentMouth.height) * lerpSpeed;
    this.currentMouth.curve += (this.targetMouth.curve - this.currentMouth.curve) * lerpSpeed;
    this.currentMouth.open += (this.targetMouth.open - this.currentMouth.open) * lerpSpeed;
    this.currentMouth.opacity += (this.targetMouth.opacity - this.currentMouth.opacity) * lerpSpeed;

    this.auraAngle += delta * 0.8;
    this.breathPhase += delta * 2.0;

    if (this.isSpeaking) {
      this.speechWave += delta * 12.0;
    }

    this.draw();
    this.texture.needsUpdate = true;
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Siri / Gemini Fluid Iridescent Aura Core
    // Layer 1: Multi-stop Radial Gradient
    const auraRadius = 180 + Math.sin(this.breathPhase) * 6;
    const radial = ctx.createRadialGradient(cx, cy, 20, cx, cy, auraRadius);

    // Gemini colors: Cyan, Royal Blue, Violet, Amber micro-accent
    radial.addColorStop(0, 'rgba(0, 247, 255, 0.35)');
    radial.addColorStop(0.35, 'rgba(99, 102, 241, 0.28)');
    radial.addColorStop(0.7, 'rgba(168, 85, 247, 0.18)');
    radial.addColorStop(0.9, 'rgba(236, 72, 153, 0.08)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Layer 2: Siri-style rotating iridescent color halo
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.auraAngle);
    const conic = ctx.createConicGradient(0, 0, 0);
    conic.addColorStop(0, 'rgba(0, 247, 255, 0.25)');
    conic.addColorStop(0.25, 'rgba(59, 130, 246, 0.25)');
    conic.addColorStop(0.5, 'rgba(168, 85, 247, 0.28)');
    conic.addColorStop(0.75, 'rgba(244, 63, 94, 0.22)');
    conic.addColorStop(1, 'rgba(0, 247, 255, 0.25)');

    ctx.fillStyle = conic;
    ctx.filter = 'blur(16px)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 140, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Timer HUD Arc (if timer is active)
    if (this.timerActive) {
      ctx.save();
      const ringRadius = 135;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      // Background track
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Active progress arc
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * Math.max(0, Math.min(1, this.timerProgress)));
      
      const timerGrad = ctx.createLinearGradient(cx - ringRadius, cy, cx + ringRadius, cy);
      timerGrad.addColorStop(0, '#00f7ff');
      timerGrad.addColorStop(0.5, '#3b82f6');
      timerGrad.addColorStop(1, '#a855f7');

      ctx.strokeStyle = timerGrad;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f7ff';
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, startAngle, endAngle);
      ctx.stroke();

      // Display remaining countdown text softly at top if present
      if (this.timerText) {
        ctx.font = '600 22px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 247, 255, 0.8)';
        ctx.fillText(this.timerText, cx, cy - 85);
      }

      ctx.restore();
    }

    // 3. Render Organic Expressive Eyes
    const eyeSpacing = this.currentEye.spacing;
    const eyeW = Math.max(4, this.currentEye.width);
    const eyeH = Math.max(2, this.currentEye.height);
    const pupilX = this.currentEye.pupilX;
    const pupilY = this.currentEye.pupilY;
    const eyeCurve = this.currentEye.curve;
    const glow = this.currentEye.glowIntensity;

    const leftEyeX = cx - eyeSpacing + pupilX;
    const rightEyeX = cx + eyeSpacing + pupilX;
    const eyeY = cy - 8 + pupilY;

    // Draw Left Eye & Right Eye
    this.drawOrganicEye(ctx, leftEyeX, eyeY, eyeW, eyeH, eyeCurve, glow, false);
    this.drawOrganicEye(ctx, rightEyeX, eyeY, eyeW, eyeH, eyeCurve, glow, true);

    // 4. Render Responsive Cyber Mouth
    this.drawMouth(ctx, cx + pupilX * 0.6, cy + 34 + pupilY * 0.6);
  }

  private drawOrganicEye(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    curve: number,
    glow: number,
    isRight: number | boolean
  ): void {
    ctx.save();

    // Glowing cyan/white cyber bloom
    ctx.shadowBlur = 24 * glow;
    ctx.shadowColor = 'rgba(0, 247, 255, 0.9)';

    ctx.fillStyle = '#ffffff';

    if (curve > 2) {
      // Happy / Celebrating inverted curved crescent arc: ^
      ctx.lineWidth = Math.min(w * 0.45, 9);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y + curve * 0.5, w * 0.85, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Extra highlight pass
      ctx.lineWidth = Math.min(w * 0.25, 4);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    } else if (curve < -2) {
      // Sleeping downward curve: ︶
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y - Math.abs(curve) * 0.5, w * 0.85, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    } else if (h <= 4) {
      // Blink slit
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - w * 0.6, y);
      ctx.lineTo(x + w * 0.6, y);
      ctx.stroke();
    } else {
      // Expressive Rounded Capsule Eye
      ctx.beginPath();
      const r = Math.min(w / 2, h / 2);
      ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
      ctx.fill();

      // High-precision specular pupil glint (Gemini/Siri lifelike spark)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(x - w * 0.15, y - h * 0.2, Math.max(2, w * 0.22), 0, Math.PI * 2);
      ctx.fill();

      // Secondary tiny spark
      ctx.fillStyle = 'rgba(0, 247, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(x + w * 0.18, y + h * 0.15, Math.max(1.5, w * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawMouth(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const mouth = this.currentMouth;
    if (mouth.opacity <= 0.05) return;

    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(0, 247, 255, 0.75)';

    // When speaking, mouth modulates with dynamic speechWave
    let open = mouth.open;
    let mw = mouth.width;
    let mh = mouth.height;

    if (this.isSpeaking) {
      const talkPulse = Math.abs(Math.sin(this.speechWave));
      open = Math.max(open, talkPulse * 0.85);
      mh = Math.max(mh, 6 + talkPulse * 10);
      mw = mw + talkPulse * 4;
    }

    if (open > 0.3) {
      // Open mouth (e.g. curious 'o' or wide happy smile)
      ctx.fillStyle = `rgba(255, 255, 255, ${mouth.opacity})`;
      ctx.beginPath();
      ctx.ellipse(x, y, mw * 0.45, Math.max(3, mh * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Curved or straight cyber mouth arc
      ctx.lineWidth = Math.max(2.5, mh);
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255, 255, 255, ${mouth.opacity})`;

      ctx.beginPath();
      if (Math.abs(mouth.curve) > 2) {
        // Curved smile
        ctx.arc(x, y - mouth.curve * 0.6, mw * 0.6, Math.PI * 0.2, Math.PI * 0.8);
      } else {
        // Sleek subtle horizontal micro-line
        ctx.moveTo(x - mw * 0.4, y);
        ctx.lineTo(x + mw * 0.4, y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}
