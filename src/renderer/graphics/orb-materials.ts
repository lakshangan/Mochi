import * as THREE from 'three';
import { PetAnimationState } from '../../shared/types';

export interface EyeShape {
  text: string;
  glowIntensity: number;
  color: string;
  shakeX: number;
  shakeY: number;
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
      text: 'I   I',
      glowIntensity: 1.0,
      color: '#ffffff',
      shakeX: 0,
      shakeY: 0
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
        this.targetEyes.text = '-   -';
        break;

      case 'happy':
      case 'celebrating':
        this.targetEyes.text = '^   ^';
        this.targetEyes.glowIntensity = 1.6;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = -2;
        break;

      case 'curious':
        this.targetEyes.text = 'O   o';
        this.targetEyes.glowIntensity = 1.3;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = 0;
        break;

      case 'sleeping':
        this.targetEyes.text = '︶ ︶';
        this.targetEyes.glowIntensity = 0.5;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = 0;
        break;

      case 'typing':
        this.targetEyes.text = '>   <';
        this.targetEyes.glowIntensity = 1.3;
        this.targetEyes.shakeX = (Math.random() - 0.5) * 4;
        this.targetEyes.shakeY = (Math.random() - 0.5) * 2;
        break;

      case 'focused':
      case 'coding':
        this.targetEyes.text = '[   ]';
        this.targetEyes.glowIntensity = 1.8;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = 0;
        break;

      case 'listening':
        this.targetEyes.text = '♫   ♫';
        this.targetEyes.glowIntensity = 1.3;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = Math.sin(Date.now() / 200) * 8; // subtle bounce
        break;

      case 'idle':
      default:
        this.targetEyes.text = 'I   I';
        this.targetEyes.glowIntensity = 1.0;
        this.targetEyes.shakeX = 0;
        this.targetEyes.shakeY = 0;
        break;
    }
  }

  public update(delta: number): void {
    const lerpSpeed = Math.min(1.0, delta * 12);
    this.currentEyes.glowIntensity += (this.targetEyes.glowIntensity - this.currentEyes.glowIntensity) * lerpSpeed;
    
    // Smoothly update shake if not jumping
    this.currentEyes.shakeX = this.targetEyes.shakeX;
    this.currentEyes.shakeY = this.targetEyes.shakeY;

    // We only instantly switch text for retro LCD feel
    this.currentEyes.text = this.targetEyes.text;

    this.draw();
    this.texture.needsUpdate = true;
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Deep inner shadow/fade for the screen bounds
    const rectW = 380;
    const rectH = 180;
    const rectX = (w - rectW) / 2;
    const rectY = (h - rectH) / 2;

    // The beautiful cyan -> purple gradient from the image
    const grad = ctx.createLinearGradient(rectX, rectY, rectX + rectW, rectY + rectH);
    grad.addColorStop(0, 'rgba(0, 247, 255, 0.9)'); // Cyan
    grad.addColorStop(0.4, 'rgba(56, 114, 255, 0.7)'); // Soft blue
    grad.addColorStop(0.8, 'rgba(196, 77, 255, 0.85)'); // Magenta/Violet
    grad.addColorStop(1, 'rgba(255, 51, 102, 0.5)'); // Pink tail

    // Give it a strong outer glow
    ctx.shadowBlur = 50 * this.currentEyes.glowIntensity;
    ctx.shadowColor = 'rgba(0, 247, 255, 0.5)';
    ctx.fillStyle = grad;
    
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectW, rectH, 40);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dot matrix / scanline effect overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (let y = rectY; y < rectY + rectH; y += 4) {
      ctx.fillRect(rectX, y, rectW, 2);
    }
    for (let x = rectX; x < rectX + rectW; x += 4) {
      ctx.fillRect(x, rectY, 2, rectH);
    }

    // Draw the Text (Eyes)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 95px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.shadowBlur = 20 * this.currentEyes.glowIntensity;
    ctx.shadowColor = '#ffffff';

    const textX = w / 2 + this.currentEyes.shakeX;
    let textY = h / 2 + this.currentEyes.shakeY;
    
    // Nudge sleeping face up slightly to look better
    if (this.currentEyes.text === '︶ ︶') {
      textY -= 15;
    }

    ctx.fillText(this.currentEyes.text, textX, textY);
    
    // extra brightness pass
    ctx.fillText(this.currentEyes.text, textX, textY);
    ctx.shadowBlur = 0;
  }
}
