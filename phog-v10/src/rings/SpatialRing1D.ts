/**
 * PHOG V10 - Phase 5: 1D Spatial Ring
 *
 * Universal ring for 1D spatial physics:
 * - Heat: ∂T/∂t = α·∂²T/∂x² (thermal diffusion)
 * - Wave: ∂²u/∂t² = c²·∂²u/∂x² (mechanical propagation)
 * - Genome: iℏ·∂ψ/∂t = Ĥψ (quantum electron on DNA)
 *
 * Implements IPhysicalRing for integration with ConservationCore.
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';
import { HeatSolver1D } from './spatial/HeatSolver1D.js';
import { WaveSolver1D } from './spatial/WaveSolver1D.js';
import { GenomeSolver1D } from './spatial/GenomeSolver1D.js';

export type SpatialMode = 'heat' | 'wave' | 'genome';

export interface SpatialParams {
  // Heat mode
  alpha?: number;      // Thermal diffusivity (m²/s)
  rho?: number;        // Density (kg/m³)
  cp?: number;         // Specific heat (J/(kg·K))

  // Wave mode
  c?: number;          // Wave speed (m/s)
  tension?: number;    // String tension (N)
  linearDensity?: number; // Linear density (kg/m)

  // Genome mode
  potential?: Float64Array; // Potential energy at each site (J)
}

export class SpatialRing1D extends PhysicalRingBase {
  readonly id: string;
  readonly name: string;
  readonly mode: SpatialMode;

  private heatSolver?: HeatSolver1D;
  private waveSolver?: WaveSolver1D;
  private genomeSolver?: GenomeSolver1D;

  private params: SpatialParams;
  private N: number;
  private L: number;

  constructor(mode: SpatialMode, N: number, L: number, params: SpatialParams) {
    super();
    this.mode = mode;
    this.N = N;
    this.L = L;
    this.params = {
      // Defaults
      alpha: 0.01,
      rho: 1000,
      cp: 1000,
      c: 343,
      tension: 1,
      linearDensity: 1,
      ...params
    };

    this.id = `spatial_1d_${mode}`;
    this.name = this.getModeName();

    // Initialize appropriate solver
    switch (mode) {
      case 'heat':
        this.heatSolver = new HeatSolver1D(N, L, this.params.alpha!);
        break;
      case 'wave':
        this.waveSolver = new WaveSolver1D(N, L, this.params.c!);
        break;
      case 'genome':
        this.genomeSolver = new GenomeSolver1D(N, L);
        break;
    }
  }

  private getModeName(): string {
    switch (this.mode) {
      case 'heat': return 'Spatial Ring 1D (Heat Diffusion)';
      case 'wave': return 'Spatial Ring 1D (Wave Propagation)';
      case 'genome': return 'Spatial Ring 1D (Quantum Genome)';
    }
  }

  /**
   * Get the underlying solver for direct manipulation
   */
  getSolver(): HeatSolver1D | WaveSolver1D | GenomeSolver1D {
    if (this.heatSolver) return this.heatSolver;
    if (this.waveSolver) return this.waveSolver;
    if (this.genomeSolver) return this.genomeSolver;
    throw new Error('No solver initialized');
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    let kinetic = 0;
    let potential = 0;
    let internal = 0;

    switch (this.mode) {
      case 'heat':
        // Thermal energy is internal
        internal = this.heatSolver!.getEnergy(this.params.rho!, this.params.cp!);
        break;

      case 'wave':
        // Wave has kinetic and potential
        const waveSolver = this.waveSolver!;
        const dudx = new Float64Array(waveSolver.grid.N);
        const dx = waveSolver.grid.dx;

        // Compute derivative for potential energy
        for (let i = 1; i < waveSolver.grid.N - 1; i++) {
          dudx[i] = (waveSolver.u[i + 1] - waveSolver.u[i - 1]) / (2 * dx);
        }

        for (let i = 0; i < waveSolver.grid.N; i++) {
          kinetic += 0.5 * this.params.linearDensity! * waveSolver.v[i] * waveSolver.v[i] * dx;
          potential += 0.5 * this.params.tension! * dudx[i] * dudx[i] * dx;
        }
        break;

      case 'genome':
        // Quantum energy from expectation value
        const V = this.params.potential || new Float64Array(this.N);
        internal = this.genomeSolver!.getEnergy(V);
        break;
    }

    return {
      kinetic,
      potential,
      internal,
      total: kinetic + potential + internal
    };
  }

  /**
   * Get kinematic state (aggregate over spatial domain)
   */
  getKinematicState(): KinematicState {
    switch (this.mode) {
      case 'heat':
        // "Position" is average temperature
        let avgT = 0;
        for (let i = 0; i < this.heatSolver!.grid.N; i++) {
          avgT += this.heatSolver!.field[i];
        }
        avgT /= this.heatSolver!.grid.N;
        return { position: avgT, velocity: 0, mass: this.params.rho! * this.L };

      case 'wave':
        // Average displacement and velocity
        let avgU = 0, avgV = 0;
        for (let i = 0; i < this.waveSolver!.grid.N; i++) {
          avgU += this.waveSolver!.u[i];
          avgV += this.waveSolver!.v[i];
        }
        avgU /= this.waveSolver!.grid.N;
        avgV /= this.waveSolver!.grid.N;
        return { position: avgU, velocity: avgV, mass: this.params.linearDensity! * this.L };

      case 'genome':
        // Expectation value of position
        let avgX = 0;
        const rho = this.genomeSolver!.getProbabilityDensity();
        for (let i = 0; i < this.genomeSolver!.grid.N; i++) {
          avgX += this.genomeSolver!.grid.x[i] * rho[i] * this.genomeSolver!.grid.dx;
        }
        return { position: avgX, velocity: 0, mass: this.genomeSolver!.mass };
    }
  }

  /**
   * Step forward in time
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.getEnergy().total;

    switch (this.mode) {
      case 'heat':
        this.heatSolver!.step(dt);
        break;
      case 'wave':
        this.waveSolver!.step(dt);
        break;
      case 'genome':
        const V = this.params.potential || new Float64Array(this.N);
        this.genomeSolver!.step(dt, V);
        break;
    }

    return this.getEnergy().total - E_before;
  }

  /**
   * Absorb energy (add heat for thermal, not applicable for others)
   */
  absorbEnergy(amount: number): number {
    if (this.mode === 'heat') {
      // Distribute energy uniformly as temperature increase
      const dT = amount / (this.params.rho! * this.params.cp! * this.L);
      for (let i = 0; i < this.heatSolver!.grid.N; i++) {
        this.heatSolver!.field[i] += dT;
      }
      return amount;
    }
    return 0;  // Wave and genome don't absorb energy this way
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    if (this.heatSolver) this.heatSolver.reset();
    if (this.waveSolver) this.waveSolver.reset();
    if (this.genomeSolver) this.genomeSolver.reset();
    this.entropyProduced = 0;
  }

  /**
   * Serialize for receipts
   */
  serialize(): Record<string, number> {
    const result: Record<string, number> = {
      mode_hash: this.mode.charCodeAt(0),
      N: this.N,
      L: this.L
    };

    switch (this.mode) {
      case 'heat':
        result.maxT = this.heatSolver!.getMax();
        result.totalEnergy = this.getEnergy().total;
        break;
      case 'wave':
        result.maxU = this.waveSolver!.getMaxDisplacement();
        result.totalEnergy = this.getEnergy().total;
        break;
      case 'genome':
        result.probability = this.genomeSolver!.getProbability();
        result.totalEnergy = this.getEnergy().total;
        break;
    }

    return result;
  }

  /**
   * Get probability (genome mode only)
   */
  getProbability(): number {
    if (this.mode === 'genome') {
      return this.genomeSolver!.getProbability();
    }
    return 1;  // Other modes have "probability" of 1
  }

  /**
   * Set potential for genome mode
   */
  setPotential(V: Float64Array): void {
    this.params.potential = V;
  }
}
