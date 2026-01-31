/**
 * PHOG V10 - Phase 8: 2D Grid
 *
 * Discretization for 2D spatial domains:
 *   x: [0, Lx] with Nx points
 *   y: [0, Ly] with Ny points
 *
 * Used by:
 *   - HeatSolver2D: 2D diffusion
 *   - NavierStokes2D: 2D fluid dynamics
 */

export class Grid2D {
  readonly Nx: number;
  readonly Ny: number;
  readonly Lx: number;
  readonly Ly: number;
  readonly dx: number;
  readonly dy: number;
  readonly x: Float64Array;
  readonly y: Float64Array;

  constructor(Nx: number, Ny: number, Lx: number, Ly: number) {
    this.Nx = Nx;
    this.Ny = Ny;
    this.Lx = Lx;
    this.Ly = Ly;
    this.dx = Lx / (Nx - 1);
    this.dy = Ly / (Ny - 1);

    this.x = new Float64Array(Nx);
    this.y = new Float64Array(Ny);

    for (let i = 0; i < Nx; i++) {
      this.x[i] = i * this.dx;
    }
    for (let j = 0; j < Ny; j++) {
      this.y[j] = j * this.dy;
    }
  }

  /**
   * Get total number of grid points
   */
  get size(): number {
    return this.Nx * this.Ny;
  }

  /**
   * Convert 2D index to 1D flat index
   */
  flatIndex(i: number, j: number): number {
    return i * this.Ny + j;
  }

  /**
   * Convert 1D flat index to 2D indices
   */
  gridIndex(flat: number): [number, number] {
    const i = Math.floor(flat / this.Ny);
    const j = flat % this.Ny;
    return [i, j];
  }
}
