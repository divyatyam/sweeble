import { GameState } from './GameState';
import { TrackState } from '../types';

export class InputManager {
  private keyState: Set<string> = new Set();

  constructor(
    private canvas: HTMLCanvasElement,
    private state: GameState,
    private getTrackBounds: (trackIndex: number) => { left: number; right: number; centerX: number; laneWidth: number },
    private onQuit?: () => void
  ) {
    this.setupListeners();
  }

  private matchesKey(e: KeyboardEvent, binding: string): boolean {
    if (!binding) return false;
    const bLower = binding.toLowerCase();
    return e.key.toLowerCase() === bLower || e.code.toLowerCase() === bLower;
  }

  private setupListeners(): void {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      // If user is currently typing inside an input or remapping a key in settings modal, ignore game shortcuts
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (window as any).isKeyRemappingActive) {
        return;
      }

      this.keyState.add(e.key.toLowerCase());

      const kb = this.state.keyBindings;

      // Track-specific jumps
      if (this.matchesKey(e, kb.jumpTrack1)) {
        this.handleTrackJumpAction(0);
      } else if (this.matchesKey(e, kb.jumpTrack2)) {
        this.handleTrackJumpAction(1);
      } else if (this.matchesKey(e, kb.jumpTrack3)) {
        this.handleTrackJumpAction(2);
      } else if (this.matchesKey(e, kb.jumpTrack4)) {
        this.handleTrackJumpAction(3);
      } else if (this.matchesKey(e, kb.jumpTrack5)) {
        this.handleTrackJumpAction(4);
      }

      // Space / configured jump-all key
      if (this.matchesKey(e, kb.jumpAll) || e.code === 'Space') {
        e.preventDefault();
        this.handleJumpAllAgents();
      }

      // Pause key or Escape
      if (this.matchesKey(e, kb.pause) || e.key === 'Escape') {
        e.preventDefault();
        this.state.togglePause();
      }

      // Quit key when paused
      if (this.matchesKey(e, kb.quit) && this.state.phase === 'paused') {
        e.preventDefault();
        this.onQuit?.();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyState.delete(e.key.toLowerCase());
    });

    // Touch & Pointer on Canvas with zero-latency handling
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      this.handleCanvasClick(clickX, clickY);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      // Prevent default scrolling on game canvas
      if (e.target === this.canvas) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /**
   * Handles touch/click anywhere on the canvas:
   * 1. If clicking pause/resume button in HUD -> toggle pause!
   * 2. If paused -> Resume or Quit
   * 3. If Game Over or Week Complete -> Retry or Quit
   * 4. If in game -> tap sleeping lane to Power Up, tap active lane to Jump!
   */
  private handleCanvasClick(clickX: number, clickY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const isMobile = cssWidth < 500;
    const scale = Math.min(Math.max(cssWidth / 780, 0.72), 1.25);

    const hudW = Math.min(cssWidth - (isMobile ? 16 : 40) * scale, 720 * scale);
    const hudH = (isMobile ? 38 : 42) * scale;
    const hudX = (cssWidth - hudW) / 2;
    const hudY = (isMobile ? 8 : 12) * scale;

    const pBtnW = (isMobile ? 54 : 68) * scale;
    const pBtnH = (isMobile ? 24 : 26) * scale;
    const pBtnX = hudX + hudW - (pBtnW + (isMobile ? 6 : 8) * scale);
    const pBtnY = hudY + (hudH - pBtnH) / 2;

    // 1. Check click on top HUD Pause/Resume button
    if (
      clickX >= pBtnX - 14 &&
      clickX <= pBtnX + pBtnW + 14 &&
      clickY >= pBtnY - 10 &&
      clickY <= pBtnY + pBtnH + 10
    ) {
      this.state.togglePause();
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
      return;
    }

    // 2. If Paused: Check click on Resume / Quit buttons
    if (this.state.phase === 'paused') {
      const mY = 180 * scale;
      const btnW = 240 * scale;
      const btnH = 40 * scale;
      const btnX = (cssWidth - btnW) / 2;

      const resumeY = mY + 115 * scale;
      const quitY = mY + 170 * scale;

      // Click on Resume button
      if (
        clickX >= btnX - 10 &&
        clickX <= btnX + btnW + 10 &&
        clickY >= resumeY - 8 &&
        clickY <= resumeY + btnH + 8
      ) {
        this.state.phase = 'playing' as any;
        return;
      }

      // Click on Quit button
      if (
        clickX >= btnX - 10 &&
        clickX <= btnX + btnW + 10 &&
        clickY >= quitY - 8 &&
        clickY <= quitY + btnH + 8
      ) {
        this.onQuit?.();
        return;
      }

      return;
    }

    // 3. If Game Over: Check Retry or Quit
    if (this.state.phase === 'gameover') {
      const mW = Math.min(cssWidth - 40 * scale, 480 * scale);
      const mX = (cssWidth - mW) / 2;
      const mY = 130 * scale;
      const btnW = mW - 48 * scale;
      const btnH = 42 * scale;
      const btnX = mX + 24 * scale;

      const quitY = mY + 268 * scale;

      // Click Quit
      if (clickX >= btnX && clickX <= btnX + btnW && clickY >= quitY && clickY <= quitY + btnH) {
        this.onQuit?.();
        return;
      }

      // Otherwise Retry
      this.state.reset(this.state.unlockedLevel);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      return;
    }

    // 4. If Week Complete: Click anywhere restarts
    if (this.state.phase === 'week_complete') {
      this.state.reset(this.state.unlockedLevel);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      return;
    }

    // 5. In-Game Lane Tap: Power Up or Jump
    const unlockedTracks = this.state.getUnlockedTracks();

    for (const track of unlockedTracks) {
      const bounds = this.getTrackBounds(track.index);

      // Check if click was inside this track's lane
      if (clickX >= bounds.left && clickX <= bounds.right) {
        const hasActiveAgent = track.agent !== null && track.agent.alive;

        if (!hasActiveAgent) {
          // Sleeping agent -> Power Up / Awaken!
          this.recruitAgentForTrack(track, bounds.centerX, clickY);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
          }
          return;
        } else {
          // Active agent -> Leap Jump!
          this.handleTrackJumpAction(track.index);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
          }
          return;
        }
      }
    }
  }

  private recruitAgentForTrack(track: TrackState, centerX: number, clickY: number): void {
    const agent = this.state.agentManager.createAgentForTrack(track);
    this.state.totalTokensMaxxed += agent.tokens;
    this.state.triggerComputeFX(centerX, clickY, track.definition.theme.base, 100);
  }

  private handleTrackJumpAction(trackIndex: number): void {
    const track = this.state.trackManager.tracks[trackIndex];
    if (track && track.isUnlocked && track.agent && track.agent.alive) {
      const jumped = this.state.agentManager.jumpAgent(track);
      if (jumped) {
        const bounds = this.getTrackBounds(trackIndex);
        const agentY = this.canvas.height * 0.78;
        this.state.triggerJumpClearFX(bounds.centerX, agentY);
      }
    }
  }

  private handleJumpAllAgents(): void {
    for (const track of this.state.getUnlockedTracks()) {
      if (track.agent && track.agent.alive) {
        this.state.agentManager.jumpAgent(track);
      }
    }
  }

  isKeyDown(key: string): boolean {
    return this.keyState.has(key.toLowerCase());
  }
}
