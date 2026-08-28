import { GameState } from './GameState';
import { TrackState, ItemType } from '../types';

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

    // Pointer / Mouse Click on Canvas
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      this.handleCanvasClick(clickX, clickY);
    });
  }

  /**
   * Handles click anywhere on the canvas:
   * 1. If clicking pause/resume button in HUD -> toggle pause!
   * 2. If paused and clicking resume button -> resume!
   * 3. If paused and clicking quit button -> quit to main menu!
   * 4. If clicking a solid color recruitment block -> instantiates/hires that agent!
   * 5. If clicking on an active agent or its lane -> triggers a leap jump!
   */
  private handleCanvasClick(clickX: number, clickY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const scale = Math.min(cssWidth / 960, 1.25);

    const hudW = Math.min(cssWidth - 40 * scale, 720 * scale);
    const hudH = 42 * scale;
    const hudX = (cssWidth - hudW) / 2;
    const hudY = 12 * scale;

    const pBtnW = 76 * scale;
    const pBtnH = 30 * scale;
    const pBtnX = hudX + hudW - 80 * scale;
    const pBtnY = hudY + (hudH - pBtnH) / 2;

    // Check click on top HUD Pause/Resume button
    if (
      clickX >= pBtnX - 12 &&
      clickX <= pBtnX + pBtnW + 12 &&
      clickY >= pBtnY - 8 &&
      clickY <= pBtnY + pBtnH + 8
    ) {
      this.state.togglePause();
      return;
    }

    // If Paused: Check click on Resume / Quit buttons
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

    const unlockedTracks = this.state.getUnlockedTracks();

    for (const track of unlockedTracks) {
      const bounds = this.getTrackBounds(track.index);

      // Check if click was inside this track's lane
      if (clickX >= bounds.left && clickX <= bounds.right) {
        const hasActiveAgent = track.agent !== null && track.agent.alive;

        if (!hasActiveAgent) {
          // Check if clicking near any recruitment color block
          const clickedItem = this.findClickedRecruiterBlock(track, clickY);
          if (clickedItem) {
            this.recruitAgentForTrack(track, bounds.centerX, clickY);
            return;
          }

          // Also allow clicking anywhere in the empty lane to hire if a color block is visible
          if (track.items.some(item => item.type === ItemType.ColorBlock && !item.collected)) {
            this.recruitAgentForTrack(track, bounds.centerX, clickY);
            return;
          }
        } else {
          // Track has active agent -> Trigger JUMP!
          this.handleTrackJumpAction(track.index);
          return;
        }
      }
    }
  }

  private findClickedRecruiterBlock(track: TrackState, clickY: number): boolean {
    const screenH = this.canvas.height;
    const agentY = screenH * 0.78;

    for (const item of track.items) {
      if (item.type === ItemType.ColorBlock && !item.collected) {
        const itemScreenY = item.positionY + track.distanceTraveledPx;
        if (Math.abs(clickY - itemScreenY) < 90 || Math.abs(clickY - agentY) < 110) {
          item.collected = true;
          return true;
        }
      }
    }
    return false;
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
