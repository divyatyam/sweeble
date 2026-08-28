import { TrackState, TrackItem, ItemType, DevModeSettings } from '../types';

export class ItemSpawner {
  private spawnCounters: Map<number, number> = new Map();
  private blackWaveTimer: number = 0;
  private nextWaveInterval: number = 16.0; // Occasional synchronized wave surges

  /**
   * Resets spawner for all tracks
   */
  reset(): void {
    this.spawnCounters.clear();
    this.blackWaveTimer = 0;
    this.nextWaveInterval = 16.0;
  }

  /**
   * Spawns synchronized Black Obstacle walls occasionally across ALL unlocked tracks
   */
  updateSynchronizedBlackWaves(tracks: TrackState[], dt: number, allowBlackObstacles: boolean = true): void {
    if (!allowBlackObstacles) return;
    const unlockedTracks = tracks.filter(t => t.isUnlocked && !t.isComplete && !t.isNightSleeping);
    if (unlockedTracks.length === 0) return;

    this.blackWaveTimer += dt;
    if (this.blackWaveTimer >= this.nextWaveInterval) {
      this.blackWaveTimer = 0;
      this.nextWaveInterval = 20.0 + Math.random() * 12.0; // Next synchronized wave in 20–32s

      // Synchronized Black Obstacle Themes
      const blackObstacleThemes = [
        { title: 'Black Tar Pit', icon: '', type: ItemType.TarObstacle, color: '#1E293B', accent: '#0F172A' },
        { title: 'Merge Conflict', icon: '', type: ItemType.TarObstacle, color: '#1E293B', accent: '#0F172A' },
        { title: 'Dependency Hell', icon: '', type: ItemType.TarObstacle, color: '#1E293B', accent: '#0F172A' },
        { title: 'Existential Dread', icon: '', type: ItemType.DreadObstacle, color: '#334155', accent: '#1E293B' },
        { title: 'AI Fatigue', icon: '', type: ItemType.DreadObstacle, color: '#334155', accent: '#1E293B' },
        { title: 'Doom Wall', icon: '', type: ItemType.DreadObstacle, color: '#1E293B', accent: '#0F172A' },
      ];
      const selected = blackObstacleThemes[Math.floor(Math.random() * blackObstacleThemes.length)];

      const lengthPx = 54;
      const targetScreenEntranceY = -120; // Exact identical top-of-screen entrance for all tracks

      for (const track of unlockedTracks) {
        const itemPosY = targetScreenEntranceY - track.distanceTraveledPx;

        const synchronizedItem: TrackItem = {
          id: `black-wave-${track.index}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          type: selected.type,
          trackIndex: track.index,
          positionY: itemPosY,
          lengthPx,
          title: selected.title,
          icon: '',
          color: selected.color,
          accentColor: selected.accent,
          isObstacle: true,
          isRecruiter: false,
          collected: false,
          clearedByJump: false,
        };

        track.items.push(synchronizedItem);

        // Keep buffer spacing in front of next procedural item
        if (track.nextSpawnY > itemPosY - 180) {
          track.nextSpawnY = itemPosY - 220;
        }
      }
    }
  }

  /**
   * Updates and spawns items independently along each track's stream
   */
  update(track: TrackState, _screenHeight: number, devMode?: DevModeSettings): TrackItem[] {
    if (!track.isUnlocked || track.isComplete || track.isNightSleeping) {
      return [];
    }

    const newItems: TrackItem[] = [];
    // Spawn ahead of the visible viewport in track coordinates
    const targetSpawnY = -track.distanceTraveledPx - 450;

    const counter = this.spawnCounters.get(track.index) || 0;

    while (track.nextSpawnY > targetSpawnY) {
      const hasActiveAgent = track.agent !== null && track.agent.alive;
      const type = this.chooseItemTypeForTrack(hasActiveAgent, devMode);
      const def = track.definition;

      let lengthPx = 46;
      let title = '';
      let icon = '';
      let color = '';
      let accentColor = '';
      let isObstacle = false;
      let isRecruiter = false;

      switch (type) {
        case ItemType.ColorBlock:
          lengthPx = 48;
          title = hasActiveAgent ? `${def.shortName} Boost` : 'Power Up';
          icon = '';
          color = def.theme.base;
          accentColor = def.theme.accent;
          isRecruiter = !hasActiveAgent;
          break;

        case ItemType.ComputeToken:
          lengthPx = 42;
          title = 'Compute Token';
          icon = '';
          color = '#FFFFFF';
          accentColor = '#FEF08A';
          break;

        case ItemType.EnergySnack:
          lengthPx = 44;
          title = 'Energy Surge';
          icon = '';
          color = '#FED7AA';
          accentColor = '#F97316';
          break;

        case ItemType.DreadObstacle: {
          lengthPx = 50;
          const dreadTitles = ['Existential Dread', 'AI Fatigue', 'Fear for Humanity', 'Doom Wall'];
          title = dreadTitles[Math.floor(Math.random() * dreadTitles.length)];
          icon = '';
          color = '#64748B';
          accentColor = '#334155';
          isObstacle = true;
          break;
        }

        case ItemType.TarObstacle: {
          lengthPx = 56;
          const tarTitles = ['Black Tar Pit', 'Merge Conflict', 'Dependency Hell'];
          title = tarTitles[Math.floor(Math.random() * tarTitles.length)];
          icon = '';
          color = '#1E293B';
          accentColor = '#0F172A';
          isObstacle = true;
          break;
        }

        case ItemType.BugObstacle: {
          lengthPx = 48;
          const bugTitles = ['Production Bug', 'Null Pointer Crash', 'Memory Leak', 'Outage Alarm'];
          title = bugTitles[Math.floor(Math.random() * bugTitles.length)];
          icon = '';
          color = '#FCA5A5';
          accentColor = '#DC2626';
          isObstacle = true;
          break;
        }

        case ItemType.MeetingObstacle: {
          lengthPx = 52;
          const meetingTitles = ['Unscheduled 1:1', 'Sync Meeting (30m)', 'Status Update'];
          title = meetingTitles[Math.floor(Math.random() * meetingTitles.length)];
          icon = '';
          color = '#93C5FD';
          accentColor = '#2563EB';
          isObstacle = true;
          break;
        }

        case ItemType.GlitchObstacle: {
          lengthPx = 50;
          const glitchTitles = ['Flaky CI/CD', 'Glitch in Prod', 'Rate Limit Error'];
          title = glitchTitles[Math.floor(Math.random() * glitchTitles.length)];
          icon = '';
          color = '#FED7AA';
          accentColor = '#EA580C';
          isObstacle = true;
          break;
        }
      }

      const item: TrackItem = {
        id: `item_${track.index}_${Date.now()}_${counter}`,
        trackIndex: track.index,
        type,
        positionY: track.nextSpawnY,
        lengthPx,
        title,
        icon,
        color,
        accentColor,
        isObstacle,
        isRecruiter,
        squadColor: def.squadColor,
        collected: false,
        clearedByJump: false,
      };

      track.items.push(item);
      newItems.push(item);

      this.spawnCounters.set(track.index, counter + 1);

      // Spacing between items along this track
      const spacing = 200 + Math.random() * 110;
      track.nextSpawnY -= (lengthPx + spacing);
    }

    return newItems;
  }

  /**
   * Cleans up items that have scrolled off the bottom of the screen
   */
  cleanupOffscreenItems(track: TrackState, screenHeight: number): void {
    track.items = track.items.filter(item => (item.positionY + track.distanceTraveledPx) < screenHeight + 150);
  }

  private chooseItemTypeForTrack(hasActiveAgent: boolean, devMode?: DevModeSettings): ItemType {
    if (!hasActiveAgent) {
      // Empty track prioritizes solid color blocks for recruiting
      const r = Math.random();
      if (r < 0.70) return ItemType.ColorBlock;
      return ItemType.ComputeToken;
    }

    // Active agent running down track: individual random obstacles and power-ups
    const enabledObstacles: ItemType[] = [];
    if (devMode?.allowBlackObstacles !== false) {
      enabledObstacles.push(ItemType.TarObstacle, ItemType.DreadObstacle);
    }
    if (devMode?.allowBugObstacles) enabledObstacles.push(ItemType.BugObstacle);
    if (devMode?.allowMeetingObstacles) enabledObstacles.push(ItemType.MeetingObstacle);
    if (devMode?.allowGlitchObstacles) enabledObstacles.push(ItemType.GlitchObstacle);

    const rand = Math.random();
    if (enabledObstacles.length > 0 && rand < 0.38) {
      return enabledObstacles[Math.floor(Math.random() * enabledObstacles.length)];
    }

    // Power-up collectibles & compute
    const pRand = Math.random();
    if (pRand < 0.55) return ItemType.ComputeToken; // 55% Compute Tokens
    if (pRand < 0.80) return ItemType.ColorBlock;   // 25% Matching Color Boosts
    return ItemType.EnergySnack;                    // 20% Energy Surges
  }
}
