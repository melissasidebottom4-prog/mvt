/**
 * PHOG V10 - Phase 8: 2D Spatial Ring
 *
 * Universal ring for 2D spatial physics:
 * - Heat: ∂T/∂t = α·∇²T (2D thermal diffusion)
 * - Fluid: Navier-Stokes with vortex dynamics
 *
 * Features:
 * - Water memory coupling (viscosity modulation)
 * - Energy and enstrophy conservation
 * - CFL stability monitoring
 *
 * Implements IPhysicalRing for integration with ConservationCore.
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';
import { HeatSolver2D } from './spatial/HeatSolver2D.js';
import { NavierStokes2D } from './spatial/NavierStokes2D.js';

export type Spatial2DMode = 'heat' | 'fluid';

export interface Spatial2DParams {
  // Heat mode
  alpha?: number;      // Thermal diffusivity (m²/s)
  rho?: number;        // Density (kg/m³)
  cp?: number;         // Specific heat (J/(kg·K))

  // Fluid mode
  nu?: number;         // Kinematic viscosity (m²/s)
}

export class SpatialRing2D extends PhysicalRingBase {
  readonly id: string;
  readonly name: string;

  private heatSolver?: HeatSolver2D;
  private fluidSolver?: NavierStokes2D;
  private mode: Spatial2DMode;
  private params: Spatial2DParams;

  constructor(
    id: string,
    mode: Spatial2DMode,
    Nx: number,
    Ny: number,
    Lx: number,
    Ly: number,
    params: Spatial2DParams
  ) {
    super();
    this.id = id;
    this.mode = mode;
    this.name = mode === 'heat' ? 'Spatial Ring 2D (Heat)' : 'Spatial Ring 2D (Fluid)';
    this.params = {
      alpha: 0.01,
      rho: 1000,
      cp: 4186,
      nu: 1e-3,
      ...params
    };

    // Initialize appropriate solver
    if (mode === 'heat') {
      this.heatSolver = new HeatSolver2D(Nx, Ny, Lx, Ly, this.params.alpha!);
    } else {
      this.fluidSolver = new NavierStokes2D(Nx, Ny, Lx, Ly, this.params.nu!, this.params.rho!);
    }
  }

  /**
   * Step forward in time
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.getEnergy().total;

    if (this.mode === 'heat' && this.heatSolver) {
      this.heatSolver.step(dt);
    } else if (this.mode === 'fluid' && this.fluidSolver) {
      this.fluidSolver.step(dt);
    }

    return this.getEnergy().total - E_before;
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    let kinetic = 0;
    let internal = 0;

    if (this.mode === 'heat' && this.heatSolver) {
      internal = this.heatSolver.getEnergy(this.params.rho!, this.params.cp!);
    } else if (this.mode === 'fluid' && this.fluidSolver) {
      kinetic = this.fluidSolver.getEnergy();
    }

    return {
      kinetic,
      potential: 0,
      internal,
      total: kinetic + internal
    };
  }

  /**
   * Get kinematic state
   */
  getKinematicState(): KinematicState {
    if (this.mode === 'heat' && this.heatSolver) {
      return {
        position: this.heatSolver.getAverage(),
        velocity: 0,
        mass: this.params.rho! * this.heatSolver.grid.Lx * this.heatSolver.grid.Ly
      };
    } else if (this.mode === 'fluid' && this.fluidSolver) {
      return {
        position: 0,
        velocity: this.fluidSolver.getMaxVelocity(),
        mass: this.params.rho! * this.fluidSolver.grid.Lx * this.fluidSolver.grid.Ly
      };
    }
    return { position: 0, velocity: 0, mass: 0 };
  }

  /**
   * Absorb energy
   */
  absorbEnergy(amount: number): number {
    if (this.mode === 'heat' && this.heatSolver) {
      // Distribute as temperature increase
      const grid = this.heatSolver.grid;
      const dT = amount / (this.params.rho! * this.params.cp! * grid.Lx * grid.Ly);
      for (let i = 0; i < grid.Nx; i++) {
        for (let j = 0; j < grid.Ny; j++) {
          this.heatSolver.field[i][j] += dT;
        }
      }
      return amount;
    }
    return 0;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    if (this.heatSolver) this.heatSolver.reset();
    if (this.fluidSolver) this.fluidSolver.reset();
    this.entropyProduced = 0;
  }

  /**
   * Serialize state
   */
  serialize(): Record<string, number> {
    const result: Record<string, number> = {
      mode: this.mode === 'heat' ? 0 : 1,
      energy: this.getEnergy().total
    };

    if (this.mode === 'fluid' && this.fluidSolver) {
      result.enstrophy = this.fluidSolver.getEnstrophy();
      result.nu_effective = this.fluidSolver.nu_effective;
    }

    return result;
  }

  /**
   * Receive coupling data from another ring
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    if (this.mode === 'fluid' && this.fluidSolver) {
      this.fluidSolver.receiveCouplingData(sourceRing, data);
    }
  }

  /**
   * Get underlying solver state
   */
  getState(): HeatSolver2D | NavierStokes2D {
    if (this.heatSolver) return this.heatSolver;
    if (this.fluidSolver) return this.fluidSolver;
    throw new Error('No solver initialized');
  }

  // ============================================================
  // Mode-specific accessors
  // ============================================================

  /**
   * Get enstrophy (fluid mode only)
   */
  getEnstrophy(): number {
    if (this.mode === 'fluid' && this.fluidSolver) {
      return this.fluidSolver.getEnstrophy();
    }
    return 0;
  }

  /**
   * Get effective viscosity (fluid mode only)
   */
  getEffectiveViscosity(): number {
    if (this.mode === 'fluid' && this.fluidSolver) {
      return this.fluidSolver.nu_effective;
    }
    return 0;
  }

  /**
   * Get base viscosity (fluid mode only)
   */
  getBaseViscosity(): number {
    if (this.mode === 'fluid' && this.fluidSolver) {
      return this.fluidSolver.nu_base;
    }
    return 0;
  }

  /**
   * Apply stirring (fluid mode only)
   */
  applyStirring(x: number, y: number, omega: number, radius: number): void {
    if (this.mode === 'fluid' && this.fluidSolver) {
      this.fluidSolver.applyStirring(x, y, omega, radius);
    }
  }

  /**
   * Clear forcing (fluid mode only)
   */
  clearForcing(): void {
    if (this.mode === 'fluid' && this.fluidSolver) {
      this.fluidSolver.clearForcing();
    }
  }

  /**
   * Check CFL condition
   */
  checkCFL(dt: number): { ok: boolean; CFL: number } {
    if (this.mode === 'heat' && this.heatSolver) {
      return this.heatSolver.checkCFL(dt);
    } else if (this.mode === 'fluid' && this.fluidSolver) {
      return this.fluidSolver.checkCFL(dt);
    }
    return { ok: true, CFL: 0 };
  }

  /**
   * Set initial Gaussian temperature (heat mode)
   */
  setGaussian(x0: number, y0: number, sigma: number, amplitude: number): void {
    if (this.mode === 'heat' && this.heatSolver) {
      this.heatSolver.setGaussian(x0, y0, sigma, amplitude);
    }
  }

  /**
   * Set Taylor-Green vortex (fluid mode)
   */
  setTaylorGreen(amplitude: number = 1.0): void {
    if (this.mode === 'fluid' && this.fluidSolver) {
      this.fluidSolver.setTaylorGreen(amplitude);
    }
  }
}
