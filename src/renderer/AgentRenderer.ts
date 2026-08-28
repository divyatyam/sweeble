import { AgentState } from '../types';
import { JumpPhysics } from '../physics/JumpPhysics';

export class AgentRenderer {
  /**
   * Renders a cute jumping agent with elevation drop shadows, token battery, and compute halo
   */
  static render(
    ctx: CanvasRenderingContext2D,
    agent: AgentState,
    centerX: number,
    baseGroundY: number,
    scale: number
  ): void {
    if (!agent.alive) return;

    // Elevation data from JumpPhysics
    const elevation = JumpPhysics.getElevationRenderData(agent, scale);
    const renderY = baseGroundY - elevation.elevationPx;

    const baseRadius = 20 * scale * agent.sizeMultiplier * elevation.visualScale;

    // ── 1. Drop Shadow on Track ──
    ctx.save();
    ctx.fillStyle = `rgba(15, 23, 42, ${elevation.shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      baseGroundY + 12 * scale,
      baseRadius * 1.15 * elevation.shadowScale,
      baseRadius * 0.45 * elevation.shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // ── 2. Invulnerability Blinking ──
    if (agent.invulnerableTimer > 0) {
      if (Math.floor(agent.invulnerableTimer * 12) % 2 === 0) {
        return; // Blink frame
      }
    }

    ctx.save();

    // ── 3. Compute Energy Golden Aura ──
    if (agent.computeAuraTimer > 0) {
      ctx.save();
      const auraAlpha = Math.min(1.0, agent.computeAuraTimer);
      const pulseR = baseRadius + Math.sin(agent.pulsePhase * 2) * (5 * scale) + (8 * scale);

      ctx.fillStyle = `rgba(254, 240, 138, ${auraAlpha * 0.45})`;
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = 18 * scale;
      ctx.beginPath();
      ctx.arc(centerX, renderY, pulseR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── 4. Main Pastel Agent Body ──
    ctx.fillStyle = agent.theme.base;
    ctx.shadowColor = agent.theme.accent;
    ctx.shadowBlur = 10 * scale;
    ctx.beginPath();
    ctx.arc(centerX, renderY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Body Border
    ctx.strokeStyle = agent.theme.accent;
    ctx.lineWidth = 2.5 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Specular Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(
      centerX - baseRadius * 0.32,
      renderY - baseRadius * 0.32,
      baseRadius * 0.42,
      baseRadius * 0.22,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // ── 5. Cute Face & Icon ──
    ctx.fillStyle = '#1E293B';
    const eyeOffsetX = 5.5 * scale;
    const eyeOffsetY = 2.5 * scale;
    const eyeR = 2.2 * scale;

    // Eyes
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX, renderY - eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX, renderY - eyeOffsetY, eyeR, 0, Math.PI * 2);
    ctx.fill();

    // Cute Blush Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX - 3 * scale, renderY + 2.5 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX + 3 * scale, renderY + 2.5 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    if (agent.isJumping) {
      // Open mouth when jumping happily :D
      ctx.arc(centerX, renderY + 2 * scale, 3 * scale, 0, Math.PI);
    } else {
      // Happy smile
      ctx.arc(centerX, renderY + 1 * scale, 2.5 * scale, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Renders a cute pet agent in Sleep Mode (when not yet powered up) with sleeping expression and floating zZ particles
   */
  static renderSleepingAgent(
    ctx: CanvasRenderingContext2D,
    def: import('../types').TrackDefinition,
    centerX: number,
    baseGroundY: number,
    scale: number
  ): void {
    ctx.save();

    // 1. Soft Drop Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.20)';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      baseGroundY + 12 * scale,
      22 * scale,
      9 * scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 2. Gentle Rhythmic Sleeping Breathing Bob
    const breath = Math.sin(Date.now() / 420);
    const breathOffsetY = breath * (1.2 * scale);
    const bodyR = 19 * scale + breath * (0.4 * scale);

    // 3. Resting Pastel Body
    ctx.fillStyle = def.theme.base;
    ctx.beginPath();
    ctx.arc(centerX, baseGroundY + breathOffsetY, bodyR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = def.theme.accent;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    // Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.beginPath();
    ctx.ellipse(
      centerX - bodyR * 0.32,
      baseGroundY + breathOffsetY - bodyR * 0.32,
      bodyR * 0.38,
      bodyR * 0.20,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 4. Cute Sleeping Closed Eyes ( ‿   ‿ )
    const eyeOffsetX = 5.5 * scale;
    const eyeY = baseGroundY + breathOffsetY + 1.5 * scale;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.8 * scale;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX, eyeY, 2.5 * scale, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX + eyeOffsetX, eyeY, 2.5 * scale, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();

    // 5. Rosy Sleeping Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.40)';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffsetX - 3 * scale, eyeY + 3 * scale, 2.2 * scale, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffsetX + 3 * scale, eyeY + 3 * scale, 2.2 * scale, 0, Math.PI * 2);
    ctx.fill();

    // 6. Floating Animated "z", "z", "Z" Drifting Upward
    const now = Date.now() / 1000;
    const zColors = ['#818CF8', '#A78BFA', '#C084FC'];
    for (let i = 0; i < 3; i++) {
      const progress = ((now * 0.55) + i * 0.33) % 1.0;
      const zAlpha = Math.sin(progress * Math.PI);
      const zX = centerX + (10 + i * 5) * scale + Math.sin(now * 2.5 + i * 1.5) * (3 * scale);
      const zY = baseGroundY - (14 * scale) - progress * (38 * scale);
      const zSize = (8.5 + i * 2.8) * scale;

      ctx.save();
      ctx.fillStyle = zColors[i];
      ctx.globalAlpha = Math.max(0, Math.min(1, zAlpha));
      ctx.font = `bold ${zSize}px "Google Sans", sans-serif`;
      ctx.fillText(i === 2 ? 'Z' : 'z', zX, zY);
      ctx.restore();
    }

    // 7. Clickable "+ Power Up" Pill Button Below Resting Agent
    const pW = 82 * scale;
    const pH = 24 * scale;
    const pX = centerX - pW / 2;
    const pY = baseGroundY + 24 * scale;

    ctx.fillStyle = def.theme.badgeBg;
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, 12 * scale);
    ctx.fill();
    ctx.strokeStyle = def.theme.accent;
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();

    ctx.fillStyle = def.theme.badgeText;
    ctx.font = `bold ${9.5 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ Power Up', centerX, pY + pH / 2 + 0.5 * scale);

    ctx.restore();
  }
}
