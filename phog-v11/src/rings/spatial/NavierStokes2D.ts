export class NavierStokes2D {
  readonly Nx: number;
  readonly Ny: number;
  readonly dx: number;
  readonly dy: number;

  u: Float64Array;
  v: Float64Array;
  private nu: number;

  constructor(Nx: number, Ny: number, Lx: number, Ly: number, nu: number) {
    this.Nx = Nx;
    this.Ny = Ny;
    this.dx = Lx / (Nx - 1);
    this.dy = Ly / (Ny - 1);
    this.nu = nu;

    this.u = new Float64Array(Nx * Ny);
    this.v = new Float64Array(Nx * Ny);
  }

  initGaussianVortex(cx: number, cy: number, sigma: number, amp: number): void {
    for (let j = 0; j < this.Ny; j++) {
      for (let i = 0; i < this.Nx; i++) {
        const x = i * this.dx;
        const y = j * this.dy;
        const r2 = (x - cx) ** 2 + (y - cy) ** 2;
        const vortex = amp * Math.exp(-r2 / (2 * sigma ** 2));

        const idx = j * this.Nx + i;
        this.u[idx] = -(y - cy) * vortex;
        this.v[idx] = (x - cx) * vortex;
      }
    }
  }

  setMemoryModulatedViscosity(M: number): void {
    const modulation = 1 - 0.226 * (M / 2.6e-23);
    this.nu *= modulation;
  }

  getVorticity(): number {
    let max_vort = 0;
    for (let j = 1; j < this.Ny - 1; j++) {
      for (let i = 1; i < this.Nx - 1; i++) {
        const idx = j * this.Nx + i;
        const dv_dx = (this.v[idx + 1] - this.v[idx - 1]) / (2 * this.dx);
        const du_dy = (this.u[idx + this.Nx] - this.u[idx - this.Nx]) / (2 * this.dy);
        const vort = Math.abs(dv_dx - du_dy);
        max_vort = Math.max(max_vort, vort);
      }
    }
    return max_vort;
  }
}
