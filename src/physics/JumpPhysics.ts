import { AgentState, V2_CONSTANTS } from '../types';

/**
 * JumpPhysics — Parabolic vertical leap arc and elevation collision handling
 */
export class JumpPhysics {
  /**
   * Triggers a jump on the agent if currently grounded
   */
  static triggerJump(agent: AgentState): boolean {
    if (!agent.alive || agent.isJumping) return false;

    agent.isJumping = true;
    agent.jumpTimer = 0;
    agent.jumpDuration = V2_CONSTANTS.JUMP_DURATION;
    agent.jumpHeightZ = 0;
    return true;
  }

  /**
   * Advances jump timer and calculates current elevation height z(t) ∈ [0, 1]
   */
  static updateJump(agent: AgentState, dt: number): void {
    if (!agent.isJumping) {
      agent.jumpHeightZ = 0;
      return;
    }

    agent.jumpTimer += dt;
    const progress = agent.jumpTimer / agent.jumpDuration;

    if (progress >= 1.0) {
      // Landed
      agent.isJumping = false;
      agent.jumpTimer = 0;
      agent.jumpHeightZ = 0;
    } else {
      // Smooth Parabolic Arc: z(p) = 4 * p * (1 - p)
      agent.jumpHeightZ = 4 * progress * (1 - progress);
    }
  }

  /**
   * Checks whether the jumping agent has enough elevation clearance to leap over an obstacle
   */
  static hasObstacleClearance(agent: AgentState): boolean {
    return agent.isJumping && agent.jumpHeightZ >= V2_CONSTANTS.JUMP_CLEARANCE_THRESHOLD;
  }

  /**
   * Elevation rendering metrics (pixel elevation, scale factor, drop-shadow offset)
   */
  static getElevationRenderData(agent: AgentState, scale: number): {
    elevationPx: number;
    visualScale: number;
    shadowScale: number;
    shadowAlpha: number;
    shadowOffsetPx: number;
  } {
    const z = agent.jumpHeightZ;
    const peakPx = agent.jumpPeakHeightPx || V2_CONSTANTS.JUMP_PEAK_HEIGHT_PX;
    const elevationPx = z * peakPx * scale;

    // Agent expands slightly as it jumps closer to the camera
    const visualScale = 1.0 + z * 0.28;

    // Shadow on track shrinks and fades as agent leaps higher
    const shadowScale = Math.max(0.4, 1.0 - z * 0.45);
    const shadowAlpha = Math.max(0.2, 0.65 - z * 0.4);
    const shadowOffsetPx = elevationPx * 0.8;

    return {
      elevationPx,
      visualScale,
      shadowScale,
      shadowAlpha,
      shadowOffsetPx,
    };
  }
}
