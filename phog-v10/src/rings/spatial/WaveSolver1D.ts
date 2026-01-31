/**
 * PHOG V10 - Phase 5: 1D Wave Equation Solver
 *
 * Solves the wave equation:
 *   ∂²u/∂t² = c²·∂²u/∂x²
 *
 * Where:
 *   u = displacement field (m)
 *   c = wave speed (m/s)
 *   t = time (s)
 *   x = position (m)
 *
 * Rewritten as first-order system:
 *   ∂u/∂t = v
 *   ∂v/∂t = c²·∂²u/∂x²
 *
 * Uses symplectic (leapfrog) integration for energy conservation.
 */

import { Grid1D } from './Grid1D.js';
import { Derivatives1D } from './Derivatives1D.js';

export class WaveSolver1D {
  readonly grid: Grid1D;
  u: Float64Array;         // Displacement field u(x)
  v: Float64Array;         // Velocity field v(x) = ∂u/∂t
  readonly c: number;      // Wave speed (m/s)
  private initialU: Float64Array;
  private initialV: Float64Array;

  constructor(N: number, L: number, c: number) {
    this.grid = new Grid1D(N, L);
    this.u = new Float64Array(N);
    this.v = new Float64Array(N);
    this.initialU = new Float64Array(N);
    this.initialV = new Float64Array(N);
    this.c = c;
  }

  /**
   * Step forward in time using leapfrog integration
   *
   * v^{n+1} = v^n + dt·c²·∇²u^n  (kick)
   * u^{n+1} = u^n + dt·v^{n+1}   (drift)
   */
  step(dt: number): void {
    const lap = Derivatives1D.laplacian(this.u, this.grid.dx);

    // Kick: update velocity
    for (let i = 0; i < this.grid.N; i++) {
      this.v[i] += dt * this.c * this.c * lap[i];
    }

    // Drift: update displacement
    for (let i = 0; i < this.grid.N; i++) {
      this.u[i] += dt * this.v[i];
    }
  }

  /**
   * Get total mechanical energy
   *
   * E = ∫ [½ρv² + ½τ(∂u/∂x)²] dx
   *
   * Where:
   *   ρ = linear density (kg/m)
   *   τ = tension (N)
   *   c² = τ/ρ
   */
  getEnergy(rho: number, tension: number): number {
    const dudx = Derivatives1D.derivative(this.u, this.grid.dx);

    let E = 0;
    for (let i = 0; i < this.grid.N; i++) {
      const KE = 0.5 * rho * this.v[i] * this.v[i];
      const PE = 0.5 * tension * dudx[i] * dudx[i];
      E += (KE + PE) * this.grid.dx;
    }
    return E;
  }

  /**
   * Set initial displacement
   */
  setInitialDisplacement(init: (x: number) => number): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.u[i] = init(this.grid.x[i]);
      this.initialU[i] = this.u[i];
    }
  }

  /**
   * Set initial velocity
   */
  setInitialVelocity(init: (x: number) => number): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.v[i] = init(this.grid.x[i]);
      this.initialV[i] = this.v[i];
    }
  }

  /**
   * Reset to initial condition
   */
  reset(): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.u[i] = this.initialU[i];
      this.v[i] = this.initialV[i];
    }
  }

  /**
   * Get maximum displacement
   */
  getMaxDisplacement(): number {
    let max = -Infinity;
    for (let i = 0; i < this.grid.N; i++) {
      if (Math.abs(this.u[i]) > max) max = Math.abs(this.u[i]);
    }
    return max;
  }
}
