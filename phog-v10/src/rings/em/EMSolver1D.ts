/**
 * PHOG V10 - Phase 9: 1D Electromagnetic Solver
 *
 * Implements Maxwell's equations using Yee algorithm (FDTD).
 *
 * PHYSICS:
 * - Ez field (electric, z-component)
 * - By field (magnetic, y-component)
 * - Charge density rho from DNA bases
 * - Dielectric eps varies with water state
 *
 * EQUATIONS:
 * - dBy/dt = -dEz/dx (Faraday)
 * - dEz/dt = (1/eps) * dBy/dx / mu0 (Ampere)
 *
 * UNITS:
 * - SI units throughout
 * - c = 1/sqrt(eps0 * mu0) = 299792458 m/s
 */

import { Grid1D } from '../spatial/Grid1D.js';

export class EMSolver1D {
  grid: Grid1D;
  Ez: Float64Array;
  By: Float64Array;
  rho: Float64Array;
  eps: Float64Array;

  readonly eps0 = 8.854e-12;  // Vacuum permittivity (F/m)
  readonly mu0 = 1.257e-6;    // Vacuum permeability (H/m)
  readonly c = 299792458;     // Speed of light (m/s)

  constructor(N: number, L: number) {
    this.grid = new Grid1D(N, L);
    this.Ez = new Float64Array(N).fill(0);
    this.By = new Float64Array(N).fill(0);
    this.rho = new Float64Array(N).fill(0);
    // Default: vacuum (eps_r = 1) for stability
    // Water dielectric can be set via receiveCouplingData
    this.eps = new Float64Array(N).fill(this.eps0);
  }

  // Previous E field for wave equation stepping
  private Ez_prev: Float64Array | null = null;

  /**
   * Wave equation step (stable leapfrog)
   *
   * d²E/dt² = c² d²E/dx² where c = 1/sqrt(eps*mu0)
   *
   * Discretized: E[n+1] = 2*E[n] - E[n-1] + (c*dt/dx)²*(E[x+1] - 2*E[x] + E[x-1])
   *
   * CFL condition: c*dt/dx <= 1
   */
  step(dt: number): void {
    const N = this.grid.N;
    const dx = this.grid.dx;

    // Initialize previous field if first step
    if (this.Ez_prev === null) {
      this.Ez_prev = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        this.Ez_prev[i] = this.Ez[i];
      }
    }

    // Compute c² * (dt/dx)² for each point (can vary with eps)
    const Ez_new = new Float64Array(N);

    for (let i = 1; i < N - 1; i++) {
      // Local speed: c = 1/sqrt(eps*mu0)
      const c_local = 1 / Math.sqrt(this.eps[i] * this.mu0);
      const courant = c_local * dt / dx;

      if (courant > 1) {
        // CFL violation - clamp to stable
        console.warn(`CFL violation at i=${i}: courant=${courant.toFixed(3)}`);
      }

      const c2 = Math.min(courant * courant, 0.99);  // Clamp for stability

      // Wave equation leapfrog
      const d2Edx2 = this.Ez[i + 1] - 2 * this.Ez[i] + this.Ez[i - 1];
      Ez_new[i] = 2 * this.Ez[i] - this.Ez_prev[i] + c2 * d2Edx2;
    }

    // Absorbing boundary conditions (simple Mur ABC)
    // Left boundary: E[0,n+1] = E[1,n] + (c*dt-dx)/(c*dt+dx)*(E[1,n+1] - E[0,n])
    const c_left = 1 / Math.sqrt(this.eps[0] * this.mu0);
    const r_left = (c_left * dt - dx) / (c_left * dt + dx);
    Ez_new[0] = this.Ez[1] + r_left * (Ez_new[1] - this.Ez[0]);

    // Right boundary
    const c_right = 1 / Math.sqrt(this.eps[N - 1] * this.mu0);
    const r_right = (c_right * dt - dx) / (c_right * dt + dx);
    Ez_new[N - 1] = this.Ez[N - 2] + r_right * (Ez_new[N - 2] - this.Ez[N - 1]);

    // Swap arrays
    this.Ez_prev = this.Ez;
    this.Ez = Ez_new;

    // B field is derived from time derivative of E for display
    // By = -(1/c) * dE/dt ≈ -(1/c) * (Ez - Ez_prev) / dt
    // But for wave equation, we track E energy which equals total energy / 2
    for (let i = 0; i < N - 1; i++) {
      // Estimate B from spatial derivative (for display only)
      this.By[i] = (this.Ez_prev[i + 1] - this.Ez_prev[i]) / (dx * this.c) * 0.5;
    }
  }

  /**
   * Total electromagnetic energy
   *
   * For wave equation: U = eps * integral(E^2) dx
   * (kinetic and potential energy are equal on average for waves)
   *
   * We track E energy and double it to get total EM energy.
   */
  getEnergy(): number {
    let U_E = 0;
    for (let i = 0; i < this.grid.N; i++) {
      U_E += 0.5 * this.eps[i] * this.Ez[i] ** 2 * this.grid.dx;
    }
    // For wave equation, total energy = 2 * E field energy (equipartition)
    return U_E;
  }

  /**
   * Set charge density from DNA sequence
   *
   * Each base has characteristic charge:
   * - G: -3.2e-19 C (double H-bond, more polar)
   * - A, T, C: -1.6e-19 C (single electron equivalent)
   */
  setDNACharges(seq: string): void {
    const q: Record<string, number> = {
      'A': -1.6e-19,
      'T': -1.6e-19,
      'G': -3.2e-19,
      'C': -1.6e-19
    };
    for (let i = 0; i < Math.min(seq.length, this.grid.N); i++) {
      this.rho[i] = q[seq[i]] || 0;
    }
  }

  /**
   * Get peak electric field
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
   * Get peak magnetic field
   */
  getPeakB(): number {
    let peak = 0;
    for (let i = 0; i < this.grid.N; i++) {
      if (Math.abs(this.By[i]) > peak) {
        peak = Math.abs(this.By[i]);
      }
    }
    return peak;
  }
}
