import { TrackState, TrackItem, ItemType, V2_CONSTANTS } from '../types';
import { AgentManager } from './AgentManager';
import { JumpPhysics } from '../physics/JumpPhysics';

export interface CollisionResult {
  collectedItems: TrackItem[];
  clearedObstacles: TrackItem[];
  hitObstacles: TrackItem[];
  agentDiedInTracks: number[];
}

export class CollisionManager {
  constructor(private agentManager: AgentManager) {}

  /**
   * Evaluates collisions between the active agent and scrolling items for a track
   */
  checkCollisionsForTrack(
    track: TrackState,
    agentScreenY: number,
    itemScrollOffsetY: number
  ): CollisionResult {
    const result: CollisionResult = {
      collectedItems: [],
      clearedObstacles: [],
      hitObstacles: [],
      agentDiedInTracks: [],
    };

    if (!track.isUnlocked || !track.agent || !track.agent.alive) {
      return result;
    }

    const agent = track.agent;
    const agentRadius = 18;

    for (const item of track.items) {
      if (item.collected || item.clearedByJump) continue;

      // Item top & bottom in current screen space
      const itemTop = item.positionY + itemScrollOffsetY;
      const itemBottom = itemTop + item.lengthPx;

      // Check vertical intersection with agent footprint
      const isIntersecting = agentScreenY + agentRadius >= itemTop && agentScreenY - agentRadius <= itemBottom;

      if (isIntersecting) {
        if (item.isObstacle) {
          // Obstacle Collision Check
          if (JumpPhysics.hasObstacleClearance(agent)) {
            // Cleared safely by jumping over!
            item.clearedByJump = true;
            agent.obstaclesCleared++;
            result.clearedObstacles.push(item);
          } else {
            // Ground collision! Take hit penalty
            item.collected = true;
            result.hitObstacles.push(item);

            let penalty: number = V2_CONSTANTS.OBSTACLE_TOKEN_PENALTY;
            if (item.type === ItemType.GlitchObstacle) penalty = 40;
            if (item.type === ItemType.BugObstacle) penalty = 35;
            if (item.type === ItemType.MeetingObstacle) {
              penalty = 20;
              track.currentSpeed *= 0.45; // Speed bump!
            }
            if (item.type === ItemType.DreadObstacle) {
              agent.computeAuraTimer = 0; // Strip compute aura!
            }

            const died = this.agentManager.applyObstacleHit(agent, penalty);
            if (died) {
              track.agent = null;
              result.agentDiedInTracks.push(track.index);
            }
          }
        } else {
          // Power-Up / Compute Pickup
          item.collected = true;
          result.collectedItems.push(item);
          agent.powerUpsCollected++;

          if (item.type === ItemType.ComputeToken) {
            this.agentManager.feedCompute(agent, V2_CONSTANTS.COMPUTE_TOKEN_VALUE);
          } else if (item.type === ItemType.EnergySnack) {
            this.agentManager.feedCompute(agent, V2_CONSTANTS.ENERGY_SNACK_VALUE);
          } else if (item.type === ItemType.ColorBlock) {
            this.agentManager.feedCompute(agent, 30);
          }
        }
      }
    }

    return result;
  }
}
