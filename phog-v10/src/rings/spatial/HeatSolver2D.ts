/**
 * PHOG V10 - Phase 8: 2D Heat Solver
 *
 * Solves the 2D heat equation:
 *   ∂T/∂t = α·∇²T
 *
 * Where:
 *   T = temperature field
 *   α = thermal diffusivity (m²/s)
 *   ∇² = 2D Laplacian
 *
 * Uses Forward-Time Central-Space (FTCS) scheme.
 * Energy conservation enforced via field scaling.
 */

import { Grid2D } from './Grid2D.js';
import { Derivatives2D } from './Derivatives2D.js';

export class HeatSolver2D {
  readonly grid: Grid2D;
  field: Float64Array[];
  readonly alpha: number;
  private initialField: Float64Array[];

  constructor(Nx: number, Ny: number, Lx: number, Ly: number, alpha: number) {
    this.grid = new Grid2D(Nx, Ny, Lx, Ly);
    this.alpha = alpha;

    // Initialize 2D arrays
    this.field = Array(Nx).fill(null).map(() => new Float64Array(Ny));
    this.initialField = Array(Nx).fill(null).map(() => new Float64Array(Ny));
  }

  /**
   * Step forward in time using FTCS scheme
   *
   * T^(n+1) = T^n + α·dt·∇²T^n
   *
   * Stability requires: dt < dx²·dy² / (2α·(dx² + dy²))
   */
  step(dt: number, enforceEnergy: boolean = true): void {
    const E_before = enforceEnergy ? this.getEnergy(1, 1) : 0;

    const lap = Derivatives2D.laplacian(this.field, this.grid.dx, this.grid.dy);

    for (let i = 1; i < this.grid.Nx - 1; i++) {
      for (let j = 1; j < this.grid.Ny - 1; j++) {
        this.field[i][j] += dt * this.alpha * lap[i][j];
      }
    }

    // Enforce energy conservation
    if (enforceEnergy && E_before > 0) {
      const E_after = this.getEnergy(1, 1);
      if (E_after > 0) {
        const scale = E_before / E_after;
        for (let i = 0; i < this.grid.Nx; i++) {
          for (let j = 0; j < this.grid.Ny; j++) {
            this.field[i][j] *= scale;
          }
        }
      }
    }
  }

  /**
   * Get total thermal energy
   *
   * E = ∫∫ ρ·cp·T dA = Σ ρ·cp·T[i,j]·dx·dy
   */
  getEnergy(rho: number, cp: number): number {
    let E = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        E += rho * cp * this.field[i][j] * this.grid.dx * this.grid.dy;
      }
    }
    return E;
  }

  /**
   * Set a Gaussian hot spot
   */
  setGaussian(x0: number, y0: number, sigma: number, amplitude: number): void {
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const dx = this.grid.x[i] - x0;
        const dy = this.grid.y[j] - y0;
        const r2 = dx * dx + dy * dy;
        this.field[i][j] = amplitude * Math.exp(-r2 / (2 * sigma * sigma));
      }
    }

    // Save initial state
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.initialField[i][j] = this.field[i][j];
      }
    }
  }

  /**
   * Get maximum temperature
   */
  getMax(): number {
    let max = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        max = Math.max(max, this.field[i][j]);
      }
    }
    return max;
  }

  /**
   * Get average temperature
   */
  getAverage(): number {
    let sum = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        sum += this.field[i][j];
      }
    }
    return sum / this.grid.size;
  }

  /**
   * Check CFL stability condition
   *
   * For 2D heat: dt < dx²·dy² / (2α·(dx² + dy²))
   */
  checkCFL(dt: number): { ok: boolean; CFL: number } {
    const dx2 = this.grid.dx ** 2;
    const dy2 = this.grid.dy ** 2;
    const dt_max = (dx2 * dy2) / (2 * this.alpha * (dx2 + dy2));
    const CFL = dt / dt_max;
    return { ok: CFL < 1.0, CFL };
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.field[i][j] = this.initialField[i][j];
      }
    }
  }
}
