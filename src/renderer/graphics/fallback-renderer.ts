import { PetAnimationState } from '../../shared/types';

export class FallbackOrbRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning = true;
  private time = 0;
  private state: PetAnimationState = 'idle';

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = container.clientWidth || 200;
    this.canvas.height = container.clientHeight || 200;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D Context failed');
    this.ctx = ctx;
    container.appendChild(this.canvas);
    this.render();
  }

  public setState(state: PetAnimationState): void {
    this.state = state;
  }

  public setGaze(_x: number, _y: number): void {}

  public triggerBlink(): void {}

  public setTimer(_active: boolean, _progress = 0, _remainingText = ''): void {}

  public setSpeaking(_isSpeaking: boolean): void {}

  private render = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.render);

    this.time += 0.03;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2 + Math.sin(this.time * 2) * 6;
    const r = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Glowing outer shell
    const grad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 5, cx, cy, r);
    grad.addColorStop(0, '#1a2b4c');
    grad.addColorStop(0.7, '#070c1e');
    grad.addColorStop(1, '#00f7ff33');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim highlight
    ctx.strokeStyle = '#00f7ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    const eyeSpacing = r * 0.45;
    const eyeY = cy;
    const eyeR = r * 0.16;

    ctx.fillStyle = '#00f7ff';
    ctx.shadowColor = '#00f7ff';
    ctx.shadowBlur = 12;

    if (this.state === 'happy' || this.state === 'celebrating') {
      ctx.strokeStyle = '#00f7ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY, eyeR, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing, eyeY, eyeR, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY, eyeR * 0.8, eyeR * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing, eyeY, eyeR * 0.8, eyeR * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  public destroy(): void {
    this.isRunning = false;
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
