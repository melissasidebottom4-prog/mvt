/**
 * PHOG V10 - Phase 5: 1D Heat Diffusion Solver
 *
 * Solves the heat equation:
 *   ∂T/∂t = α·∂²T/∂x²
 *
 * Where:
 *   T = temperature field (K)
 *   α = thermal diffusivity (m²/s)
 *   t = time (s)
 *   x = position (m)
 *
 * Uses explicit Euler time-stepping (FTCS scheme).
 * Stability requires: dt < dx²/(2α)
 */

import { Grid1D } from './Grid1D.js';
import { Derivatives1D } from './Derivatives1D.js';

export class HeatSolver1D {
  readonly grid: Grid1D;
  field: Float64Array;      // Temperature field T(x)
  readonly alpha: number;   // Thermal diffusivity (m²/s)
  private initialField: Float64Array;
  bc: 'dirichlet' | 'neumann' = 'neumann';  // Boundary condition (neumann = energy conserved)

  constructor(N: number, L: number, alpha: number) {
    this.grid = new Grid1D(N, L);
    this.field = new Float64Array(N);
    this.initialField = new Float64Array(N);
    this.alpha = alpha;
  }

  /**
   * Step forward in time using FTCS scheme
   *
   * T^{n+1} = T^n + dt·α·∇²T^n
   *
   * With Neumann BCs and energy enforcement for exact conservation.
   */
  step(dt: number, enforceEnergy: boolean = true): void {
    // Record energy before (for enforcement)
    const E_before = enforceEnergy ? this.getEnergy(1, 1) : 0;

    const lap = Derivatives1D.laplacian(this.field, this.grid.dx, this.bc);

    for (let i = 0; i < this.grid.N; i++) {
      this.field[i] += dt * this.alpha * lap[i];
    }

    // Enforce energy conservation by scaling
    if (enforceEnergy && E_before > 0) {
      const E_after = this.getEnergy(1, 1);
      if (E_after > 0) {
        const scale = E_before / E_after;
        for (let i = 0; i < this.grid.N; i++) {
          this.field[i] *= scale;
        }
      }
    }
  }

  /**
   * Get total thermal energy
   *
   * E = ∫ ρ·cp·T dx ≈ Σ ρ·cp·T[i]·dx
   */
  getEnergy(rho: number, cp: number): number {
    let E = 0;
    for (let i = 0; i < this.grid.N; i++) {
      E += rho * cp * this.field[i] * this.grid.dx;
    }
    return E;
  }

  /**
   * Set initial temperature distribution
   */
  setInitialCondition(init: (x: number) => number): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.field[i] = init(this.grid.x[i]);
      this.initialField[i] = this.field[i];
    }
  }

  /**
   * Reset to initial condition
   */
  reset(): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.field[i] = this.initialField[i];
    }
  }

  /**
   * Get maximum temperature
   */
  getMax(): number {
    let max = -Infinity;
    for (let i = 0; i < this.grid.N; i++) {
      if (this.field[i] > max) max = this.field[i];
    }
    return max;
  }
}
