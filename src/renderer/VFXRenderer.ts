import { VFXParticle, ShockwaveRing } from '../types';

export class VFXRenderer {
  /**
   * Updates all active VFX particles and shockwave rings
   */
  static update(
    particles: VFXParticle[],
    shockwaves: ShockwaveRing[],
    dt: number
  ): { particles: VFXParticle[]; shockwaves: ShockwaveRing[] } {
    // Update shockwaves
    for (const wave of shockwaves) {
      wave.r += (wave.maxR - wave.r) * (dt * 9.0);
      wave.alpha = Math.max(0, 1.0 - wave.r / wave.maxR);
    }
    const updatedShockwaves = shockwaves.filter(w => w.alpha > 0.02 && w.r < w.maxR - 2);

    // Update particles
    for (const p of particles) {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy = p.vy * 0.92 + 20 * dt; // gentle gravity
      p.alpha = Math.max(0, 1.0 - p.life / p.maxLife);
    }
    const updatedParticles = particles.filter(p => p.alpha > 0.02);

    return { particles: updatedParticles, shockwaves: updatedShockwaves };
  }

  /**
   * Renders shockwaves and particles onto the canvas
   */
  static render(
    ctx: CanvasRenderingContext2D,
    particles: VFXParticle[],
    shockwaves: ShockwaveRing[],
    scale: number
  ): void {
    ctx.save();

    // 1. Shockwaves
    for (const wave of shockwaves) {
      ctx.save();
      ctx.globalAlpha = wave.alpha * 0.85;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = 3.5 * scale;
      ctx.shadowColor = wave.color;
      ctx.shadowBlur = 12 * scale;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.r * scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Particles & Floating Text
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.text) {
        // Floating Text (+🪙 25, ✨ JUMPED!, etc.)
        ctx.fillStyle = p.color;
        ctx.font = `bold ${13 * scale}px "Google Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4 * scale;
        ctx.fillText(p.text, p.x, p.y);
      } else {
        // Glowing Particle Circle
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  }
}
