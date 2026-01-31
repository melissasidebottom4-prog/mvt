/**
 * PHOG V10 - Phase 10: 3D Spatial Derivatives
 *
 * Finite difference operators for 3D fields:
 *   - First derivatives: ∂/∂x, ∂/∂y, ∂/∂z
 *   - Laplacian: ∇² = ∂²/∂x² + ∂²/∂y² + ∂²/∂z²
 *   - Gradient: ∇f
 *   - Divergence: ∇·v
 *
 * Uses second-order central differences for interior points.
 */

import { Grid3D } from './Grid3D.js';

export class Derivatives3D {
  /**
   * First derivative in x: ∂f/∂x
   * Central difference: (f[i+1] - f[i-1]) / (2·dx)
   */
  static dx(f: Float64Array, grid: Grid3D): Float64Array {
    const result = new Float64Array(grid.size);
    const inv_2dx = 0.5 / grid.dx;

    for (let i = 1; i < grid.Nx - 1; i++) {
      for (let j = 0; j < grid.Ny; j++) {
        for (let k = 0; k < grid.Nz; k++) {
          const idx = grid.idx(i, j, k);
          const ip = grid.idx(i + 1, j, k);
          const im = grid.idx(i - 1, j, k);
          result[idx] = (f[ip] - f[im]) * inv_2dx;
        }
      }
    }

    return result;
  }

  /**
   * First derivative in y: ∂f/∂y
   */
  static dy(f: Float64Array, grid: Grid3D): Float64Array {
    const result = new Float64Array(grid.size);
    const inv_2dy = 0.5 / grid.dy;

    for (let i = 0; i < grid.Nx; i++) {
      for (let j = 1; j < grid.Ny - 1; j++) {
        for (let k = 0; k < grid.Nz; k++) {
          const idx = grid.idx(i, j, k);
          const jp = grid.idx(i, j + 1, k);
          const jm = grid.idx(i, j - 1, k);
          result[idx] = (f[jp] - f[jm]) * inv_2dy;
        }
      }
    }

    return result;
  }

  /**
   * First derivative in z: ∂f/∂z
   */
  static dz(f: Float64Array, grid: Grid3D): Float64Array {
    const result = new Float64Array(grid.size);
    const inv_2dz = 0.5 / grid.dz;

    for (let i = 0; i < grid.Nx; i++) {
      for (let j = 0; j < grid.Ny; j++) {
        for (let k = 1; k < grid.Nz - 1; k++) {
          const idx = grid.idx(i, j, k);
          const kp = grid.idx(i, j, k + 1);
          const km = grid.idx(i, j, k - 1);
          result[idx] = (f[kp] - f[km]) * inv_2dz;
        }
      }
    }

    return result;
  }

  /**
   * Laplacian: ∇²f = ∂²f/∂x² + ∂²f/∂y² + ∂²f/∂z²
   * Central difference: (f[i+1] - 2f[i] + f[i-1]) / dx²
   */
  static laplacian(f: Float64Array, grid: Grid3D): Float64Array {
    const result = new Float64Array(grid.size);
    const inv_dx2 = 1 / (grid.dx * grid.dx);
    const inv_dy2 = 1 / (grid.dy * grid.dy);
    const inv_dz2 = 1 / (grid.dz * grid.dz);

    for (let i = 1; i < grid.Nx - 1; i++) {
      for (let j = 1; j < grid.Ny - 1; j++) {
        for (let k = 1; k < grid.Nz - 1; k++) {
          const idx = grid.idx(i, j, k);
          const ip = grid.idx(i + 1, j, k);
          const im = grid.idx(i - 1, j, k);
          const jp = grid.idx(i, j + 1, k);
          const jm = grid.idx(i, j - 1, k);
          const kp = grid.idx(i, j, k + 1);
          const km = grid.idx(i, j, k - 1);

          result[idx] =
            (f[ip] - 2 * f[idx] + f[im]) * inv_dx2 +
            (f[jp] - 2 * f[idx] + f[jm]) * inv_dy2 +
            (f[kp] - 2 * f[idx] + f[km]) * inv_dz2;
        }
      }
    }

    return result;
  }

  /**
   * Divergence of vector field: ∇·v = ∂u/∂x + ∂v/∂y + ∂w/∂z
   */
  static divergence(
    u: Float64Array,
    v: Float64Array,
    w: Float64Array,
    grid: Grid3D
  ): Float64Array {
    const result = new Float64Array(grid.size);
    const inv_2dx = 0.5 / grid.dx;
    const inv_2dy = 0.5 / grid.dy;
    const inv_2dz = 0.5 / grid.dz;

    for (let i = 1; i < grid.Nx - 1; i++) {
      for (let j = 1; j < grid.Ny - 1; j++) {
        for (let k = 1; k < grid.Nz - 1; k++) {
          const idx = grid.idx(i, j, k);
          const ip = grid.idx(i + 1, j, k);
          const im = grid.idx(i - 1, j, k);
          const jp = grid.idx(i, j + 1, k);
          const jm = grid.idx(i, j - 1, k);
          const kp = grid.idx(i, j, k + 1);
          const km = grid.idx(i, j, k - 1);

          result[idx] =
            (u[ip] - u[im]) * inv_2dx +
            (v[jp] - v[jm]) * inv_2dy +
            (w[kp] - w[km]) * inv_2dz;
        }
      }
    }

    return result;
  }

  /**
   * Curl of vector field: ∇×v
   * Returns [ωx, ωy, ωz] where:
   *   ωx = ∂w/∂y - ∂v/∂z
   *   ωy = ∂u/∂z - ∂w/∂x
   *   ωz = ∂v/∂x - ∂u/∂y
   */
  static curl(
    u: Float64Array,
    v: Float64Array,
    w: Float64Array,
    grid: Grid3D
  ): [Float64Array, Float64Array, Float64Array] {
    const omega_x = new Float64Array(grid.size);
    const omega_y = new Float64Array(grid.size);
    const omega_z = new Float64Array(grid.size);

    const inv_2dx = 0.5 / grid.dx;
    const inv_2dy = 0.5 / grid.dy;
    const inv_2dz = 0.5 / grid.dz;

    for (let i = 1; i < grid.Nx - 1; i++) {
      for (let j = 1; j < grid.Ny - 1; j++) {
        for (let k = 1; k < grid.Nz - 1; k++) {
          const idx = grid.idx(i, j, k);
          const ip = grid.idx(i + 1, j, k);
          const im = grid.idx(i - 1, j, k);
          const jp = grid.idx(i, j + 1, k);
          const jm = grid.idx(i, j - 1, k);
          const kp = grid.idx(i, j, k + 1);
          const km = grid.idx(i, j, k - 1);

          // ωx = ∂w/∂y - ∂v/∂z
          omega_x[idx] = (w[jp] - w[jm]) * inv_2dy - (v[kp] - v[km]) * inv_2dz;

          // ωy = ∂u/∂z - ∂w/∂x
          omega_y[idx] = (u[kp] - u[km]) * inv_2dz - (w[ip] - w[im]) * inv_2dx;

          // ωz = ∂v/∂x - ∂u/∂y
          omega_z[idx] = (v[ip] - v[im]) * inv_2dx - (u[jp] - u[jm]) * inv_2dy;
        }
      }
    }

    return [omega_x, omega_y, omega_z];
  }
}
