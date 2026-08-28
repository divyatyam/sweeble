import { TrackState, ItemType } from '../types';

export class TrackRenderer {
  /**
   * Renders the 5 pastel Google Calendar tracks, scrolling items, night sleep overlays, and day/sleep progress bars
   */
  static render(
    ctx: CanvasRenderingContext2D,
    tracks: TrackState[],
    getTrackBounds: (trackIndex: number) => { left: number; right: number; centerX: number; laneWidth: number },
    screenHeight: number,
    scale: number,
    allowSleeps: boolean = false
  ): void {
    const topHudOffset = 52 * scale;
    const headerHeight = 56 * scale;
    const headerBottomY = topHudOffset + headerHeight;
    const bottomFooterHeight = 20 * scale;
    const playableHeight = screenHeight - headerBottomY - bottomFooterHeight;

    // ── 1. Render Calendar Columns & Lane Backgrounds ──
    for (const track of tracks) {
      if (!track.isUnlocked) continue;

      const bounds = getTrackBounds(track.index);
      const def = track.definition;

      ctx.save();

      // Lane Pastel Background Fill
      ctx.fillStyle = (allowSleeps && track.isNightSleeping) ? '#1E1B4B' : def.theme.tint;
      ctx.fillRect(bounds.left, headerBottomY, bounds.laneWidth, playableHeight);

      // Lane Border
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(bounds.left, headerBottomY, bounds.laneWidth, playableHeight);

      // Night Sleep Overlay & Stars
      if (allowSleeps && track.isNightSleeping) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 5; i++) {
          const starX = bounds.left + (bounds.laneWidth * (0.2 + i * 0.15));
          const starY = headerHeight + 50 + (i * 70);
          ctx.beginPath();
          ctx.arc(starX, starY, 1.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#DDD6FE';
        ctx.font = `bold ${11 * scale}px "Google Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('Sleeping (Night Cycle)', bounds.centerX, headerHeight + playableHeight / 2);
      }

      // ── 2. Render Scrolling Items & Obstacles (Clipped to playable track) ──
      ctx.save();
      ctx.beginPath();
      ctx.rect(bounds.left, headerBottomY, bounds.laneWidth, playableHeight);
      ctx.clip();

      for (const item of track.items) {
        if (item.collected) continue;

        const itemScreenY = item.positionY + track.distanceTraveledPx;

        // Skip if outside playable viewport
        if (itemScreenY < headerBottomY - item.lengthPx * scale || itemScreenY > screenHeight) continue;

        const cardMargin = 6 * scale;
        const cardLeft = bounds.left + cardMargin;
        const cardW = bounds.laneWidth - cardMargin * 2;
        const cardH = item.lengthPx * scale;

        ctx.save();

        if (item.type === ItemType.ComputeToken) {
          // ── High Excitement Compute Token Card ──
          // Radiant Golden Gradient Fill
          const goldGrad = ctx.createLinearGradient(cardLeft, itemScreenY, cardLeft + cardW, itemScreenY + cardH);
          goldGrad.addColorStop(0, '#FEF08A');
          goldGrad.addColorStop(0.5, '#FDE047');
          goldGrad.addColorStop(1, '#F59E0B');
          ctx.fillStyle = goldGrad;
          ctx.beginPath();
          ctx.roundRect(cardLeft, itemScreenY, cardW, cardH, 7 * scale);
          ctx.fill();

          // Intense Golden Glow Border
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 14 * scale;
          ctx.strokeStyle = '#D97706';
          ctx.lineWidth = 2 * scale;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Glass Shimmer Reflection
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.roundRect(cardLeft + 2.5 * scale, itemScreenY + 2.5 * scale, cardW - 5 * scale, cardH * 0.40, 5 * scale);
          ctx.fill();

          // Left Gold Token Coin Vector Icon
          const coinX = cardLeft + 16 * scale;
          const coinY = itemScreenY + cardH / 2;
          const coinR = 7.5 * scale;
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(coinX, coinY, coinR - 1.8 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#92400E';
          ctx.font = `800 ${8 * scale}px "Google Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('C', coinX, coinY + 0.5 * scale);

          // Exciting Bold Label
          ctx.fillStyle = '#78350F';
          ctx.font = `800 ${11 * scale}px "Google Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('+25 COMPUTE', cardLeft + cardW / 2 + 7 * scale, itemScreenY + cardH / 2);

          // Sparkle Glints on Card Corners
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cardLeft + cardW - 10 * scale, itemScreenY + 7 * scale, 2 * scale, 0, Math.PI * 2);
          ctx.arc(cardLeft + 28 * scale, itemScreenY + cardH - 7 * scale, 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Card Fill for Other Items
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.roundRect(cardLeft, itemScreenY, cardW, cardH, 6 * scale);
          ctx.fill();

          // Border & Accent Strip
          ctx.strokeStyle = item.accentColor;
          ctx.lineWidth = 1.8 * scale;
          ctx.stroke();

          ctx.fillStyle = item.accentColor;
          ctx.beginPath();
          ctx.roundRect(cardLeft, itemScreenY, 4.5 * scale, cardH, [6 * scale, 0, 0, 6 * scale]);
          ctx.fill();

          if (item.isRecruiter) {
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 10 * scale;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else if (item.isObstacle) {
            ctx.shadowColor = item.accentColor;
            ctx.shadowBlur = 8 * scale;
            ctx.stroke();
            ctx.shadowBlur = 0;
          }

          // Title (Clean vector typography)
          const isDarkText = item.type === ItemType.EnergySnack || item.type === ItemType.ColorBlock;
          ctx.fillStyle = isDarkText ? '#1E293B' : '#FFFFFF';

          const label = item.title;
          let fontSize = 9.5 * scale;
          ctx.font = `bold ${fontSize}px "Google Sans", sans-serif`;
          let textWidth = ctx.measureText(label).width;
          const maxTextW = cardW - 12 * scale;

          if (textWidth > maxTextW) {
            fontSize = Math.max(6.5 * scale, fontSize * (maxTextW / textWidth));
            ctx.font = `bold ${fontSize}px "Google Sans", sans-serif`;
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, cardLeft + cardW / 2 + 2 * scale, itemScreenY + cardH / 2);
        }

        ctx.restore();
      }

      ctx.restore(); // end item clip

      // ── 3. Track Header (Top Mascot, Name, Token Count & Day Tracker) ──
      ctx.save();
      ctx.fillStyle = def.theme.badgeBg;
      ctx.fillRect(bounds.left, topHudOffset, bounds.laneWidth, headerHeight);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(bounds.left, topHudOffset, bounds.laneWidth, headerHeight);

      // Mascot Name (Left)
      ctx.fillStyle = def.theme.badgeText;
      ctx.font = `bold ${10.5 * scale}px "Google Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(`${def.roleName}`, bounds.left + 8 * scale, topHudOffset + 18 * scale);

      // Agent Token Count (Right)
      const agentTokens = track.agent && track.agent.alive ? Math.round(track.agent.tokens) : 0;
      const tokenRatio = Math.max(0, Math.min(1.0, agentTokens / 100));

      ctx.textAlign = 'right';
      ctx.font = `bold ${10.5 * scale}px "Google Sans", sans-serif`;
      ctx.fillStyle = track.agent && track.agent.alive
        ? (tokenRatio > 0.40 ? '#059669' : tokenRatio > 0.20 ? '#D97706' : '#DC2626')
        : '#94A3B8';
      ctx.fillText(track.agent && track.agent.alive ? `${agentTokens} Tokens` : 'Sleeping', bounds.right - 8 * scale, topHudOffset + 18 * scale);

      // Independent 5-Day / Sleep Timeline Status (Center)
      ctx.font = `bold ${8.5 * scale}px "Google Sans", sans-serif`;
      const dayLabel = track.isComplete
        ? 'Week Complete'
        : (allowSleeps
            ? `Day ${track.dayNumber}/5 • Sleep ${track.sleepCount}/5`
            : `Day ${track.dayNumber}/5`);
      ctx.fillStyle = track.isComplete ? '#059669' : '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(dayLabel, bounds.centerX, topHudOffset + 33 * scale);

      // Micro Progress Bar for 5-Day Cycle
      const pBarW = bounds.laneWidth - 18 * scale;
      const pBarH = 4 * scale;
      const pBarX = bounds.left + 9 * scale;
      const pBarY = topHudOffset + 43 * scale;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.beginPath();
      ctx.roundRect(pBarX, pBarY, pBarW, pBarH, 2 * scale);
      ctx.fill();

      const totalProgress = allowSleeps
        ? Math.min(1.0, (track.sleepCount + track.dayProgress) / 5.0)
        : Math.min(1.0, (track.dayNumber - 1 + track.dayProgress) / 5.0);
      ctx.fillStyle = def.theme.accent;
      ctx.beginPath();
      ctx.roundRect(pBarX, pBarY, pBarW * totalProgress, pBarH, 2 * scale);
      ctx.fill();

      ctx.restore();

      ctx.restore();
    }
  }
}
