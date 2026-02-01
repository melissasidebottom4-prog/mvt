export class MetricTensor4D {
  private g: Float64Array;
  private g_inv: Float64Array;

  constructor() {
    this.g = new Float64Array(16);
    this.g_inv = new Float64Array(16);

    this.g[0] = -1;
    this.g[5] = 1;
    this.g[10] = 1;
    this.g[15] = 1;

    this.g_inv[0] = -1;
    this.g_inv[5] = 1;
    this.g_inv[10] = 1;
    this.g_inv[15] = 1;
  }

  get(mu: number, nu: number): number {
    return this.g[mu * 4 + nu];
  }

  set(mu: number, nu: number, value: number): void {
    this.g[mu * 4 + nu] = value;
    this.g[nu * 4 + mu] = value;
  }

  getInverse(mu: number, nu: number): number {
    return this.g_inv[mu * 4 + nu];
  }

  setSchwarzschildAtRadius(r: number, M_over_c2: number): void {
    const f = 1 - 2 * M_over_c2 / r;
    if (f <= 0) throw new Error(`Inside Schwarzschild radius`);

    this.g[0] = -f;
    this.g[5] = 1 / f;
    this.g[10] = r * r;
    this.g[15] = r * r;

    this.g_inv[0] = -1 / f;
    this.g_inv[5] = f;
    this.g_inv[10] = 1 / (r * r);
    this.g_inv[15] = 1 / (r * r);
  }
}
