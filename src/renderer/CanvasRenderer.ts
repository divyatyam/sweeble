import { V2_CONSTANTS } from '../types';

export class CanvasRenderer {
  public ctx: CanvasRenderingContext2D;
  public dpr: number = 1;
  public width: number = V2_CONSTANTS.CANVAS_WIDTH;
  public height: number = 720;
  public scale: number = 1;

  constructor(public canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const targetW = rect ? rect.width : V2_CONSTANTS.CANVAS_WIDTH;
    const targetH = rect ? rect.height : 720;

    this.width = targetW;
    this.height = targetH;

    this.canvas.width = targetW * this.dpr;
    this.canvas.height = targetH * this.dpr;
    this.canvas.style.width = `${targetW}px`;
    this.canvas.style.height = `${targetH}px`;

    this.scale = Math.min(Math.max(targetW / 780, 0.72), 1.25);
  }

  beginFrame(screenShake: number = 0): void {
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);

    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 1.5;
      const shakeY = (Math.random() - 0.5) * screenShake * 1.5;
      this.ctx.translate(shakeX, shakeY);
    }

    // Clear frame with warm pastel paper background
    this.ctx.fillStyle = '#FAF9F6';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  endFrame(): void {
    this.ctx.restore();
  }
}
