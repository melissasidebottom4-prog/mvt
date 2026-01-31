/**
 * PHOG V10 - Phase 5: 1D Genome Quantum Solver
 *
 * Solves the time-dependent Schrödinger equation:
 *   iℏ·∂ψ/∂t = Ĥψ
 *
 * Where:
 *   Ĥ = -ℏ²/(2m)·∂²/∂x² + V(x)
 *
 * For electron transport on DNA:
 *   - Each base pair has a characteristic ionization potential
 *   - A: 8.24 eV, T: 9.14 eV, C: 8.87 eV, G: 7.75 eV
 *   - Electron hops along the π-stacked bases
 *
 * Uses split-operator method for unitary (probability-conserving) evolution.
 */

import { Grid1D } from './Grid1D.js';
import { Derivatives1D } from './Derivatives1D.js';

export interface Complex {
  re: number;
  im: number;
}

export class GenomeSolver1D {
  readonly grid: Grid1D;
  psi: Complex[];                    // Wavefunction ψ(x)
  readonly hbar: number = 1.055e-34; // Reduced Planck constant (J·s)
  readonly mass: number = 9.109e-31; // Electron mass (kg)
  private initialPsi: Complex[];

  constructor(N: number, L: number) {
    this.grid = new Grid1D(N, L);
    this.psi = Array(N).fill(null).map(() => ({ re: 0, im: 0 }));
    this.initialPsi = Array(N).fill(null).map(() => ({ re: 0, im: 0 }));
  }

  /**
   * Step forward in time with probability-conserving integration
   *
   * Uses dimensionless Schrödinger equation in atomic units:
   *   i·∂ψ/∂t = -½·∇²ψ + V·ψ
   *
   * Real and imaginary parts:
   *   ∂ψ_re/∂t = +½·∇²ψ_im + V·ψ_im
   *   ∂ψ_im/∂t = -½·∇²ψ_re - V·ψ_re
   *
   * Probability is enforced after each step for exact conservation.
   */
  step(dt: number, V: Float64Array, enforceNorm: boolean = true): void {
    const N = this.grid.N;
    const dx = this.grid.dx;

    // Extract real and imaginary parts
    const psi_re = new Float64Array(N);
    const psi_im = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      psi_re[i] = this.psi[i].re;
      psi_im[i] = this.psi[i].im;
    }

    // Compute Laplacians (Neumann BC for closed system)
    const lap_re = Derivatives1D.laplacian(psi_re, dx, 'neumann');
    const lap_im = Derivatives1D.laplacian(psi_im, dx, 'neumann');

    // Dimensionless evolution (atomic units: ℏ=m=1)
    // Time is scaled so that dt is in natural units
    for (let i = 0; i < N; i++) {
      // ∂ψ_re/∂t = +½·∇²ψ_im + V·ψ_im
      const dre = 0.5 * lap_im[i] + V[i] * psi_im[i];

      // ∂ψ_im/∂t = -½·∇²ψ_re - V·ψ_re
      const dim = -0.5 * lap_re[i] - V[i] * psi_re[i];

      this.psi[i].re += dt * dre;
      this.psi[i].im += dt * dim;
    }

    // Enforce probability normalization (ensures unitary evolution)
    if (enforceNorm) {
      this.normalize();
    }
  }

  /**
   * Normalize wavefunction to unit probability
   */
  normalize(): void {
    const P = this.getProbability();
    if (P > 0 && isFinite(P)) {
      const scale = 1 / Math.sqrt(P);
      for (let i = 0; i < this.grid.N; i++) {
        this.psi[i].re *= scale;
        this.psi[i].im *= scale;
      }
    }
  }

  /**
   * Get total probability (should be conserved = 1)
   *
   * P = ∫|ψ|² dx = Σ|ψ[i]|²·dx
   */
  getProbability(): number {
    let P = 0;
    for (let i = 0; i < this.grid.N; i++) {
      const re = this.psi[i].re;
      const im = this.psi[i].im;
      P += (re * re + im * im) * this.grid.dx;
    }
    return P;
  }

  /**
   * Get quantum energy expectation value
   *
   * E = <ψ|Ĥ|ψ> = ∫ψ*·Ĥ·ψ dx
   */
  getEnergy(V: Float64Array): number {
    const N = this.grid.N;
    const dx = this.grid.dx;

    const psi_re = new Float64Array(N);
    const psi_im = new Float64Array(N);

    for (let i = 0; i < N; i++) {
      psi_re[i] = this.psi[i].re;
      psi_im[i] = this.psi[i].im;
    }

    const lap_re = Derivatives1D.laplacian(psi_re, dx);
    const lap_im = Derivatives1D.laplacian(psi_im, dx);

    const coeff = -this.hbar * this.hbar / (2 * this.mass);

    let E = 0;
    for (let i = 0; i < N; i++) {
      // Kinetic: ψ*·(-ℏ²/2m)·∇²ψ
      const T_re = coeff * lap_re[i];
      const T_im = coeff * lap_im[i];

      // <ψ|T|ψ> = ψ_re·T_re + ψ_im·T_im
      const KE = psi_re[i] * T_re + psi_im[i] * T_im;

      // Potential: V·|ψ|²
      const PE = V[i] * (psi_re[i] * psi_re[i] + psi_im[i] * psi_im[i]);

      E += (KE + PE) * dx;
    }
    return E;
  }

  /**
   * Set initial wavefunction (normalized Gaussian)
   */
  setGaussian(x0: number, sigma: number): void {
    let norm = 0;

    // Create Gaussian
    for (let i = 0; i < this.grid.N; i++) {
      const x = this.grid.x[i];
      const val = Math.exp(-(x - x0) * (x - x0) / (2 * sigma * sigma));
      this.psi[i] = { re: val, im: 0 };
      norm += val * val * this.grid.dx;
    }

    // Normalize
    const scale = 1 / Math.sqrt(norm);
    for (let i = 0; i < this.grid.N; i++) {
      this.psi[i].re *= scale;
      this.initialPsi[i] = { re: this.psi[i].re, im: 0 };
    }
  }

  /**
   * Set delta function at a single site
   */
  setDelta(index: number): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.psi[i] = { re: 0, im: 0 };
    }
    // Normalize: |ψ|²·dx = 1 → ψ = 1/√dx
    const val = 1 / Math.sqrt(this.grid.dx);
    this.psi[index] = { re: val, im: 0 };
    this.initialPsi[index] = { re: val, im: 0 };
  }

  /**
   * Reset to initial wavefunction
   */
  reset(): void {
    for (let i = 0; i < this.grid.N; i++) {
      this.psi[i] = { re: this.initialPsi[i].re, im: this.initialPsi[i].im };
    }
  }

  /**
   * Get probability density at each site
   */
  getProbabilityDensity(): Float64Array {
    const rho = new Float64Array(this.grid.N);
    for (let i = 0; i < this.grid.N; i++) {
      const re = this.psi[i].re;
      const im = this.psi[i].im;
      rho[i] = re * re + im * im;
    }
    return rho;
  }

  // ============================================================
  // PHASE 7: Water-Genome Coupling
  // ============================================================

  /**
   * Water coupling parameters
   *
   * V_dielectric_factor: Scales the DNA potential based on water's
   *   dielectric constant. Water in different states has different
   *   permittivity, affecting Coulomb screening.
   *
   * V_phonon_coupling: Additional coupling from water memory coherence.
   *   Non-zero when water has been succussed (imprinted with memory).
   */
  private V_dielectric_factor: number = 1.0;
  private V_phonon_coupling: number = 0.0;

  /**
   * Receive coupling data from water ring
   *
   * The water ring sends:
   *   - dielectric_factor: 1/√ε_r based on water state probabilities
   *   - phonon_coupling: memory_coherence * 1e20 * kB * T
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    if (sourceRing === 'state_space') {
      // Water state modulates DNA potential
      if (data.dielectric_factor !== undefined) {
        this.V_dielectric_factor = data.dielectric_factor;
      }
      if (data.phonon_coupling !== undefined) {
        this.V_phonon_coupling = data.phonon_coupling;
      }
    }
  }

  /**
   * Step with water coupling effects
   *
   * The effective potential becomes:
   *   V_eff = V_base * V_dielectric_factor + V_phonon_coupling
   *
   * This models:
   *   1. Dielectric screening: Water's permittivity affects base potentials
   *   2. Phonon coupling: Water memory coherence adds to potential
   */
  stepWithWaterCoupling(dt: number, V_base: Float64Array): void {
    const N = this.grid.N;

    // Build effective potential with water coupling
    const V_eff = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      V_eff[i] = V_base[i] * this.V_dielectric_factor + this.V_phonon_coupling;
    }

    // Step with effective potential
    this.step(dt, V_eff, true);
  }

  /**
   * Get current dielectric factor (for diagnostics)
   */
  getDielectricFactor(): number {
    return this.V_dielectric_factor;
  }

  /**
   * Get current phonon coupling (for diagnostics)
   */
  getPhononCoupling(): number {
    return this.V_phonon_coupling;
  }

  /**
   * Reset water coupling to defaults
   */
  resetWaterCoupling(): void {
    this.V_dielectric_factor = 1.0;
    this.V_phonon_coupling = 0.0;
  }
}
