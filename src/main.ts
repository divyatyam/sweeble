import { GameState } from './core/GameState';
import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { TrackRenderer } from './renderer/TrackRenderer';
import { AgentRenderer } from './renderer/AgentRenderer';
import { VFXRenderer } from './renderer/VFXRenderer';
import { UIRenderer } from './renderer/UIRenderer';
import { GamePhase } from './types';

// ── DOM Elements ──────────────────────────────────────
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const menuScreen = document.getElementById('menu-screen') as HTMLElement;
const startBtn = document.getElementById('start-btn') as HTMLButtonElement;
const levelSelect = document.getElementById('level-select') as HTMLElement;

// ── Instantiate Core Systems ──────────────────────────
const state = new GameState();
(window as any).sweebleState = state;
const canvasRenderer = new CanvasRenderer(canvas);

const getTrackBounds = (trackIndex: number) => {
  return state.trackManager.getTrackBounds(trackIndex, canvasRenderer.width, canvasRenderer.scale);
};

const quitToMenu = () => {
  state.phase = GamePhase.Menu;
  gameLoop.stop();
  menuScreen.style.display = 'flex';
};

// Input handling (Click-to-Recruit on Color Blocks, Click-to-Jump on Agents, Pause & Quit)
new InputManager(canvas, state, getTrackBounds, quitToMenu);

// ── Level Selection Buttons ───────────────────────────
if (levelSelect) {
  const btns = levelSelect.querySelectorAll<HTMLButtonElement>('.level-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lvl = parseInt(btn.getAttribute('data-level') || '1', 10);
      state.unlockedLevel = lvl;
      btns.forEach(b => {
        const bLvl = parseInt(b.getAttribute('data-level') || '1', 10);
        if (bLvl <= lvl) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    });
  });
}

// ── DevMode Settings ──────────────────────────────────
const bindDevToggle = (id: string, key: keyof typeof state.devMode) => {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.checked = state.devMode[key];
    el.addEventListener('change', () => {
      state.devMode[key] = el.checked;
    });
  }
};

bindDevToggle('allow-black-toggle', 'allowBlackObstacles');
bindDevToggle('allow-bugs-toggle', 'allowBugObstacles');
bindDevToggle('allow-meetings-toggle', 'allowMeetingObstacles');
bindDevToggle('allow-glitches-toggle', 'allowGlitchObstacles');
bindDevToggle('allow-sleeps-toggle', 'allowSleeps');

// ── Keybindings & Settings Modal Logic ────────────────
const settingsModal = document.getElementById('settings-modal') as HTMLElement | null;
const openSettingsBtn = document.getElementById('open-settings-btn') as HTMLButtonElement | null;
const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement | null;
const saveSettingsBtn = document.getElementById('save-settings-btn') as HTMLButtonElement | null;
const resetKeysBtn = document.getElementById('reset-keys-btn') as HTMLButtonElement | null;

const refreshKeyRemapButtons = () => {
  const remapBtns = document.querySelectorAll<HTMLButtonElement>('.key-remap-btn');
  remapBtns.forEach(btn => {
    const bindingKey = btn.getAttribute('data-binding') as keyof typeof state.keyBindings;
    if (bindingKey && state.keyBindings[bindingKey]) {
      const val = state.keyBindings[bindingKey];
      btn.textContent = val === ' ' || val.toLowerCase() === 'space' ? 'Space' : val.toUpperCase();
    }
  });
};

if (openSettingsBtn && settingsModal) {
  openSettingsBtn.addEventListener('click', () => {
    refreshKeyRemapButtons();
    settingsModal.style.display = 'flex';
  });
}

const hideSettings = () => {
  if (settingsModal) {
    settingsModal.style.display = 'none';
  }
};

if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', hideSettings);
if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', hideSettings);

if (resetKeysBtn) {
  resetKeysBtn.addEventListener('click', () => {
    state.resetKeyBindingsToDefault();
    refreshKeyRemapButtons();
  });
}

// Click to rebind a key
let currentRecordingBtn: HTMLButtonElement | null = null;
const remapBtns = document.querySelectorAll<HTMLButtonElement>('.key-remap-btn');

remapBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentRecordingBtn) {
      currentRecordingBtn.classList.remove('recording');
      refreshKeyRemapButtons();
    }
    currentRecordingBtn = btn;
    btn.classList.add('recording');
    btn.textContent = 'Press key...';
    (window as any).isKeyRemappingActive = true;
  });
});

window.addEventListener('keydown', (e) => {
  if (currentRecordingBtn && (window as any).isKeyRemappingActive) {
    e.preventDefault();
    e.stopPropagation();

    const bindingKey = currentRecordingBtn.getAttribute('data-binding') as keyof typeof state.keyBindings;
    if (bindingKey) {
      let keyName = e.key;
      if (e.code === 'Space' || keyName === ' ') keyName = 'Space';
      else if (keyName === 'ArrowUp') keyName = 'Up';
      else if (keyName === 'ArrowDown') keyName = 'Down';
      else if (keyName === 'ArrowLeft') keyName = 'Left';
      else if (keyName === 'ArrowRight') keyName = 'Right';

      state.saveKeyBindings({ [bindingKey]: keyName });
    }

    currentRecordingBtn.classList.remove('recording');
    currentRecordingBtn = null;
    (window as any).isKeyRemappingActive = false;
    refreshKeyRemapButtons();
  }
}, true);

// ── Start Sprint Button ───────────────────────────────
startBtn.addEventListener('click', () => {
  menuScreen.style.display = 'none';
  state.reset(state.unlockedLevel);
  gameLoop.start();
});

// Canvas click when week is complete to restart
canvas.addEventListener('click', () => {
  if (state.phase === GamePhase.WeekComplete) {
    state.reset(state.unlockedLevel);
  }
});

// ── Main Update Loop (60 Hz) ───────────────────────────
function update(dt: number) {
  if (state.phase !== GamePhase.Playing) return;

  state.gameTime += dt;

  if (state.screenShake > 0) {
    state.screenShake *= 0.88;
  }

  // 1. Update Tracks independently (speed, distance, 5-day cycle)
  state.trackManager.update(dt, state.devMode.allowSleeps);

  // 2. Synchronized Black Obstacle Waves across ALL active nodes simultaneously
  state.itemSpawner.updateSynchronizedBlackWaves(state.trackManager.tracks, dt);

  // 3. Spawn and update procedural items along each track's stream
  for (const track of state.getUnlockedTracks()) {
    state.itemSpawner.update(track, canvasRenderer.height);
    state.itemSpawner.cleanupOffscreenItems(track, canvasRenderer.height);
  }

  // 3. Update Agents (token burn, jump physics, death checks)
  const agentUpdate = state.agentManager.update(state.trackManager.tracks, dt);
  state.totalTokensBurned += agentUpdate.tokensBurnedThisFrame;

  for (const diedTrackIdx of agentUpdate.diedTrackIndices) {
    state.totalLivesLost++;
    const track = state.trackManager.tracks[diedTrackIdx];
    if (track) {
      const bounds = getTrackBounds(track.index);
      state.triggerAgentDeathFX(bounds.centerX, canvasRenderer.height * 0.78, track.definition.shortName);
    }
  }

  // 4. Collision Evaluations (Jump over obstacles vs. ground hits & compute absorption)
  const agentScreenY = canvasRenderer.height * 0.78;

  for (const track of state.getUnlockedTracks()) {
    const collisionResult = state.collisionManager.checkCollisionsForTrack(
      track,
      agentScreenY,
      track.distanceTraveledPx
    );

    const bounds = getTrackBounds(track.index);

    // Compute / Power-Up Visual Effects
    for (const _item of collisionResult.collectedItems) {
      state.triggerComputeFX(bounds.centerX, agentScreenY, track.definition.theme.base, 25);
      state.totalTokensMaxxed += 25;
    }

    // Jump Clear Visual Effects
    for (const _obstacle of collisionResult.clearedObstacles) {
      state.triggerJumpClearFX(bounds.centerX, agentScreenY);
    }

    // Obstacle Ground Hits
    for (const _hit of collisionResult.hitObstacles) {
      state.totalTokensBurned += 30; // Tokens lost from damage
      state.triggerObstacleHitFX(bounds.centerX, agentScreenY);
    }

    // Death from hit
    for (const _diedIdx of collisionResult.agentDiedInTracks) {
      state.totalLivesLost++;
      state.triggerAgentDeathFX(bounds.centerX, agentScreenY, track.definition.shortName);
    }
  }

  // 5. Update VFX Particles & Shockwaves
  const vfx = VFXRenderer.update(state.vfxParticles, state.shockwaves, dt);
  state.vfxParticles = vfx.particles;
  state.shockwaves = vfx.shockwaves;

  // 6. Update Weekly Productivity %
  state.overallProductivityPercent = state.trackManager.getTotalWeeklyProductivity();

  // 7. Check if all unlocked tracks reached Friday Night (5 Days)
  if (state.trackManager.areAllTracksComplete()) {
    state.phase = GamePhase.WeekComplete;
  }
}

// ── Main Render Loop ───────────────────────────────────
function render(_interpolation: number) {
  if (state.phase === GamePhase.Menu) return;

  const ctx = canvasRenderer.ctx;
  const scale = canvasRenderer.scale;
  const screenH = canvasRenderer.height;
  const screenW = canvasRenderer.width;

  canvasRenderer.beginFrame(state.screenShake);

  // 1. Render Calendar Columns, Backgrounds, Scrolling Items & Day Trackers
  TrackRenderer.render(ctx, state.trackManager.tracks, getTrackBounds, screenH, scale, state.devMode.allowSleeps);

  // 2. Render Active or Sleeping Agents
  const agentScreenY = screenH * 0.78;
  for (const track of state.getUnlockedTracks()) {
    const bounds = getTrackBounds(track.index);
    if (track.agent && track.agent.alive) {
      AgentRenderer.render(ctx, track.agent, bounds.centerX, agentScreenY, scale);
    } else if (!track.isComplete) {
      AgentRenderer.renderSleepingAgent(ctx, track.definition, bounds.centerX, agentScreenY, scale);
    }
  }

  // 3. Render VFX Shockwaves, Sparkles, and Floating Text
  VFXRenderer.render(ctx, state.vfxParticles, state.shockwaves, scale);

  // 4. Render Top Tokenmaxxing & Productivity HUD & Modals
  UIRenderer.render(ctx, state, screenW, scale);

  canvasRenderer.endFrame();
}

// ── Start Loop Instance ────────────────────────────────
const gameLoop = new GameLoop(update, render);

// Initial UI Setup
menuScreen.style.display = 'flex';
