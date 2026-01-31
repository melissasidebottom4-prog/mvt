/**
 * PHOG V10 - Phase 5: 1D Spatial Grid
 *
 * Discretizes a 1D domain [0, L] into N grid points.
 * Foundation for finite difference methods.
 */

export class Grid1D {
  readonly N: number;      // Number of grid points
  readonly L: number;      // Domain length (m)
  readonly dx: number;     // Grid spacing (m)
  readonly x: Float64Array; // Grid point positions

  constructor(N: number, L: number) {
    this.N = N;
    this.L = L;
    this.dx = L / (N - 1);

    this.x = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      this.x[i] = i * this.dx;
    }
  }
}
