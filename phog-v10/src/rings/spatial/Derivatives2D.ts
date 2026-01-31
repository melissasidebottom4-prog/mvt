/**
 * PHOG V10 - Phase 8: 2D Derivatives
 *
 * Finite difference operators for 2D fields:
 *   - dx: ∂f/∂x (central difference)
 *   - dy: ∂f/∂y (central difference)
 *   - laplacian: ∇²f = ∂²f/∂x² + ∂²f/∂y²
 *
 * All operators use second-order central differences.
 * Boundary values are left at zero (Dirichlet BC).
 */

export class Derivatives2D {

  /**
   * Partial derivative with respect to x
   *
   * ∂f/∂x ≈ (f[i+1,j] - f[i-1,j]) / (2·dx)
   */
  static dx(f: Float64Array[], dx: number): Float64Array[] {
    const Nx = f.length;
    const Ny = f[0].length;
    const df = Array(Nx).fill(null).map(() => new Float64Array(Ny));

    for (let i = 1; i < Nx - 1; i++) {
      for (let j = 0; j < Ny; j++) {
        df[i][j] = (f[i + 1][j] - f[i - 1][j]) / (2 * dx);
      }
    }

    return df;
  }

  /**
   * Partial derivative with respect to y
   *
   * ∂f/∂y ≈ (f[i,j+1] - f[i,j-1]) / (2·dy)
   */
  static dy(f: Float64Array[], dy: number): Float64Array[] {
    const Nx = f.length;
    const Ny = f[0].length;
    const df = Array(Nx).fill(null).map(() => new Float64Array(Ny));

    for (let i = 0; i < Nx; i++) {
      for (let j = 1; j < Ny - 1; j++) {
        df[i][j] = (f[i][j + 1] - f[i][j - 1]) / (2 * dy);
      }
    }

    return df;
  }

  /**
   * 2D Laplacian operator
   *
   * ∇²f = ∂²f/∂x² + ∂²f/∂y²
   *     ≈ (f[i+1,j] - 2f[i,j] + f[i-1,j]) / dx²
   *     + (f[i,j+1] - 2f[i,j] + f[i,j-1]) / dy²
   */
  static laplacian(f: Float64Array[], dx: number, dy: number): Float64Array[] {
    const Nx = f.length;
    const Ny = f[0].length;
    const lap = Array(Nx).fill(null).map(() => new Float64Array(Ny));

    for (let i = 1; i < Nx - 1; i++) {
      for (let j = 1; j < Ny - 1; j++) {
        const d2fdx2 = (f[i + 1][j] - 2 * f[i][j] + f[i - 1][j]) / (dx * dx);
        const d2fdy2 = (f[i][j + 1] - 2 * f[i][j] + f[i][j - 1]) / (dy * dy);
        lap[i][j] = d2fdx2 + d2fdy2;
      }
    }

    return lap;
  }

  /**
   * Gradient magnitude |∇f| = √((∂f/∂x)² + (∂f/∂y)²)
   */
  static gradientMagnitude(f: Float64Array[], dx: number, dy: number): Float64Array[] {
    const dfdx = this.dx(f, dx);
    const dfdy = this.dy(f, dy);

    const Nx = f.length;
    const Ny = f[0].length;
    const mag = Array(Nx).fill(null).map(() => new Float64Array(Ny));

    for (let i = 0; i < Nx; i++) {
      for (let j = 0; j < Ny; j++) {
        mag[i][j] = Math.sqrt(dfdx[i][j] ** 2 + dfdy[i][j] ** 2);
      }
    }

    return mag;
  }
}
