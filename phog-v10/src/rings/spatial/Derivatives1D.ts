/**
 * PHOG V10 - Phase 5: 1D Spatial Derivatives
 *
 * Finite difference operators for 1D fields.
 * Uses central differences for interior, one-sided at boundaries.
 *
 * Key operators:
 * - derivative: ∂f/∂x (first derivative)
 * - laplacian: ∂²f/∂x² (second derivative, for diffusion/waves)
 */

export class Derivatives1D {

  /**
   * First derivative using central differences
   *
   * Interior: df/dx ≈ (f[i+1] - f[i-1]) / (2·dx)
   * Boundaries: one-sided differences
   */
  static derivative(f: Float64Array, dx: number): Float64Array {
    const N = f.length;
    const df = new Float64Array(N);

    // Central differences for interior points
    for (let i = 1; i < N - 1; i++) {
      df[i] = (f[i + 1] - f[i - 1]) / (2 * dx);
    }

    // One-sided differences at boundaries
    df[0] = (f[1] - f[0]) / dx;
    df[N - 1] = (f[N - 1] - f[N - 2]) / dx;

    return df;
  }

  /**
   * Laplacian (second derivative) using central differences
   *
   * Interior: d²f/dx² ≈ (f[i+1] - 2·f[i] + f[i-1]) / dx²
   *
   * Boundary conditions:
   * - 'dirichlet': Zero (fixed endpoints) - energy can escape
   * - 'neumann': Zero flux (∂f/∂x = 0) - energy conserved
   */
  static laplacian(f: Float64Array, dx: number, bc: 'dirichlet' | 'neumann' = 'dirichlet'): Float64Array {
    const N = f.length;
    const d2f = new Float64Array(N);

    // Central differences for interior points
    for (let i = 1; i < N - 1; i++) {
      d2f[i] = (f[i + 1] - 2 * f[i] + f[i - 1]) / (dx * dx);
    }

    if (bc === 'neumann') {
      // Neumann BC: ∂f/∂x = 0 at boundaries
      // Ghost point: f[-1] = f[1], f[N] = f[N-2]
      d2f[0] = (f[1] - 2 * f[0] + f[1]) / (dx * dx);           // = 2(f[1] - f[0])/dx²
      d2f[N - 1] = (f[N - 2] - 2 * f[N - 1] + f[N - 2]) / (dx * dx); // = 2(f[N-2] - f[N-1])/dx²
    } else {
      // Dirichlet: f fixed at boundaries
      d2f[0] = 0;
      d2f[N - 1] = 0;
    }

    return d2f;
  }
}
