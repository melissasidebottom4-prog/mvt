/**
 * PHOG V10 - Phase 10: 3D Grid
 *
 * Discretization for 3D spatial domains:
 *   x: [0, Lx] with Nx points
 *   y: [0, Ly] with Ny points
 *   z: [0, Lz] with Nz points
 *
 * Memory layout: row-major (i varies slowest, k varies fastest)
 *   flat_index = i * Ny * Nz + j * Nz + k
 *
 * Parameters from Solver 10A:
 *   N = 32 recommended (32,768 points, ~1 MB per field)
 *   dx = 3.226e-5 m for L = 1e-3 m
 */

export class Grid3D {
  readonly Nx: number;
  readonly Ny: number;
  readonly Nz: number;
  readonly Lx: number;
  readonly Ly: number;
  readonly Lz: number;
  readonly dx: number;
  readonly dy: number;
  readonly dz: number;
  readonly x: Float64Array;
  readonly y: Float64Array;
  readonly z: Float64Array;

  constructor(Nx: number, Ny: number, Nz: number, Lx: number, Ly: number, Lz: number) {
    this.Nx = Nx;
    this.Ny = Ny;
    this.Nz = Nz;
    this.Lx = Lx;
    this.Ly = Ly;
    this.Lz = Lz;
    this.dx = Lx / (Nx - 1);
    this.dy = Ly / (Ny - 1);
    this.dz = Lz / (Nz - 1);

    this.x = new Float64Array(Nx);
    this.y = new Float64Array(Ny);
    this.z = new Float64Array(Nz);

    for (let i = 0; i < Nx; i++) {
      this.x[i] = i * this.dx;
    }
    for (let j = 0; j < Ny; j++) {
      this.y[j] = j * this.dy;
    }
    for (let k = 0; k < Nz; k++) {
      this.z[k] = k * this.dz;
    }
  }

  /**
   * Get total number of grid points
   */
  get size(): number {
    return this.Nx * this.Ny * this.Nz;
  }

  /**
   * Convert 3D index to 1D flat index
   * Layout: i varies slowest, k varies fastest
   */
  idx(i: number, j: number, k: number): number {
    return i * this.Ny * this.Nz + j * this.Nz + k;
  }

  /**
   * Convert 1D flat index to 3D indices
   */
  gridIndex(flat: number): [number, number, number] {
    const NyNz = this.Ny * this.Nz;
    const i = Math.floor(flat / NyNz);
    const remainder = flat % NyNz;
    const j = Math.floor(remainder / this.Nz);
    const k = remainder % this.Nz;
    return [i, j, k];
  }

  /**
   * Check if index is in interior (not on boundary)
   */
  isInterior(i: number, j: number, k: number): boolean {
    return i > 0 && i < this.Nx - 1 &&
           j > 0 && j < this.Ny - 1 &&
           k > 0 && k < this.Nz - 1;
  }

  /**
   * Get minimum grid spacing
   */
  get dmin(): number {
    return Math.min(this.dx, this.dy, this.dz);
  }
}
