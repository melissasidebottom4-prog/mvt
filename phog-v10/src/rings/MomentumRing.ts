/**
 * PHOG V10 - Phase 4: Momentum Ring
 *
 * Wraps classical mechanics (position, velocity, forces).
 * Uses Velocity Verlet integration for symplectic conservation.
 *
 * Energy contributions:
 * - Kinetic: ½mv²
 * - Potential: mgh (gravitational)
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';

export interface MomentumState {
  position: number;   // m
  velocity: number;   // m/s
  mass: number;       // kg
  acceleration: number; // m/s² (computed)
}

export class MomentumRing extends PhysicalRingBase {
  readonly id = 'momentum';
  readonly name = 'Momentum Ring (Classical Mechanics)';

  private state: MomentumState = {
    position: 0,
    velocity: 0,
    mass: 1,
    acceleration: 0
  };

  // External forces accumulated this step
  private externalForce: number = 0;

  // Friction coefficient for coupling
  private frictionCoeff: number = 0;

  // Gravity parameter
  private g: number = 9.8;

  // Initial state for reset
  private initialState: MomentumState = { ...this.state };

  /**
   * Initialize the ring
   */
  init(position: number, velocity: number, mass: number, g: number = 9.8): void {
    this.state = {
      position,
      velocity,
      mass,
      acceleration: 0
    };
    this.g = g;
    this.initialState = { ...this.state };
    this.entropyProduced = 0;
    this.externalForce = 0;
  }

  /**
   * Set friction coefficient for coupling calculations
   */
  setFriction(mu: number): void {
    this.frictionCoeff = mu;
  }

  /**
   * Add external force for this step
   */
  addForce(F: number): void {
    this.externalForce += F;
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    const m = this.state.mass;
    const v = this.state.velocity;
    const h = this.state.position;

    const kinetic = 0.5 * m * v * v;
    const potential = m * this.g * h;

    return {
      kinetic,
      potential,
      internal: 0,
      total: kinetic + potential
    };
  }

  /**
   * Get kinematic state
   */
  getKinematicState(): KinematicState {
    return {
      position: this.state.position,
      velocity: this.state.velocity,
      mass: this.state.mass
    };
  }

  /**
   * Step using Velocity Verlet integration
   *
   * Velocity Verlet:
   * 1. x(t+dt) = x(t) + v(t)·dt + ½a(t)·dt²
   * 2. Compute a(t+dt) from new position
   * 3. v(t+dt) = v(t) + ½[a(t) + a(t+dt)]·dt
   */
  step(dt: number, params?: Record<string, number>): number {
    const g = params?.g ?? this.g;
    const m = this.state.mass;

    // Record energy before
    const E_before = this.getEnergy().total;

    // Current acceleration (gravity + external forces)
    // F = ma → a = F/m - g (gravity acts downward)
    const a_old = -g + this.externalForce / m;

    // Position update (Velocity Verlet step 1)
    const x_new = this.state.position +
                  this.state.velocity * dt +
                  0.5 * a_old * dt * dt;

    // Compute new acceleration (gravity + friction on new velocity estimate)
    // Estimate new velocity for friction calculation
    const v_estimate = this.state.velocity + a_old * dt;

    // Friction force opposes motion: F_f = -μ·v (simplified viscous friction)
    const F_friction = this.frictionCoeff > 0 && Math.abs(v_estimate) > 1e-10
      ? -this.frictionCoeff * v_estimate
      : 0;

    const a_new = -g + (this.externalForce + F_friction) / m;

    // Velocity update (Velocity Verlet step 3)
    const v_new = this.state.velocity + 0.5 * (a_old + a_new) * dt;

    // Update state
    this.state.position = x_new;
    this.state.velocity = v_new;
    this.state.acceleration = a_new;

    // Clear external forces
    this.externalForce = 0;

    // Return energy delta
    return this.getEnergy().total - E_before;
  }

  /**
   * Absorb energy (not directly applicable to momentum)
   * Momentum ring doesn't absorb energy - it dissipates to thermal
   */
  absorbEnergy(_amount: number): number {
    // Momentum ring loses energy via friction, doesn't absorb
    return 0;
  }

  /**
   * Get friction power for coupling to thermal
   */
  getFrictionPower(): number {
    // Power dissipated by friction: P = F_f · v = μ · v²
    const v = this.state.velocity;
    return this.frictionCoeff * v * v;
  }

  /**
   * Get coupling data to thermal ring
   */
  getCouplingTo(targetId: string): CouplingData | null {
    if (targetId === 'thermal' && this.frictionCoeff > 0) {
      return {
        energyFlux: this.getFrictionPower(),
        entropyFlux: 0,  // Computed by core
        sourceRing: this.id,
        targetRing: targetId
      };
    }
    return null;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = { ...this.initialState };
    this.externalForce = 0;
    this.entropyProduced = 0;
  }

  /**
   * Serialize for receipts
   */
  serialize(): Record<string, number> {
    return {
      position: this.state.position,
      velocity: this.state.velocity,
      mass: this.state.mass,
      acceleration: this.state.acceleration,
      g: this.g
    };
  }

  /**
   * Direct state access for coupling manager
   */
  getState(): MomentumState {
    return { ...this.state };
  }

  /**
   * Get gravity
   */
  getGravity(): number {
    return this.g;
  }
}
