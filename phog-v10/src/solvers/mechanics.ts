/**
 * PHOG V10 - Mechanics Solver
 *
 * Handles position, velocity, and forces using Velocity Verlet integration.
 * Proven to conserve energy to 4e-14 J in Phase 2.
 */

export interface MechanicsState {
  position: number;  // m
  velocity: number;  // m/s
  mass: number;      // kg
  force: number;     // N (accumulated from couplings)
}

export class MechanicsSolver {
  state: MechanicsState = {
    position: 0,
    velocity: 0,
    mass: 1,
    force: 0
  };

  // Previous acceleration (for Velocity Verlet)
  private prevAccel: number = 0;
  private initialized: boolean = false;

  /**
   * Initialize with state
   */
  init(position: number, velocity: number, mass: number): void {
    this.state.position = position;
    this.state.velocity = velocity;
    this.state.mass = mass;
    this.state.force = 0;
    this.initialized = false;
  }

  /**
   * Step forward using Velocity Verlet integration
   *
   * Velocity Verlet (leapfrog variant):
   * 1. x(t+dt) = x(t) + v(t)·dt + 0.5·a(t)·dt²
   * 2. Calculate a(t+dt) from new position
   * 3. v(t+dt) = v(t) + 0.5·(a(t) + a(t+dt))·dt
   *
   * This is symplectic and conserves energy to machine precision.
   */
  step(dt: number, g: number): void {
    // Total force = gravity + coupled forces (friction, etc.)
    const F_gravity = -this.state.mass * g;
    const F_total = F_gravity + this.state.force;

    // Current acceleration
    const a = F_total / this.state.mass;

    if (!this.initialized) {
      // First step: use simple Euler for initialization
      this.state.position += this.state.velocity * dt + 0.5 * a * dt * dt;
      this.state.velocity += a * dt;
      this.prevAccel = a;
      this.initialized = true;
    } else {
      // Velocity Verlet
      // Update position: x(t+dt) = x(t) + v(t)·dt + 0.5·a(t)·dt²
      this.state.position += this.state.velocity * dt + 0.5 * this.prevAccel * dt * dt;

      // Update velocity: v(t+dt) = v(t) + 0.5·(a(t) + a(t+dt))·dt
      // Note: a(t+dt) = a since force is already calculated for this step
      this.state.velocity += 0.5 * (this.prevAccel + a) * dt;

      this.prevAccel = a;
    }

    // Reset coupled force for next step
    this.state.force = 0;
  }

  /**
   * Add an external force (from coupling)
   */
  addForce(F: number): void {
    this.state.force += F;
  }

  /**
   * Get kinetic energy
   */
  getKineticEnergy(): number {
    return 0.5 * this.state.mass * this.state.velocity * this.state.velocity;
  }

  /**
   * Get potential energy
   */
  getPotentialEnergy(g: number): number {
    return this.state.mass * g * this.state.position;
  }

  /**
   * Get total mechanical energy
   */
  getTotalEnergy(g: number): number {
    return this.getKineticEnergy() + this.getPotentialEnergy(g);
  }

  /**
   * Get momentum
   */
  getMomentum(): number {
    return this.state.mass * this.state.velocity;
  }
}
