import {
  GamePhase,
  TrackState,
  VFXParticle,
  ShockwaveRing,
  DevModeSettings,
  KeyBindingsConfig,
  DEFAULT_KEY_BINDINGS,
} from '../types';
import { TrackManager } from '../entities/TrackManager';
import { AgentManager } from '../entities/AgentManager';
import { ItemSpawner } from '../entities/ItemSpawner';
import { CollisionManager } from '../entities/CollisionManager';

export class GameState {
  public phase: GamePhase = GamePhase.Menu;
  public unlockedLevel: number = 1; // 1 to 5 active tracks
  public gameTime: number = 0;

  public trackManager: TrackManager;
  public agentManager: AgentManager;
  public itemSpawner: ItemSpawner;
  public collisionManager: CollisionManager;

  public vfxParticles: VFXParticle[] = [];
  public shockwaves: ShockwaveRing[] = [];

  public totalTokensMaxxed: number = 0;
  public totalTokensBurned: number = 0;
  public totalLivesLost: number = 0;
  public overallProductivityPercent: number = 0;
  public screenShake: number = 0;

  public devMode: DevModeSettings = {
    allowSleeps: false,
    allowBlackObstacles: true,  // Default: ON
    allowBugObstacles: false,    // Default: OFF
    allowMeetingObstacles: false,// Default: OFF
    allowGlitchObstacles: false, // Default: OFF
  };

  public keyBindings: KeyBindingsConfig = { ...DEFAULT_KEY_BINDINGS };

  constructor() {
    this.agentManager = new AgentManager();
    this.trackManager = new TrackManager();
    this.itemSpawner = new ItemSpawner();
    this.collisionManager = new CollisionManager(this.agentManager);
    this.loadKeyBindings();
  }

  loadKeyBindings(): void {
    try {
      const saved = localStorage.getItem('sweeble_v2_keybindings');
      if (saved) {
        this.keyBindings = { ...DEFAULT_KEY_BINDINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
  }

  saveKeyBindings(newBindings: Partial<KeyBindingsConfig>): void {
    this.keyBindings = { ...this.keyBindings, ...newBindings };
    try {
      localStorage.setItem('sweeble_v2_keybindings', JSON.stringify(this.keyBindings));
    } catch {
      // fallback
    }
  }

  resetKeyBindingsToDefault(): void {
    this.keyBindings = { ...DEFAULT_KEY_BINDINGS };
    try {
      localStorage.removeItem('sweeble_v2_keybindings');
    } catch {
      // fallback
    }
  }

  /**
   * Resets the game to start fresh at a specific level (1 to 5 tracks)
   */
  reset(level: number = 1): void {
    this.unlockedLevel = Math.min(5, Math.max(1, level));
    this.phase = GamePhase.Playing;
    this.gameTime = 0;
    this.totalTokensMaxxed = 0;
    this.totalTokensBurned = 0;
    this.totalLivesLost = 0;
    this.overallProductivityPercent = 0;
    this.screenShake = 0;
    this.vfxParticles = [];
    this.shockwaves = [];

    this.trackManager.reset(this.unlockedLevel);
    this.itemSpawner.reset();
  }

  /**
   * Toggles pause / resume state during gameplay
   */
  togglePause(): void {
    if (this.phase === GamePhase.Playing) {
      this.phase = GamePhase.Paused;
    } else if (this.phase === GamePhase.Paused) {
      this.phase = GamePhase.Playing;
    }
  }

  /**
   * Spawns compute particles & shockwave at a position
   */
  triggerComputeFX(x: number, y: number, color: string, amount: number = 25): void {
    // Shockwave Ring
    this.shockwaves.push({
      x,
      y,
      r: 10,
      maxR: 75,
      alpha: 1.0,
      color,
    });

    // Floating text "+🪙 25"
    this.vfxParticles.push({
      id: `txt_${Date.now()}_${Math.random()}`,
      x,
      y: y - 20,
      vx: 0,
      vy: -60,
      radius: 0,
      color: '#FDE047',
      alpha: 1.0,
      life: 0,
      maxLife: 1.2,
      text: `+🪙 ${amount}`,
    });

    // Golden / pastel energy sparkles
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5);
      const speed = 60 + Math.random() * 80;
      this.vfxParticles.push({
        id: `sparkle_${Date.now()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3.5 + Math.random() * 2.5,
        color,
        alpha: 1.0,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.4,
      });
    }
  }

  /**
   * Spawns obstacle jump clearance sparkles
   */
  triggerJumpClearFX(x: number, y: number): void {
    this.vfxParticles.push({
      id: `jump_txt_${Date.now()}`,
      x,
      y: y - 25,
      vx: 0,
      vy: -50,
      radius: 0,
      color: '#6EE7B7',
      alpha: 1.0,
      life: 0,
      maxLife: 0.9,
      text: '✨ JUMPED!',
    });
  }

  /**
   * Spawns collision hit smoke & shake
   */
  triggerObstacleHitFX(x: number, y: number): void {
    this.screenShake = 12;

    this.vfxParticles.push({
      id: `hit_txt_${Date.now()}`,
      x,
      y: y - 20,
      vx: 0,
      vy: -40,
      radius: 0,
      color: '#FDA4AF',
      alpha: 1.0,
      life: 0,
      maxLife: 1.0,
      text: '💥 OUCH! -30',
    });

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      this.vfxParticles.push({
        id: `smoke_${Date.now()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 4,
        color: '#64748B',
        alpha: 0.8,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  /**
   * Spawns agent death / deactivation poof
   */
  triggerAgentDeathFX(x: number, y: number, name: string): void {
    this.vfxParticles.push({
      id: `death_txt_${Date.now()}`,
      x,
      y: y - 30,
      vx: 0,
      vy: -35,
      radius: 0,
      color: '#94A3B8',
      alpha: 1.0,
      life: 0,
      maxLife: 1.4,
      text: `💤 ${name} Out of Tokens!`,
    });

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.vfxParticles.push({
        id: `poof_${Date.now()}_${i}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5 + Math.random() * 4,
        color: '#CBD5E1',
        alpha: 0.7,
        life: 0,
        maxLife: 0.7,
      });
    }
  }

  getUnlockedTracks(): TrackState[] {
    return this.trackManager.tracks.filter(t => t.isUnlocked);
  }
}
