import * as THREE from 'three';
import { PetAnimationState } from '../../shared/types';

export interface EyeShape {
  leftEyeScaleY: number;
  rightEyeScaleY: number;
  leftEyeScaleX: number;
  rightEyeScaleX: number;
  eyeCurve: number; // -1 (sad) to 0 (neutral) to +1 (happy curve)
  pupilOffsetX: number;
  pupilOffsetY: number;
  blinkProgress: number; // 0 (open) to 1 (closed)
  glowIntensity: number;
  color: string;
}

export class FaceTextureManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public texture: THREE.CanvasTexture;
  private currentEyes: EyeShape;
  private targetEyes: EyeShape;

  constructor(size = 512) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Could not create 2D canvas context for face texture');
    this.ctx = context;

    this.currentEyes = {
      leftEyeScaleY: 1.0,
      rightEyeScaleY: 1.0,
      leftEyeScaleX: 1.0,
      rightEyeScaleX: 1.0,
      eyeCurve: 0,
      pupilOffsetX: 0,
      pupilOffsetY: 0,
      blinkProgress: 0,
      glowIntensity: 1.0,
      color: '#00f7ff', // glowing cyan
    };

    this.targetEyes = { ...this.currentEyes };

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.draw();
  }

  public setExpression(state: PetAnimationState, targetGaze: { x: number; y: number } = { x: 0, y: 0 }): void {
    switch (state) {
      case 'blink':
        this.targetEyes.blinkProgress = 1.0;
        break;

      case 'happy':
      case 'celebrating':
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 0.8;
        this.targetEyes.rightEyeScaleY = 0.8;
        this.targetEyes.leftEyeScaleX = 1.1;
        this.targetEyes.rightEyeScaleX = 1.1;
        this.targetEyes.eyeCurve = 1.0; // curved happy arches
        this.targetEyes.glowIntensity = 1.5;
        this.targetEyes.color = '#38ef7d'; // cyan-emerald sparkle
        break;

      case 'curious':
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 1.25;
        this.targetEyes.rightEyeScaleY = 1.05;
        this.targetEyes.leftEyeScaleX = 1.1;
        this.targetEyes.rightEyeScaleX = 1.0;
        this.targetEyes.eyeCurve = 0.2;
        this.targetEyes.pupilOffsetX = targetGaze.x * 24;
        this.targetEyes.pupilOffsetY = targetGaze.y * 18;
        this.targetEyes.glowIntensity = 1.3;
        this.targetEyes.color = '#00f7ff';
        break;

      case 'sleeping':
        this.targetEyes.blinkProgress = 0.95;
        this.targetEyes.leftEyeScaleY = 0.15;
        this.targetEyes.rightEyeScaleY = 0.15;
        this.targetEyes.eyeCurve = 0.3;
        this.targetEyes.glowIntensity = 0.4;
        this.targetEyes.color = '#7f5af0'; // gentle violet
        break;

      case 'waking':
        this.targetEyes.blinkProgress = 0.3;
        this.targetEyes.leftEyeScaleY = 0.7;
        this.targetEyes.rightEyeScaleY = 0.7;
        this.targetEyes.eyeCurve = 0.1;
        this.targetEyes.glowIntensity = 0.9;
        this.targetEyes.color = '#00f7ff';
        break;

      case 'thinking':
        this.targetEyes.blinkProgress = 0.15;
        this.targetEyes.leftEyeScaleY = 0.9;
        this.targetEyes.rightEyeScaleY = 0.9;
        this.targetEyes.eyeCurve = 0;
        this.targetEyes.pupilOffsetX = 12;
        this.targetEyes.pupilOffsetY = -10;
        this.targetEyes.glowIntensity = 1.2;
        this.targetEyes.color = '#9d4edd'; // purple deep thought
        break;

      case 'working':
      case 'focused':
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 0.95;
        this.targetEyes.rightEyeScaleY = 0.95;
        this.targetEyes.leftEyeScaleX = 1.0;
        this.targetEyes.rightEyeScaleX = 1.0;
        this.targetEyes.eyeCurve = 0;
        this.targetEyes.glowIntensity = 1.1;
        this.targetEyes.color = '#00f7ff';
        break;

      case 'reminding':
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 1.3;
        this.targetEyes.rightEyeScaleY = 1.3;
        this.targetEyes.leftEyeScaleX = 1.15;
        this.targetEyes.rightEyeScaleX = 1.15;
        this.targetEyes.eyeCurve = 0.4;
        this.targetEyes.glowIntensity = 1.8;
        this.targetEyes.color = '#ff9f1c'; // vibrant glowing amber-cyan
        break;

      case 'dragging':
        this.targetEyes.blinkProgress = 0.1;
        this.targetEyes.leftEyeScaleY = 0.85;
        this.targetEyes.rightEyeScaleY = 0.85;
        this.targetEyes.leftEyeScaleX = 1.2;
        this.targetEyes.rightEyeScaleX = 1.2;
        this.targetEyes.eyeCurve = 0.3;
        this.targetEyes.glowIntensity = 1.4;
        this.targetEyes.color = '#00f7ff';
        break;

      case 'walking':
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 1.05;
        this.targetEyes.rightEyeScaleY = 1.05;
        this.targetEyes.eyeCurve = 0.2;
        this.targetEyes.glowIntensity = 1.1;
        this.targetEyes.color = '#00f7ff';
        break;

      case 'idle':
      default:
        this.targetEyes.blinkProgress = 0;
        this.targetEyes.leftEyeScaleY = 1.0;
        this.targetEyes.rightEyeScaleY = 1.0;
        this.targetEyes.leftEyeScaleX = 1.0;
        this.targetEyes.rightEyeScaleX = 1.0;
        this.targetEyes.eyeCurve = 0;
        this.targetEyes.pupilOffsetX = targetGaze.x * 12;
        this.targetEyes.pupilOffsetY = targetGaze.y * 10;
        this.targetEyes.glowIntensity = 1.0;
        this.targetEyes.color = '#00f7ff';
        break;
    }
  }

  public update(delta: number): void {
    const lerpSpeed = Math.min(1.0, delta * 12);

    this.currentEyes.leftEyeScaleY += (this.targetEyes.leftEyeScaleY - this.currentEyes.leftEyeScaleY) * lerpSpeed;
    this.currentEyes.rightEyeScaleY += (this.targetEyes.rightEyeScaleY - this.currentEyes.rightEyeScaleY) * lerpSpeed;
    this.currentEyes.leftEyeScaleX += (this.targetEyes.leftEyeScaleX - this.currentEyes.leftEyeScaleX) * lerpSpeed;
    this.currentEyes.rightEyeScaleX += (this.targetEyes.rightEyeScaleX - this.currentEyes.rightEyeScaleX) * lerpSpeed;
    this.currentEyes.eyeCurve += (this.targetEyes.eyeCurve - this.currentEyes.eyeCurve) * lerpSpeed;
    this.currentEyes.pupilOffsetX += (this.targetEyes.pupilOffsetX - this.currentEyes.pupilOffsetX) * lerpSpeed;
    this.currentEyes.pupilOffsetY += (this.targetEyes.pupilOffsetY - this.currentEyes.pupilOffsetY) * lerpSpeed;
    this.currentEyes.blinkProgress += (this.targetEyes.blinkProgress - this.currentEyes.blinkProgress) * (lerpSpeed * 1.5);
    this.currentEyes.glowIntensity += (this.targetEyes.glowIntensity - this.currentEyes.glowIntensity) * lerpSpeed;
    this.currentEyes.color = this.targetEyes.color;

    this.draw();
    this.texture.needsUpdate = true;
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Subtle dark circular faceplate backdrop
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.45);
    grad.addColorStop(0, 'rgba(10, 14, 28, 0.95)');
    grad.addColorStop(0.7, 'rgba(6, 9, 20, 0.98)');
    grad.addColorStop(1, 'rgba(4, 6, 15, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Subtle LED / pixel matrix grid lines
    ctx.strokeStyle = 'rgba(0, 247, 255, 0.04)';
    ctx.lineWidth = 1;
    const step = 14;
    for (let x = 60; x < w - 60; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x, h - 80);
      ctx.stroke();
    }
    for (let y = 80; y < h - 80; y += step) {
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(w - 60, y);
      ctx.stroke();
    }

    // Render the two expressive eyes
    const eyeSpacing = 82;
    const eyeBaseRadiusX = 28;
    const eyeBaseRadiusY = 40;
    const eyeCenterY = h / 2 - 12;

    const leftX = w / 2 - eyeSpacing;
    const rightX = w / 2 + eyeSpacing;

    const blinkFactor = Math.max(0.04, 1 - this.currentEyes.blinkProgress);

    this.drawSingleEye(
      leftX,
      eyeCenterY,
      eyeBaseRadiusX * this.currentEyes.leftEyeScaleX,
      eyeBaseRadiusY * this.currentEyes.leftEyeScaleY * blinkFactor,
      this.currentEyes.eyeCurve,
      this.currentEyes.pupilOffsetX,
      this.currentEyes.pupilOffsetY,
      this.currentEyes.color,
      this.currentEyes.glowIntensity
    );

    this.drawSingleEye(
      rightX,
      eyeCenterY,
      eyeBaseRadiusX * this.currentEyes.rightEyeScaleX,
      eyeBaseRadiusY * this.currentEyes.rightEyeScaleY * blinkFactor,
      this.currentEyes.eyeCurve,
      this.currentEyes.pupilOffsetX,
      this.currentEyes.pupilOffsetY,
      this.currentEyes.color,
      this.currentEyes.glowIntensity
    );

    // Cute smiling mouth curve when happy or curious
    if (this.currentEyes.eyeCurve > 0.1) {
      ctx.save();
      ctx.strokeStyle = this.currentEyes.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = this.currentEyes.color;
      ctx.shadowBlur = 12 * this.currentEyes.glowIntensity;
      ctx.beginPath();
      const mouthY = eyeCenterY + 44;
      const mouthW = 14 + this.currentEyes.eyeCurve * 8;
      ctx.arc(w / 2, mouthY - 4, mouthW, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.stroke();
      ctx.restore();
    }

    // Soft glowing blushing cheeks when happy or curious
    if (this.currentEyes.eyeCurve > 0.2) {
      const blushOpacity = Math.min(0.45, (this.currentEyes.eyeCurve - 0.2) * 0.8);
      ctx.fillStyle = `rgba(255, 99, 165, ${blushOpacity})`;
      ctx.shadowColor = 'rgba(255, 99, 165, 0.6)';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.ellipse(leftX - 8, eyeCenterY + 46, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(rightX + 8, eyeCenterY + 46, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  private drawSingleEye(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    curve: number,
    pupilX: number,
    pupilY: number,
    color: string,
    glow: number
  ): void {
    const ctx = this.ctx;

    ctx.save();
    ctx.translate(cx + pupilX, cy + pupilY);

    if (curve > 0.4) {
      // Happy inverted arch: joyful eye arc with bright glow
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(9, rx * 0.48);
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 24 * glow;

      ctx.beginPath();
      ctx.arc(0, ry * 0.22, rx, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();

      // Inner crisp white highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, ry * 0.22, rx, Math.PI * 1.25, Math.PI * 1.75, false);
      ctx.stroke();
    } else {
      // Expressive oval eye with layered neon glow and twin catchlights
      ctx.shadowColor = color;
      ctx.shadowBlur = 28 * glow;

      // Outer glowing body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main upper-left sparkle catchlight
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.28, -ry * 0.32, rx * 0.42, ry * 0.38, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Secondary smaller sparkle catchlight at lower-right
      ctx.beginPath();
      ctx.ellipse(rx * 0.32, ry * 0.36, rx * 0.2, ry * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
