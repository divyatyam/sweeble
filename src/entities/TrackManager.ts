import { TrackState, PASTEL_TRACKS, V2_CONSTANTS } from '../types';

export class TrackManager {
  public tracks: TrackState[] = [];

  constructor() {
    this.reset(1);
  }

  /**
   * Initializes or resets tracks based on current unlocked level (1 to 5)
   */
  reset(unlockedLevel: number = 1): void {
    this.tracks = PASTEL_TRACKS.map((def, idx) => {
      const isUnlocked = idx < unlockedLevel;
      return {
        index: idx,
        definition: def,
        isUnlocked,
        dayNumber: 1,
        sleepCount: 0,
        dayProgress: 0,
        isNightSleeping: false,
        sleepTimer: 0,
        currentSpeed: isUnlocked ? V2_CONSTANTS.AGENT_BASE_SPEED : 0,
        baseSpeed: V2_CONSTANTS.AGENT_BASE_SPEED,
        distanceTraveledPx: 0,
        isComplete: false,
        agent: null,
        items: [],
        nextSpawnY: 50,
        productivityScore: 0,
      };
    });
  }

  /**
   * Unlocks tracks up to the target level
   */
  unlockToLevel(level: number): void {
    const clamped = Math.min(V2_CONSTANTS.MAX_TRACKS, Math.max(1, level));
    for (let i = 0; i < clamped; i++) {
      const track = this.tracks[i];
      if (track && !track.isUnlocked) {
        track.isUnlocked = true;
        track.currentSpeed = track.baseSpeed;
      }
    }
  }

  /**
   * Updates all active tracks independently (timeline, speed, day/night sleep cycles)
   */
  update(dt: number, allowSleeps: boolean = false): void {
    for (const track of this.tracks) {
      if (!track.isUnlocked || track.isComplete) continue;

      const hasActiveAgent = track.agent !== null && track.agent.alive;

      if (allowSleeps && track.isNightSleeping) {
        // Sleep night period (smooth rest & recovery)
        track.sleepTimer -= dt;
        if (track.sleepTimer <= 0) {
          track.isNightSleeping = false;
          track.sleepTimer = 0;
          track.dayNumber++;

          if (track.dayNumber > V2_CONSTANTS.TOTAL_DAYS) {
            // Track completed its week!
            track.isComplete = true;
            track.dayNumber = V2_CONSTANTS.TOTAL_DAYS;
            track.productivityScore = this.calculateTrackProductivity(track, allowSleeps);
          }
        }
      } else {
        // Active daytime
        let targetSpeed = hasActiveAgent ? track.baseSpeed : track.baseSpeed * 0.35;

        // Apply speed power-ups from agent
        if (hasActiveAgent && track.agent && track.agent.computeAuraTimer > 0) {
          targetSpeed *= V2_CONSTANTS.SPEED_BOOST_MULTIPLIER;
        }

        // Smooth speed interpolation
        track.currentSpeed += (targetSpeed - track.currentSpeed) * (dt * 4.0);

        // Advance distance
        const distanceDelta = track.currentSpeed * dt;
        track.distanceTraveledPx += distanceDelta;

        // Advance day progress (only if agent is running or track is moving)
        const dayDuration = V2_CONSTANTS.DAY_DURATION_SECONDS;
        track.dayProgress += (dt / dayDuration) * (hasActiveAgent ? 1.0 : 0.4);

        if (track.dayProgress >= 1.0) {
          track.dayProgress = 0;

          if (allowSleeps) {
            // Night sleep obstacle transition
            track.sleepCount++;
            track.isNightSleeping = true;
            track.sleepTimer = V2_CONSTANTS.SLEEP_DURATION_SECONDS;
          } else {
            // Continuous progression without night sleep interruption
            track.dayNumber++;
            if (track.dayNumber > V2_CONSTANTS.TOTAL_DAYS) {
              track.isComplete = true;
              track.dayNumber = V2_CONSTANTS.TOTAL_DAYS;
              track.productivityScore = this.calculateTrackProductivity(track, allowSleeps);
            }
          }
        }
      }
    }
  }

  /**
   * Calculates individual track productivity score (0 to 100)
   */
  calculateTrackProductivity(track: TrackState, allowSleeps: boolean = false): number {
    if (!track.isUnlocked) return 0;
    const completedProgress = allowSleeps
      ? track.sleepCount
      : (track.isComplete ? V2_CONSTANTS.TOTAL_DAYS : (track.dayNumber - 1) + track.dayProgress);

    if (!track.agent) return Math.min(100, Math.round((completedProgress / V2_CONSTANTS.TOTAL_DAYS) * 45));

    const agent = track.agent;
    const tokensFactor = Math.min(40, agent.tokensMaxxedTotal / 12);
    const clearsFactor = Math.min(30, agent.obstaclesCleared * 4);
    const dayFactor = (completedProgress / V2_CONSTANTS.TOTAL_DAYS) * 30;
    const penalty = agent.obstaclesHit * 5;

    const raw = dayFactor + tokensFactor + clearsFactor - penalty;
    return Math.min(100, Math.max(0, Math.round(raw)));
  }

  /**
   * Checks if all unlocked tracks have finished their 7-day week
   */
  areAllTracksComplete(): boolean {
    const unlocked = this.tracks.filter(t => t.isUnlocked);
    return unlocked.length > 0 && unlocked.every(t => t.isComplete);
  }

  /**
   * Calculates aggregated total weekly productivity percentage (0 to 100%)
   */
  getTotalWeeklyProductivity(): number {
    const unlocked = this.tracks.filter(t => t.isUnlocked);
    if (unlocked.length === 0) return 0;

    let totalScore = 0;
    for (const track of unlocked) {
      totalScore += track.isComplete ? track.productivityScore : this.calculateTrackProductivity(track);
    }

    return Math.min(100, Math.max(0, Math.round(totalScore / unlocked.length)));
  }

  /**
   * Calculates track lane boundaries in screen coordinates
   */
  getTrackBounds(trackIndex: number, canvasWidth: number, _scale: number): {
    left: number;
    right: number;
    centerX: number;
    laneWidth: number;
  } {
    const unlockedTracks = this.tracks.filter(t => t.isUnlocked);
    const numTracks = Math.max(1, unlockedTracks.length);

    // Responsive margins: narrow on mobile (< 600px), spacious on desktop
    const marginRatio = canvasWidth < 600 ? 0.03 : 0.10;
    const margin = canvasWidth * marginRatio;
    const playableWidth = canvasWidth - margin * 2;
    const laneWidth = playableWidth / numTracks;

    const left = margin + trackIndex * laneWidth;
    const right = left + laneWidth;
    const centerX = left + laneWidth / 2;

    return { left, right, centerX, laneWidth };
  }
}
