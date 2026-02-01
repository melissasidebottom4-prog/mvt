import { Grid1D } from './Grid1D.js';
import { Derivatives1D } from './Derivatives1D.js';

interface Complex { re: number; im: number; }

export class GenomeSolver1D {
  private grid: Grid1D;
  psi: Complex[];
  private V: Float64Array;
  private hbar = 1.055e-34;
  private m_electron = 9.109e-31;
  private memory_modulation = 1.0;

  constructor(N: number, L: number) {
    this.grid = new Grid1D(N, L);
    this.psi = Array(N).fill(null).map(() => ({ re: 0, im: 0 }));
    this.V = new Float64Array(N);
  }

  initGaussian(x0: number, sigma: number, k0: number): void {
    for (let i = 0; i < this.grid.N; i++) {
      const x = this.grid.x[i];
      const amp = Math.exp(-Math.pow(x - x0, 2) / (2 * sigma * sigma));
      this.psi[i].re = amp * Math.cos(k0 * x);
      this.psi[i].im = amp * Math.sin(k0 * x);
    }
    this.normalize();
  }

  setPotential(V: Float64Array): void {
    this.V = V;
  }

  setMemoryModulation(M: number): void {
    this.memory_modulation = 1 + M / 1e-20;
  }

  stepWithWaterCoupling(dt: number, V_base: Float64Array): void {
    const psi_re = new Float64Array(this.grid.N);
    const psi_im = new Float64Array(this.grid.N);

    for (let i = 0; i < this.grid.N; i++) {
      psi_re[i] = this.psi[i].re;
      psi_im[i] = this.psi[i].im;
    }

    const d2_psi_re = Derivatives1D.secondDerivative(psi_re, this.grid.dx);
    const d2_psi_im = Derivatives1D.secondDerivative(psi_im, this.grid.dx);

    const factor = this.hbar / (2 * this.m_electron);

    for (let i = 0; i < this.grid.N; i++) {
      const V_eff = V_base[i] * this.memory_modulation;

      const d_re = factor * d2_psi_im[i] - (V_eff / this.hbar) * psi_im[i];
      const d_im = -factor * d2_psi_re[i] + (V_eff / this.hbar) * psi_re[i];

      this.psi[i].re += d_re * dt;
      this.psi[i].im += d_im * dt;
    }
  }

  normalize(): void {
    let sum = 0;
    for (let i = 0; i < this.grid.N; i++) {
      sum += this.psi[i].re ** 2 + this.psi[i].im ** 2;
    }
    const norm = Math.sqrt(sum * this.grid.dx);
    for (let i = 0; i < this.grid.N; i++) {
      this.psi[i].re /= norm;
      this.psi[i].im /= norm;
    }
  }

  getRightHalfProbability(): number {
    const mid = Math.floor(this.grid.N / 2);
    let prob = 0;
    for (let i = mid; i < this.grid.N; i++) {
      prob += this.psi[i].re ** 2 + this.psi[i].im ** 2;
    }
    return prob * this.grid.dx;
  }
}
