export class Grid1D {
  readonly N: number;
  readonly L: number;
  readonly dx: number;
  readonly x: Float64Array;

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
