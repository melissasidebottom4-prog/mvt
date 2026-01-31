/**
 * PHOG V10 - Phase 9: 1D Electromagnetic Solver
 *
 * Implements Maxwell's equations using Yee FDTD algorithm.
 *
 * PHYSICS:
 * - Ez field at integer points i
 * - Hy field at half-integer points i+0.5
 * - DNA charges from pre-calculated values (Solver 2)
 * - Water dielectric ε_r = 80 (pure) or 81.04 (C30)
 *
 * EQUATIONS (using H, not B, for numerical stability):
 * - ∂Hy/∂t = -(1/μ₀)∂Ez/∂x (Faraday)
 * - ∂Ez/∂t = (1/ε)∂Hy/∂x (Ampere-Maxwell)
 *
 * CFL CONDITION:
 * - dt < dx / c_medium where c_medium = 1/√(ε·μ₀)
 */

import { Grid1D } from '../spatial/Grid1D.js';

export class EMSolver1D {
  grid: Grid1D;
  Ez: Float64Array;   // Electric field (V/m) at integer points
  Hy: Float64Array;   // Magnetic field intensity (A/m) at half-integer points
  By: Float64Array;   // Alias for Hy * mu0 (for compatibility)
  rho: Float64Array;  // Charge density (C/m)
  eps: Float64Array;  // Permittivity ε(x) (F/m)

  readonly eps0 = 8.854e-12;  // Vacuum permittivity (F/m)
  readonly mu0 = 1.257e-6;    // Vacuum permeability (H/m)
  readonly c = 299792458;     // Speed of light in vacuum (m/s)

  constructor(N: number, L: number) {
    this.grid = new Grid1D(N, L);
    this.Ez = new Float64Array(N).fill(0);
    this.Hy = new Float64Array(N).fill(0);
    this.By = this.Hy;  // Alias (will compute B = μ₀H when needed)
    this.rho = new Float64Array(N).fill(0);
    // Default: water dielectric (ε_r = 80)
    this.eps = new Float64Array(N).fill(this.eps0 * 80);
  }

  // Store previous E values for Mur ABC
  private Ez_old_left: number = 0;
  private Ez_old_right: number = 0;

  /**
   * Yee FDTD algorithm step
   *
   * Staggered grid: Ez at i, Hy at i+0.5
   * Leapfrog in time: H at n+0.5, E at n+1
   *
   * Standard update coefficients:
   * - H update: dt / (μ₀ · dx)
   * - E update: dt / (ε · dx)
   */
  step(dt: number): void {
    const N = this.grid.N;
    const dx = this.grid.dx;

    // Pre-compute update coefficients
    const CH = dt / (this.mu0 * dx);  // H update coefficient

    // Store old boundary values for Mur ABC
    this.Ez_old_left = this.Ez[1];
    this.Ez_old_right = this.Ez[N - 2];

    // Update H field (Faraday's law)
    // From ∇×E = -∂B/∂t, in 1D TM: ∂Hy/∂t = (1/μ₀)·∂Ez/∂x
    // Hy[i] is at position (i + 0.5) * dx
    for (let i = 0; i < N - 1; i++) {
      this.Hy[i] += CH * (this.Ez[i + 1] - this.Ez[i]);
    }

    // Update E field (Ampere-Maxwell): ε·∂Ez/∂t = ∂Hy/∂x
    // Ez[i] is at position i * dx
    for (let i = 1; i < N - 1; i++) {
      const CE = dt / (this.eps[i] * dx);  // E update coefficient
      this.Ez[i] += CE * (this.Hy[i] - this.Hy[i - 1]);
    }

    // Mur first-order absorbing boundary conditions
    // Approximates outgoing wave: (∂/∂t + c·∂/∂x)E = 0
    const c_left = 1 / Math.sqrt(this.eps[0] * this.mu0);
    const c_right = 1 / Math.sqrt(this.eps[N - 1] * this.mu0);

    // Mur ABC coefficients
    const coeff_left = (c_left * dt - dx) / (c_left * dt + dx);
    const coeff_right = (c_right * dt - dx) / (c_right * dt + dx);

    // Left boundary: use saved value from interior
    const Ez0_new = this.Ez_old_left + coeff_left * (this.Ez[1] - this.Ez[0]);
    // Right boundary
    const EzN_new = this.Ez_old_right + coeff_right * (this.Ez[N - 2] - this.Ez[N - 1]);

    this.Ez[0] = Ez0_new;
    this.Ez[N - 1] = EzN_new;
  }

  /**
   * Set DNA charges using pre-calculated values (Solver 2)
   *
   * Charges based on electron density:
   * - A: -1.60e-19 C (1.0e)
   * - T: -1.28e-19 C (0.8e)
   * - G: -1.92e-19 C (1.2e)
   * - C: -1.44e-19 C (0.9e)
   *
   * Spread over 2-3 grid points per base
   */
  setDNACharges(sequence: string): void {
    const chargeMap: Record<string, number> = {
      'A': -1.60e-19,
      'T': -1.28e-19,
      'G': -1.92e-19,
      'C': -1.44e-19
    };

    const N_bases = sequence.length;
    const points_per_base = this.grid.N / N_bases;

    // Clear existing charges
    this.rho.fill(0);

    // Spread charges over multiple grid points
    for (let base_idx = 0; base_idx < N_bases; base_idx++) {
      const charge = chargeMap[sequence[base_idx]] || 0;
      const grid_start = Math.floor(base_idx * points_per_base);
      const grid_end = Math.min(Math.floor((base_idx + 1) * points_per_base), this.grid.N);
      const n_points = grid_end - grid_start;

      // Distribute charge over grid points
      for (let i = grid_start; i < grid_end; i++) {
        this.rho[i] = charge / (n_points * this.grid.dx);  // C/m (linear density)
      }
    }
  }

  /**
   * Initialize E field from charge distribution
   * Creates initial perturbation for biophoton emission
   */
  initializeFromCharges(scale: number = 1e10): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.Ez[i] = this.rho[i] * scale;
    }
  }

  /**
   * Total electromagnetic energy
   *
   * U = ∫ (ε·E²/2 + μ₀·H²/2) dx
   */
  getEnergy(): number {
    let U = 0;
    const dx = this.grid.dx;

    for (let i = 0; i < this.grid.N; i++) {
      const u_E = 0.5 * this.eps[i] * this.Ez[i] ** 2;
      const u_H = 0.5 * this.mu0 * (this.Hy[i] ** 2);
      U += (u_E + u_H) * dx;
    }

    return U;
  }

  /**
   * Get Poynting flux (energy flow) at center
   *
   * S = E × H
   */
  getPoyntingFlux(): number {
    const i = Math.floor(this.grid.N / 2);
    return this.Ez[i] * this.Hy[i];
  }

  /**
   * Get peak electric field magnitude
   */
  getPeakE(): number {
    let peak = 0;
    for (let i = 0; i < this.grid.N; i++) {
      if (Math.abs(this.Ez[i]) > peak) {
        peak = Math.abs(this.Ez[i]);
      }
    }
    return peak;
  }

  /**
   * Get peak magnetic field intensity (H)
   */
  getPeakH(): number {
    let peak = 0;
    for (let i = 0; i < this.grid.N; i++) {
      if (Math.abs(this.Hy[i]) > peak) {
        peak = Math.abs(this.Hy[i]);
      }
    }
    return peak;
  }

  /**
   * Get peak magnetic field (B = μ₀H)
   */
  getPeakB(): number {
    return this.mu0 * this.getPeakH();
  }

  /**
   * Set uniform permittivity
   */
  setPermittivity(eps_r: number): void {
    this.eps.fill(this.eps0 * eps_r);
  }

  /**
   * Get effective speed of light in medium
   */
  getSpeedInMedium(): number {
    const eps_avg = this.eps[Math.floor(this.grid.N / 2)];
    return 1 / Math.sqrt(eps_avg * this.mu0);
  }
}
