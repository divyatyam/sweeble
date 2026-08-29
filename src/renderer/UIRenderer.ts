import { GameState } from '../core/GameState';
import { GamePhase } from '../types';

export class UIRenderer {
  /**
   * Renders the top Viewport Tokenmaxxing & Productivity HUD bar, Level Selector, and Week Completion Modal
   */
  static render(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    screenWidth: number,
    scale: number
  ): void {
    if (state.phase === GamePhase.Menu) return;

    // ── 1. Top Viewport "Tokenmaxxing" & Productivity HUD ──
    const isMobileWidth = screenWidth < 500;
    const hudW = Math.min(screenWidth - (isMobileWidth ? 16 : 40) * scale, 720 * scale);
    const hudH = (isMobileWidth ? 38 : 42) * scale;
    const hudX = (screenWidth - hudW) / 2;
    const hudY = (isMobileWidth ? 8 : 12) * scale;

    ctx.save();

    // Backdrop Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
    ctx.shadowBlur = 12 * scale;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, hudH / 2);
    ctx.fill();

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ── Left: Productivity % Gauge ──
    const prodPercent = state.overallProductivityPercent;
    const gaugeColor = prodPercent >= 80 ? '#059669' : prodPercent >= 45 ? '#D97706' : '#E11D48';

    ctx.fillStyle = gaugeColor;
    ctx.font = `bold ${isMobileWidth ? 11 * scale : 12.5 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const prodLabel = isMobileWidth ? `${prodPercent}% PROD` : `${prodPercent}% PRODUCTIVITY`;
    ctx.fillText(prodLabel, hudX + (isMobileWidth ? 12 : 22) * scale, hudY + hudH / 2);

    // Productivity mini progress bar (desktop / tablet only)
    if (hudW > 480 * scale) {
      const barW = 100 * scale;
      const barH = 7 * scale;
      const barX = hudX + 175 * scale;
      const barY = hudY + (hudH - barH) / 2;

      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3.5 * scale);
      ctx.fill();

      ctx.fillStyle = gaugeColor;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * (prodPercent / 100), barH, 3.5 * scale);
      ctx.fill();
    }

    // ── Right: Tokenmaxxing Counter & Pause Button ──
    const pBtnW = (isMobileWidth ? 54 : 68) * scale;
    const pBtnH = (isMobileWidth ? 24 : 26) * scale;
    const pBtnX = hudX + hudW - (pBtnW + (isMobileWidth ? 6 : 8) * scale);
    const pBtnY = hudY + (hudH - pBtnH) / 2;

    ctx.fillStyle = '#B45309';
    ctx.font = `bold ${isMobileWidth ? 10.5 * scale : 12 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const maxText = isMobileWidth ? `${state.totalTokensMaxxed.toLocaleString()}` : `${state.totalTokensMaxxed.toLocaleString()} MAXXED`;
    ctx.fillText(maxText, pBtnX - (isMobileWidth ? 6 : 10) * scale, hudY + hudH / 2);

    // Pause Pill Button
    ctx.fillStyle = state.phase === GamePhase.Paused ? '#ECFDF5' : '#F1F5F9';
    ctx.beginPath();
    ctx.roundRect(pBtnX, pBtnY, pBtnW, pBtnH, pBtnH / 2);
    ctx.fill();
    ctx.strokeStyle = state.phase === GamePhase.Paused ? '#10B981' : '#CBD5E1';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    ctx.fillStyle = state.phase === GamePhase.Paused ? '#065F46' : '#475569';
    ctx.font = `bold ${isMobileWidth ? 9.5 * scale : 10.5 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(state.phase === GamePhase.Paused ? 'Resume' : 'Pause', pBtnX + pBtnW / 2, pBtnY + pBtnH / 2 + 0.5 * scale);

    ctx.restore();

    // ── 2. Pause Overlay Modal ──
    if (state.phase === GamePhase.Paused) {
      this.renderPauseModal(ctx, state, screenWidth, scale);
    }

    // ── 3. Week Complete Modal Dialog ──
    if (state.phase === GamePhase.WeekComplete) {
      this.renderWeekCompleteModal(ctx, state, screenWidth, scale);
    }

    // ── 4. Game Over Modal Dialog ──
    if (state.phase === GamePhase.GameOver) {
      this.renderGameOverModal(ctx, state, screenWidth, scale);
    }
  }

  private static renderPauseModal(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    screenWidth: number,
    scale: number
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
    ctx.fillRect(0, 0, screenWidth, 1000);

    const mW = Math.min(screenWidth - 60 * scale, 420 * scale);
    const mH = 300 * scale;
    const mX = (screenWidth - mW) / 2;
    const mY = 180 * scale;

    // Modal Card
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.roundRect(mX, mY, mW, mH, 20 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header
    ctx.fillStyle = '#1E293B';
    ctx.font = `bold ${22 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SPRINT PAUSED', screenWidth / 2, mY + 45 * scale);

    // Subtitle
    ctx.fillStyle = '#64748B';
    ctx.font = `${13 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${state.overallProductivityPercent}% Productivity  •  ${state.totalTokensMaxxed.toLocaleString()} Maxxed`, screenWidth / 2, mY + 75 * scale);

    // 1. Resume Button
    const btnW = 240 * scale;
    const btnH = 40 * scale;
    const btnX = (screenWidth - btnW) / 2;
    const resumeY = mY + 115 * scale;

    ctx.fillStyle = '#6EE7B7';
    ctx.beginPath();
    ctx.roundRect(btnX, resumeY, btnW, btnH, 20 * scale);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = `bold ${14 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Resume Sprint', screenWidth / 2, resumeY + btnH / 2 + 1 * scale);

    // 2. Quit Button
    const quitY = mY + 170 * scale;

    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath();
    ctx.roundRect(btnX, quitY, btnW, btnH, 20 * scale);
    ctx.fill();
    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#9F1239';
    ctx.font = `bold ${13.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Quit to Menu', screenWidth / 2, quitY + btnH / 2 + 1 * scale);

    // Shortcut hint
    ctx.fillStyle = '#94A3B8';
    ctx.font = `500 ${11 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`Press [ ${state.keyBindings.pause.toUpperCase()} ] to Resume  •  [ ${state.keyBindings.quit.toUpperCase()} ] to Quit`, screenWidth / 2, mY + 250 * scale);

    ctx.restore();
  }

  private static renderWeekCompleteModal(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    screenWidth: number,
    scale: number
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
    ctx.fillRect(0, 0, screenWidth, 2000);

    const mW = Math.min(screenWidth - 40 * scale, 520 * scale);
    const mH = 390 * scale;
    const mX = (screenWidth - mW) / 2;
    const mY = 120 * scale;

    // Modal Card
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 28 * scale;
    ctx.beginPath();
    ctx.roundRect(mX, mY, mW, mH, 24 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header
    ctx.fillStyle = '#059669';
    ctx.font = `bold ${22 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('5-DAY WORK WEEK COMPLETE', screenWidth / 2, mY + 42 * scale);

    // Subtitle
    ctx.fillStyle = '#64748B';
    ctx.font = `${13 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('FINAL SPRINT EVALUATION & GOAL METRICS', screenWidth / 2, mY + 70 * scale);

    // Calculate 3 Goal Metrics
    const prodPercent = state.overallProductivityPercent;
    const totalTokensAvailable = Math.max(1, state.totalTokensMaxxed + (state.unlockedLevel * 100));
    const tokensUsedPercent = Math.min(100, Math.max(0, Math.round((state.totalTokensBurned / totalTokensAvailable) * 100)));
    const livesLost = state.totalLivesLost;

    // 3 Metric Cards Layout
    const cardGap = 12 * scale;
    const cardW = (mW - 48 * scale - cardGap * 2) / 3;
    const cardH = 150 * scale;
    const cardsStartY = mY + 95 * scale;
    const cardsStartX = mX + 24 * scale;

    // --- Card 1: 1) % of Productivity ---
    const c1X = cardsStartX;
    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.roundRect(c1X, cardsStartY, cardW, cardH, 16 * scale);
    ctx.fill();
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = `bold ${11.5 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('1. PRODUCTIVITY', c1X + cardW / 2, cardsStartY + 24 * scale);

    ctx.fillStyle = '#047857';
    ctx.font = `800 ${28 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${prodPercent}%`, c1X + cardW / 2, cardsStartY + 72 * scale);

    ctx.fillStyle = '#059669';
    ctx.font = `600 ${11 * scale}px "Google Sans", sans-serif`;
    const grade = prodPercent >= 95 ? 'S+ Tier' : prodPercent >= 80 ? 'A Tier' : prodPercent >= 60 ? 'B Tier' : 'C Tier';
    ctx.fillText(grade, c1X + cardW / 2, cardsStartY + 104 * scale);
    ctx.fillText('Goal: 100%', c1X + cardW / 2, cardsStartY + 128 * scale);

    // --- Card 2: 2) % of Total Tokens Used ---
    const c2X = cardsStartX + cardW + cardGap;
    ctx.fillStyle = '#FEFCE8';
    ctx.beginPath();
    ctx.roundRect(c2X, cardsStartY, cardW, cardH, 16 * scale);
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#854D0E';
    ctx.font = `bold ${11.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('2. TOKENS USED', c2X + cardW / 2, cardsStartY + 24 * scale);

    ctx.fillStyle = '#A16207';
    ctx.font = `800 ${28 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${tokensUsedPercent}%`, c2X + cardW / 2, cardsStartY + 72 * scale);

    ctx.fillStyle = '#B45309';
    ctx.font = `600 ${11 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${Math.round(state.totalTokensBurned)} Used`, c2X + cardW / 2, cardsStartY + 104 * scale);
    ctx.fillText(`${totalTokensAvailable} Maxxed`, c2X + cardW / 2, cardsStartY + 128 * scale);

    // --- Card 3: 3) Lives Lost ---
    const c3X = cardsStartX + (cardW + cardGap) * 2;
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath();
    ctx.roundRect(c3X, cardsStartY, cardW, cardH, 16 * scale);
    ctx.fill();
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#9F1239';
    ctx.font = `bold ${11.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('3. LIVES LOST', c3X + cardW / 2, cardsStartY + 24 * scale);

    ctx.fillStyle = '#BE123C';
    ctx.font = `800 ${28 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${livesLost}`, c3X + cardW / 2, cardsStartY + 72 * scale);

    ctx.fillStyle = '#E11D48';
    ctx.font = `600 ${11 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(livesLost === 0 ? 'Flawless Run' : `${livesLost} Squad Deaths`, c3X + cardW / 2, cardsStartY + 104 * scale);
    ctx.fillText(livesLost === 0 ? '0 Lost' : 'Rehired in lane', c3X + cardW / 2, cardsStartY + 128 * scale);

    // Restart Button Prompt
    const btnW = 240 * scale;
    const btnH = 44 * scale;
    const btnX = (screenWidth - btnW) / 2;
    const btnY = mY + 270 * scale;

    ctx.fillStyle = '#6EE7B7';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 22 * scale);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = `bold ${14 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Play Next Sprint', screenWidth / 2, btnY + btnH / 2 + 1 * scale);

    // Hint
    ctx.fillStyle = '#94A3B8';
    ctx.font = `500 ${11 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Click anywhere on screen to restart', screenWidth / 2, mY + 345 * scale);

    ctx.restore();
  }

  private static renderGameOverModal(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    screenWidth: number,
    scale: number
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, screenWidth, 2000);

    const mW = Math.min(screenWidth - 40 * scale, 480 * scale);
    const mH = 370 * scale;
    const mX = (screenWidth - mW) / 2;
    const mY = 130 * scale;

    // Modal Card
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.40)';
    ctx.shadowBlur = 28 * scale;
    ctx.beginPath();
    ctx.roundRect(mX, mY, mW, mH, 24 * scale);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Header
    ctx.fillStyle = '#DC2626';
    ctx.font = `bold ${24 * scale}px "Google Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', screenWidth / 2, mY + 44 * scale);

    // Subtitle
    ctx.fillStyle = '#64748B';
    ctx.font = `${13 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Your squad depleted their compute tokens!', screenWidth / 2, mY + 72 * scale);

    // 2 Summary Metric Cards
    const cardGap = 12 * scale;
    const cardW = (mW - 48 * scale - cardGap) / 2;
    const cardH = 95 * scale;
    const cardsStartY = mY + 96 * scale;
    const cardsStartX = mX + 24 * scale;

    // Card 1: Productivity Reached
    const c1X = cardsStartX;
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath();
    ctx.roundRect(c1X, cardsStartY, cardW, cardH, 16 * scale);
    ctx.fill();
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#9F1239';
    ctx.font = `bold ${11.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('PRODUCTIVITY', c1X + cardW / 2, cardsStartY + 24 * scale);

    ctx.fillStyle = '#BE123C';
    ctx.font = `800 ${26 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${state.overallProductivityPercent}%`, c1X + cardW / 2, cardsStartY + 62 * scale);

    // Card 2: Tokens Maxxed
    const c2X = cardsStartX + cardW + cardGap;
    ctx.fillStyle = '#FEFCE8';
    ctx.beginPath();
    ctx.roundRect(c2X, cardsStartY, cardW, cardH, 16 * scale);
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#854D0E';
    ctx.font = `bold ${11.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('TOKENS MAXXED', c2X + cardW / 2, cardsStartY + 24 * scale);

    ctx.fillStyle = '#A16207';
    ctx.font = `800 ${26 * scale}px "Google Sans", sans-serif`;
    ctx.fillText(`${state.totalTokensMaxxed.toLocaleString()}`, c2X + cardW / 2, cardsStartY + 62 * scale);

    // Action Buttons
    const btnW = mW - 48 * scale;
    const btnH = 42 * scale;
    const btnX = mX + 24 * scale;

    // 1. Retry Button
    const retryY = mY + 215 * scale;
    ctx.fillStyle = '#6EE7B7';
    ctx.beginPath();
    ctx.roundRect(btnX, retryY, btnW, btnH, 20 * scale);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    ctx.fillStyle = '#065F46';
    ctx.font = `bold ${14 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Retry Sprint', screenWidth / 2, retryY + btnH / 2 + 1 * scale);

    // 2. Quit Button
    const quitY = mY + 268 * scale;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.roundRect(btnX, quitY, btnW, btnH, 20 * scale);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = `bold ${13.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Quit to Menu', screenWidth / 2, quitY + btnH / 2 + 1 * scale);

    // Hint
    ctx.fillStyle = '#94A3B8';
    ctx.font = `500 ${10.5 * scale}px "Google Sans", sans-serif`;
    ctx.fillText('Click anywhere to retry the sprint', screenWidth / 2, mY + 342 * scale);

    ctx.restore();
  }
}
