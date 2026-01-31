/**
 * PHOG V10 - Phase 9: Electromagnetic Ring
 *
 * Maxwell's equations in 1D using Yee FDTD algorithm.
 *
 * PHYSICS:
 * - Ez, By fields evolve via Maxwell equations
 * - DNA bases create charge density
 * - Water state modifies dielectric constant
 *
 * COUPLING (from Solver 3):
 * - Pure water: ε_r = 80.00
 * - C30 water:  ε_r = 81.04 (+1.3%)
 * - coupling_factor = 400 maps memory → Δε_r ≈ 1
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';
import { EMSolver1D } from './em/EMSolver1D.js';

export class EMRing extends PhysicalRingBase {
  readonly id = 'electromagnetic';
  readonly name = 'EM Ring (Maxwell FDTD)';

  private solver: EMSolver1D;

  // Water coupling data
  private waterMemory: number = 0;
  private waterState: number[] = [0, 1, 0, 0, 0];  // Default: liquid
  private eps_r: number = 80.0;  // Current relative permittivity

  // Coupling factor from Solver 3: gives Δε_r ≈ 1 for typical memory
  private readonly coupling_factor = 400;

  constructor(N: number, L: number) {
    super();
    this.solver = new EMSolver1D(N, L);
  }

  /**
   * Step forward using Yee FDTD algorithm
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
   * Get kinematic state
   */
  getKinematicState(): KinematicState {
    return {
      position: 0,
      velocity: this.solver.getSpeedInMedium(),
      mass: 0
    };
  }

  /**
   * Absorb energy into E field
   */
  absorbEnergy(amount: number): number {
    const N = this.solver.grid.N;
    const eps_avg = this.solver.eps[0];
    const dE = Math.sqrt(2 * Math.abs(amount) / (N * this.solver.grid.dx * eps_avg));

    if (amount > 0) {
      for (let i = 0; i < N; i++) {
        this.solver.Ez[i] += dE * 0.01;
      }
    }
    return amount;
  }

  /**
   * Get coupling data for other rings
   */
  getCouplingTo(targetId: string): CouplingData | null {
    if (targetId === 'genome' || targetId === 'spatial') {
      return {
        energyFlux: this.solver.getPoyntingFlux(),
        entropyFlux: 0,
        sourceRing: this.id,
        targetRing: targetId
      };
    }
    return null;
  }

  /**
   * Receive coupling from water ring
   *
   * Uses coupling_factor = 400 from Solver 3:
   * - Δε_r = memory × 1e20 × coupling_factor
   * - For memory ≈ 2.6e-23: Δε_r ≈ 1.04
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    if (sourceRing === 'state_space' && data.field_values) {
      this.waterMemory = data.field_values.memory_coherence || 0;
      this.waterState = data.field_values.water_state || [0, 1, 0, 0, 0];

      // Calculate permittivity change using pre-calculated coupling_factor
      const delta_eps_r = this.waterMemory * 1e20 * this.coupling_factor;
      this.eps_r = 80.0 * this.waterState[1] + delta_eps_r;

      // Update solver permittivity
      this.solver.setPermittivity(Math.max(1, this.eps_r));
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.solver.Ez.fill(0);
    this.solver.By.fill(0);
    this.solver.rho.fill(0);
    this.eps_r = 80.0;
    this.solver.setPermittivity(80.0);
    this.entropyProduced = 0;
  }

  /**
   * Serialize state for receipts
   */
  serialize(): Record<string, number> {
    return {
      energy: this.solver.getEnergy(),
      peak_E: this.solver.getPeakE(),
      peak_B: this.solver.getPeakB(),
      eps_r: this.eps_r,
      water_memory: this.waterMemory,
      speed_in_medium: this.solver.getSpeedInMedium()
    };
  }

  /**
   * Get internal solver for direct manipulation
   */
  getState(): EMSolver1D {
    return this.solver;
  }

  /**
   * Get current relative permittivity
   */
  getPermittivity(): number {
    return this.eps_r;
  }

  /**
   * Alias for step
   */
  spin(dt: number): void {
    this.step(dt);
  }
}
