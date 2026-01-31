/**
 * PHOG V10 - Phase 9: Electromagnetic Ring
 *
 * Maxwell's equations in 1D using Yee algorithm (FDTD).
 *
 * PHYSICS:
 * - Ez, By fields evolve via Maxwell equations
 * - DNA bases create charge density
 * - Water state modifies dielectric constant
 *
 * COUPLING:
 * - Receives water memory from StateSpaceRing
 * - Memory modifies dielectric: eps_r = 80 + memory_contribution
 * - Higher coherence → different EM propagation
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState
} from './IPhysicalRing.js';
import { EMSolver1D } from './em/EMSolver1D.js';

export class EMRing extends PhysicalRingBase {
  readonly id = 'electromagnetic';
  readonly name = 'EM Ring (Maxwell 1D)';

  private solver: EMSolver1D;
  private initialEnergy: number = 0;

  // Water coupling data
  private waterMemory: number = 0;
  private waterState: number[] = [0, 1, 0, 0, 0];  // Default: liquid

  constructor(N: number, L: number) {
    super();
    this.solver = new EMSolver1D(N, L);
  }

  /**
   * Step forward using Yee algorithm
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.solver.getEnergy();
    this.solver.step(dt);
    const E_after = this.solver.getEnergy();
    return E_after - E_before;
  }

  /**
   * Get electromagnetic energy
   */
  getEnergy(): EnergyContributions {
    const U = this.solver.getEnergy();
    return {
      kinetic: 0,
      potential: 0,
      internal: U,  // EM energy stored in fields
      total: U
    };
  }

  /**
   * Get kinematic state (EM has no mass/momentum in this model)
   */
  getKinematicState(): KinematicState {
    return {
      position: 0,
      velocity: this.solver.c,  // Speed of light
      mass: 0
    };
  }

  /**
   * Absorb energy (add to E field)
   */
  absorbEnergy(amount: number): number {
    // Distribute energy to E field uniformly
    const N = this.solver.grid.N;
    const dE_per_cell = amount / (N * this.solver.grid.dx);

    // E field energy: U = 0.5 * eps * E^2
    // dU = eps * E * dE
    // If E = 0, need to add field: E = sqrt(2*dU/eps)
    const eps_avg = this.solver.eps[0];
    const dE = Math.sqrt(2 * Math.abs(dE_per_cell) / eps_avg);

    if (amount > 0) {
      for (let i = 0; i < N; i++) {
        this.solver.Ez[i] += dE * 0.1;  // Small perturbation
      }
    }
    return amount;
  }

  /**
   * Get coupling data (EM provides field info to other rings)
   */
  getCouplingTo(targetId: string): { energyFlux: number; entropyFlux: number; sourceRing: string; targetRing: string } | null {
    if (targetId === 'genome' || targetId === 'spatial') {
      return {
        energyFlux: this.solver.getPeakE() * 1e-20,  // Small coupling
        entropyFlux: 0,
        sourceRing: this.id,
        targetRing: targetId
      };
    }
    return null;
  }

  /**
   * Receive coupling from water ring
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    if (sourceRing === 'state_space' && data.field_values) {
      this.waterMemory = data.field_values.memory_coherence || 0;
      this.waterState = data.field_values.water_state || [0, 1, 0, 0, 0];

      // Update dielectric based on water state
      const eps_r = 80 * this.waterState[1] + this.waterMemory * 1e20;
      this.solver.eps.fill(this.solver.eps0 * Math.max(1, eps_r));
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.solver.Ez.fill(0);
    this.solver.By.fill(0);
    this.solver.rho.fill(0);
    this.entropyProduced = 0;
  }

  /**
   * Serialize state
   */
  serialize(): Record<string, number> {
    return {
      energy: this.solver.getEnergy(),
      peak_E: this.solver.getPeakE(),
      peak_B: this.solver.getPeakB(),
      water_memory: this.waterMemory
    };
  }

  /**
   * Get internal solver (for direct manipulation in examples)
   */
  getState(): EMSolver1D {
    return this.solver;
  }

  /**
   * Alias for step (used in some examples)
   */
  spin(dt: number): void {
    this.step(dt);
  }
}
