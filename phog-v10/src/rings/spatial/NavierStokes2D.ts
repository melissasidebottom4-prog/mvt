/**
 * PHOG V10 - Phase 8: 2D Navier-Stokes Solver
 *
 * Solves the incompressible Navier-Stokes equations:
 *   ∂v/∂t + (v·∇)v = -∇p/ρ + ν·∇²v + F
 *   ∇·v = 0 (incompressibility)
 *
 * Where:
 *   v = (vx, vy) velocity field
 *   p = pressure field
 *   ν = kinematic viscosity (m²/s)
 *   ρ = density (kg/m³)
 *   F = external forcing
 *
 * Features:
 *   - Water memory coupling (viscosity modulation)
 *   - External stirring force
 *   - CFL stability check
 *   - Energy and enstrophy diagnostics
 */

import { Grid2D } from './Grid2D.js';
import { Derivatives2D } from './Derivatives2D.js';

export class NavierStokes2D {
  readonly grid: Grid2D;
  vx: Float64Array[];
  vy: Float64Array[];

  readonly nu_base: number;
  nu_effective: number;
  readonly rho: number;

  private Fx: Float64Array[];
  private Fy: Float64Array[];

  constructor(Nx: number, Ny: number, Lx: number, Ly: number, nu: number, rho: number) {
    this.grid = new Grid2D(Nx, Ny, Lx, Ly);
    this.nu_base = nu;
    this.nu_effective = nu;
    this.rho = rho;

    // Initialize velocity fields
    this.vx = Array(Nx).fill(null).map(() => new Float64Array(Ny));
    this.vy = Array(Nx).fill(null).map(() => new Float64Array(Ny));

    // Initialize forcing fields
    this.Fx = Array(Nx).fill(null).map(() => new Float64Array(Ny));
    this.Fy = Array(Nx).fill(null).map(() => new Float64Array(Ny));
  }

  /**
   * Receive coupling data from water ring
   *
   * Water memory affects viscosity:
   *   ν_eff = ν_base * (1 - memory * scaling)
   *
   * Memory coherence reduces effective viscosity (water becomes
   * more "structured" and flows more easily).
   */
  receiveCouplingData(sourceRing: string, data: any): void {
    if (sourceRing === 'state_space') {
      // Extract memory coherence from coupling data
      let memory = 0;

      if (data.field_values && data.field_values.memory_coherence !== undefined) {
        memory = data.field_values.memory_coherence;
      } else if (data.memory_coherence !== undefined) {
        memory = data.memory_coherence;
      }

      // Memory affects viscosity: higher memory = lower viscosity
      // Scale factor chosen so C30 (~2.7e-23) gives ~10-30% change
      this.nu_effective = this.nu_base * (1 - memory * 1e22);

      // Clamp to reasonable range (0.5x to 2x base)
      this.nu_effective = Math.max(this.nu_base * 0.5, this.nu_effective);
      this.nu_effective = Math.min(this.nu_base * 2.0, this.nu_effective);
    }
  }

  /**
   * Apply circular stirring force
   *
   * Creates a vortex by applying tangential force in a circle:
   *   F = ω × r (perpendicular to radius)
   */
  applyStirring(x_center: number, y_center: number, omega: number, radius: number): void {
    // Clear previous forcing
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.Fx[i][j] = 0;
        this.Fy[i][j] = 0;
      }
    }

    // Apply circular forcing
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const dx = this.grid.x[i] - x_center;
        const dy = this.grid.y[j] - y_center;
        const r = Math.sqrt(dx * dx + dy * dy);

        if (r < radius && r > 0.01) {
          // Tangential forcing: F perpendicular to r
          this.Fx[i][j] = -omega * dy / r;
          this.Fy[i][j] = omega * dx / r;
        }
      }
    }
  }

  /**
   * Clear external forcing
   */
  clearForcing(): void {
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.Fx[i][j] = 0;
        this.Fy[i][j] = 0;
      }
    }
  }

  /**
   * Step forward in time
   *
   * Uses semi-implicit scheme:
   *   1. Compute advection: (v·∇)v
   *   2. Compute diffusion: ν·∇²v
   *   3. Add forcing: F
   *   4. Project to divergence-free
   */
  step(dt: number): void {
    // Compute advection terms
    const advx = this.computeAdvection(this.vx);
    const advy = this.computeAdvection(this.vy);

    // Compute diffusion terms
    const lapx = Derivatives2D.laplacian(this.vx, this.grid.dx, this.grid.dy);
    const lapy = Derivatives2D.laplacian(this.vy, this.grid.dx, this.grid.dy);

    // Update velocities (interior points only)
    for (let i = 1; i < this.grid.Nx - 1; i++) {
      for (let j = 1; j < this.grid.Ny - 1; j++) {
        this.vx[i][j] += dt * (
          -advx[i][j] +
          this.nu_effective * lapx[i][j] +
          this.Fx[i][j] / this.rho
        );

        this.vy[i][j] += dt * (
          -advy[i][j] +
          this.nu_effective * lapy[i][j] +
          this.Fy[i][j] / this.rho
        );
      }
    }

    // Project to divergence-free (enforce incompressibility)
    this.projectVelocity();
  }

  /**
   * Compute advection term: (v·∇)f
   */
  private computeAdvection(f: Float64Array[]): Float64Array[] {
    const dfdx = Derivatives2D.dx(f, this.grid.dx);
    const dfdy = Derivatives2D.dy(f, this.grid.dy);

    const adv = Array(this.grid.Nx).fill(null).map(() => new Float64Array(this.grid.Ny));

    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        adv[i][j] = this.vx[i][j] * dfdx[i][j] + this.vy[i][j] * dfdy[i][j];
      }
    }

    return adv;
  }

  /**
   * Project velocity to divergence-free field
   *
   * Uses iterative pressure correction:
   *   ∇²p = ∇·v
   *   v' = v - ∇p
   */
  private projectVelocity(): void {
    const iterations = 20;

    for (let iter = 0; iter < iterations; iter++) {
      const div = this.computeDivergence();

      for (let i = 1; i < this.grid.Nx - 1; i++) {
        for (let j = 1; j < this.grid.Ny - 1; j++) {
          const correction = 0.25 * div[i][j];
          this.vx[i][j] -= correction * this.grid.dx;
          this.vy[i][j] -= correction * this.grid.dy;
        }
      }
    }
  }

  /**
   * Compute velocity divergence: ∇·v = ∂vx/∂x + ∂vy/∂y
   */
  private computeDivergence(): Float64Array[] {
    const div = Array(this.grid.Nx).fill(null).map(() => new Float64Array(this.grid.Ny));

    for (let i = 1; i < this.grid.Nx - 1; i++) {
      for (let j = 1; j < this.grid.Ny - 1; j++) {
        const dvx_dx = (this.vx[i + 1][j] - this.vx[i - 1][j]) / (2 * this.grid.dx);
        const dvy_dy = (this.vy[i][j + 1] - this.vy[i][j - 1]) / (2 * this.grid.dy);
        div[i][j] = dvx_dx + dvy_dy;
      }
    }

    return div;
  }

  /**
   * Check CFL stability condition
   *
   * CFL = max(|v|) * dt / min(dx, dy) < 1
   */
  checkCFL(dt: number): { ok: boolean; CFL: number } {
    let v_max = 0;

    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const v = Math.sqrt(this.vx[i][j] ** 2 + this.vy[i][j] ** 2);
        v_max = Math.max(v_max, v);
      }
    }

    const h_min = Math.min(this.grid.dx, this.grid.dy);
    const CFL = v_max * dt / h_min;

    return { ok: CFL < 1.0, CFL };
  }

  /**
   * Get total kinetic energy
   *
   * E = (1/2) ∫∫ ρ·|v|² dA
   */
  getEnergy(): number {
    let E = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const v2 = this.vx[i][j] ** 2 + this.vy[i][j] ** 2;
        E += 0.5 * this.rho * v2 * this.grid.dx * this.grid.dy;
      }
    }
    return E;
  }

  /**
   * Get enstrophy (integral of vorticity squared)
   *
   * Ω = ∫∫ ω² dA
   *
   * Where vorticity ω = ∂vy/∂x - ∂vx/∂y
   *
   * Enstrophy is a second conserved quantity in 2D inviscid flow.
   */
  getEnstrophy(): number {
    const dvydx = Derivatives2D.dx(this.vy, this.grid.dx);
    const dvxdy = Derivatives2D.dy(this.vx, this.grid.dy);

    let omega2 = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const omega = dvydx[i][j] - dvxdy[i][j];
        omega2 += omega * omega * this.grid.dx * this.grid.dy;
      }
    }
    return omega2;
  }

  /**
   * Get maximum vorticity magnitude
   */
  getMaxVorticity(): number {
    const dvydx = Derivatives2D.dx(this.vy, this.grid.dx);
    const dvxdy = Derivatives2D.dy(this.vx, this.grid.dy);

    let max_omega = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const omega = Math.abs(dvydx[i][j] - dvxdy[i][j]);
        max_omega = Math.max(max_omega, omega);
      }
    }
    return max_omega;
  }

  /**
   * Get maximum velocity magnitude
   */
  getMaxVelocity(): number {
    let v_max = 0;
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        const v = Math.sqrt(this.vx[i][j] ** 2 + this.vy[i][j] ** 2);
        v_max = Math.max(v_max, v);
      }
    }
    return v_max;
  }

  /**
   * Initialize Taylor-Green vortex
   *
   * Classic test case for 2D fluid solvers:
   *   vx = A·cos(kx·x)·sin(ky·y)
   *   vy = -A·sin(kx·x)·cos(ky·y)
   */
  setTaylorGreen(amplitude: number = 1.0): void {
    const kx = 2 * Math.PI / this.grid.Lx;
    const ky = 2 * Math.PI / this.grid.Ly;

    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.vx[i][j] = amplitude * Math.cos(kx * this.grid.x[i]) * Math.sin(ky * this.grid.y[j]);
        this.vy[i][j] = -amplitude * Math.sin(kx * this.grid.x[i]) * Math.cos(ky * this.grid.y[j]);
      }
    }
  }

  /**
   * Reset to zero velocity
   */
  reset(): void {
    for (let i = 0; i < this.grid.Nx; i++) {
      for (let j = 0; j < this.grid.Ny; j++) {
        this.vx[i][j] = 0;
        this.vy[i][j] = 0;
      }
    }
    this.nu_effective = this.nu_base;
  }
}
