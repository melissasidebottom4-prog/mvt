/**
 * PHOG V10 - Phase 10: 3D Spatial Ring
 *
 * Universal ring for 3D spatial physics:
 * - Fluid: 3D Navier-Stokes with Taylor-Green vortex
 *
 * Features:
 * - Water memory coupling (viscosity modulation)
 * - Energy and enstrophy conservation
 * - CFL stability monitoring
 *
 * Parameters from Solvers 10A-10C:
 * - Grid: 32×32×32, L = 1mm
 * - dt = 1.6e-4 s
 * - ν_pure = 1e-6 m²/s, ν_C30 = 7.74e-7 m²/s
 * - SOR: ω = 1.822, 50 iterations
 *
 * Implements IPhysicalRing for integration with ConservationCore.
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState
} from './IPhysicalRing.js';
import { NavierStokes3D } from './spatial/NavierStokes3D.js';

export interface Spatial3DParams {
  Nx?: number;
  Ny?: number;
  Nz?: number;
  L?: number;
  nu?: number;
  rho?: number;
}

export class SpatialRing3D extends PhysicalRingBase {
  readonly id: string;
  readonly name: string = 'Spatial Ring 3D (Fluid)';

  private solver: NavierStokes3D;

  constructor(id: string, params: Spatial3DParams = {}) {
    super();
    this.id = id;

    const Nx = params.Nx ?? 32;
    const Ny = params.Ny ?? 32;
    const Nz = params.Nz ?? 32;
    const L = params.L ?? 1e-3;
    const nu = params.nu ?? 1e-6;
    const rho = params.rho ?? 1000;

    this.solver = new NavierStokes3D(Nx, Ny, Nz, L, nu, rho);
  }

  /**
   * Step forward in time
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.getEnergy().total;
    this.solver.step(dt);
    return this.getEnergy().total - E_before;
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    const kinetic = this.solver.getKineticEnergy();

    return {
      kinetic,
      potential: 0,
      internal: 0,
      total: kinetic
    };
  }

  /**
   * Get kinematic state
   */
  getKinematicState(): KinematicState {
    const grid = this.solver.grid;
    return {
      position: 0,
      velocity: this.solver.getMaxVelocity(),
      mass: this.solver.rho * grid.Lx * grid.Ly * grid.Lz
    };
  }

  /**
   * Absorb energy (not applicable for fluid)
   */
  absorbEnergy(_amount: number): number {
    return 0;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.solver.reset();
    this.entropyProduced = 0;
  }

  /**
   * Serialize state
   */
  serialize(): Record<string, number> {
    return {
      energy: this.getEnergy().total,
      enstrophy: this.solver.getEnstrophy(),
      max_velocity: this.solver.getMaxVelocity(),
      divergence: this.solver.getDivergence(),
      nu_effective: this.solver.nu_effective,
      nu_base: this.solver.nu_base
    };
  }

  /**
   * Receive coupling data from another ring
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    this.solver.receiveCouplingData(sourceRing, data);
  }

  /**
   * Get underlying solver state
   */
  getState(): NavierStokes3D {
    return this.solver;
  }

  // ============================================================
  // Fluid-specific accessors
  // ============================================================

  /**
   * Get enstrophy
   */
  getEnstrophy(): number {
    return this.solver.getEnstrophy();
  }

  /**
   * Get effective viscosity
   */
  getEffectiveViscosity(): number {
    return this.solver.nu_effective;
  }

  /**
   * Get base viscosity
   */
  getBaseViscosity(): number {
    return this.solver.nu_base;
  }

  /**
   * Get velocity divergence (should be near zero)
   */
  getDivergence(): number {
    return this.solver.getDivergence();
  }

  /**
   * Check CFL condition
   */
  checkCFL(dt: number): { ok: boolean; advection: number; diffusion: number } {
    return this.solver.checkCFL(dt);
  }

  /**
   * Set Taylor-Green vortex initial condition
   */
  setTaylorGreen(amplitude: number = 0.1): void {
    this.solver.setTaylorGreen(amplitude);
  }
}
