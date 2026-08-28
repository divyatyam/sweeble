import { AgentState, TrackState, V2_CONSTANTS } from '../types';
import { JumpPhysics } from '../physics/JumpPhysics';

export interface AgentUpdateResult {
  diedTrackIndices: number[];
  computeAbsorbedTrackIndices: number[];
  tokensBurnedThisFrame: number;
}

export class AgentManager {
  /**
   * Instantiates / Hires an agent for a track when a solid color block is clicked
   */
  createAgentForTrack(track: TrackState): AgentState {
    const def = track.definition;
    const agent: AgentState = {
      id: `agent_${def.squadColor}_${Date.now()}`,
      trackIndex: track.index,
      roleName: def.roleName,
      icon: def.icon,
      squadColor: def.squadColor,
      theme: def.theme,
      alive: true,
      tokens: V2_CONSTANTS.DEFAULT_AGENT_TOKENS,
      maxTokens: V2_CONSTANTS.DEFAULT_AGENT_TOKENS,
      isJumping: false,
      jumpTimer: 0,
      jumpDuration: V2_CONSTANTS.JUMP_DURATION,
      jumpHeightZ: 0,
      jumpPeakHeightPx: V2_CONSTANTS.JUMP_PEAK_HEIGHT_PX,
      sizeMultiplier: 1.0,
      targetSizeMultiplier: 1.0,
      computeAuraTimer: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      invulnerableTimer: 0,
      tokensMaxxedTotal: V2_CONSTANTS.DEFAULT_AGENT_TOKENS,
      powerUpsCollected: 0,
      obstaclesCleared: 0,
      obstaclesHit: 0,
    };

    track.agent = agent;
    return agent;
  }

  /**
   * Triggers a jump on the agent in the specified track
   */
  jumpAgent(track: TrackState): boolean {
    if (!track.isUnlocked || !track.agent || !track.agent.alive) return false;
    return JumpPhysics.triggerJump(track.agent);
  }

  /**
   * Updates all active agents (token burn, jump physics, size scaling, death checks)
   */
  update(tracks: TrackState[], dt: number): AgentUpdateResult {
    const diedTrackIndices: number[] = [];
    const computeAbsorbedTrackIndices: number[] = [];
    let tokensBurnedThisFrame = 0;

    for (const track of tracks) {
      if (!track.isUnlocked || !track.agent || !track.agent.alive) continue;

      const agent = track.agent;

      // Update jump elevation arc
      JumpPhysics.updateJump(agent, dt);

      // Pulse and aura timers
      agent.pulsePhase += dt * 4.0;
      if (agent.computeAuraTimer > 0) {
        agent.computeAuraTimer -= dt;
      }
      if (agent.invulnerableTimer > 0) {
        agent.invulnerableTimer -= dt;
      }

      // Smooth size interpolation
      agent.sizeMultiplier += (agent.targetSizeMultiplier - agent.sizeMultiplier) * (dt * 6.0);

      // Natural Token Burn (only during active daytime, pause burn during night sleep)
      if (!track.isNightSleeping) {
        const burnRate = V2_CONSTANTS.TOKEN_BURN_RATE_PER_SEC;
        const burnAmount = burnRate * dt;
        agent.tokens -= burnAmount;
        tokensBurnedThisFrame += burnAmount;

        if (agent.tokens <= 0) {
          // Token Depletion -> Agent Dies!
          agent.tokens = 0;
          agent.alive = false;
          track.agent = null;
          diedTrackIndices.push(track.index);
        }
      }
    }

    return { diedTrackIndices, computeAbsorbedTrackIndices, tokensBurnedThisFrame };
  }

  /**
   * Feeds compute / tokens to an agent and triggers visual surge
   */
  feedCompute(agent: AgentState, amount: number): void {
    if (!agent.alive) return;

    agent.tokens = Math.min(agent.maxTokens * 1.5, agent.tokens + amount);
    agent.tokensMaxxedTotal += amount;
    agent.computeAuraTimer = 3.5;
    agent.targetSizeMultiplier = 1.4;
    setTimeout(() => {
      if (agent.alive) agent.targetSizeMultiplier = 1.0;
    }, 1200);
  }

  /**
   * Applies damage / penalty to an agent from an obstacle collision
   */
  applyObstacleHit(agent: AgentState, penalty: number = V2_CONSTANTS.OBSTACLE_TOKEN_PENALTY): boolean {
    if (!agent.alive || agent.invulnerableTimer > 0) return false;

    agent.tokens -= penalty;
    agent.obstaclesHit++;
    agent.invulnerableTimer = 1.2;
    agent.targetSizeMultiplier = 0.75;
    setTimeout(() => {
      if (agent.alive) agent.targetSizeMultiplier = 1.0;
    }, 800);

    if (agent.tokens <= 0) {
      agent.tokens = 0;
      agent.alive = false;
      return true; // Agent died from hit
    }

    return false;
  }
}
