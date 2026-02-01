export class Derivatives1D {
  static centralDifference(u: Float64Array, dx: number): Float64Array {
    const N = u.length;
    const du = new Float64Array(N);

    for (let i = 1; i < N - 1; i++) {
      du[i] = (u[i + 1] - u[i - 1]) / (2 * dx);
    }

    du[0] = (u[1] - u[0]) / dx;
    du[N - 1] = (u[N - 1] - u[N - 2]) / dx;

    return du;
  }

  static secondDerivative(u: Float64Array, dx: number): Float64Array {
    const N = u.length;
    const d2u = new Float64Array(N);

    for (let i = 1; i < N - 1; i++) {
      d2u[i] = (u[i + 1] - 2 * u[i] + u[i - 1]) / (dx * dx);
    }

    return d2u;
  }
}
