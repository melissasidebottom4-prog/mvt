/**
 * Debug pressure projection
 */

import { NavierStokes3D } from '../src/rings/spatial/NavierStokes3D.js';
import { Derivatives3D } from '../src/rings/spatial/Derivatives3D.js';

const solver = new NavierStokes3D(16, 16, 16, 1e-3, 1e-6, 1000);
const grid = solver.grid;

console.log('Pressure Projection Debug');
console.log('=========================');
console.log('Grid:', grid.Nx, '×', grid.Ny, '×', grid.Nz);
console.log('');

// Initialize Taylor-Green
solver.setTaylorGreen(0.1);

// Check initial divergence
const div0 = Derivatives3D.divergence(solver.u, solver.v, solver.w, grid);
let max_div0 = 0;
for (let i = 0; i < grid.size; i++) {
  max_div0 = Math.max(max_div0, Math.abs(div0[i]));
}
console.log('Initial divergence:', max_div0.toExponential(4));

// Manually do one step with debug output
const dt = 1e-5;
const nu = solver.nu_effective;
const rho = solver.rho;

console.log('dt:', dt);
console.log('nu:', nu);
console.log('rho:', rho);

// 1. Compute advection and diffusion
const u_star = new Float64Array(grid.size);
const v_star = new Float64Array(grid.size);
const w_star = new Float64Array(grid.size);

// Copy current velocities
u_star.set(solver.u);
v_star.set(solver.v);
w_star.set(solver.w);

// Compute laplacian
const lap_u = Derivatives3D.laplacian(solver.u, grid);
const lap_v = Derivatives3D.laplacian(solver.v, grid);
const lap_w = Derivatives3D.laplacian(solver.w, grid);

// Compute advection: (v·∇)v
const du_dx = Derivatives3D.dx(solver.u, grid);
const du_dy = Derivatives3D.dy(solver.u, grid);
const du_dz = Derivatives3D.dz(solver.u, grid);
const dv_dx = Derivatives3D.dx(solver.v, grid);
const dv_dy = Derivatives3D.dy(solver.v, grid);
const dv_dz = Derivatives3D.dz(solver.v, grid);
const dw_dx = Derivatives3D.dx(solver.w, grid);
const dw_dy = Derivatives3D.dy(solver.w, grid);
const dw_dz = Derivatives3D.dz(solver.w, grid);

const adv_u = new Float64Array(grid.size);
const adv_v = new Float64Array(grid.size);
const adv_w = new Float64Array(grid.size);

for (let i = 0; i < grid.size; i++) {
  adv_u[i] = solver.u[i] * du_dx[i] + solver.v[i] * du_dy[i] + solver.w[i] * du_dz[i];
  adv_v[i] = solver.u[i] * dv_dx[i] + solver.v[i] * dv_dy[i] + solver.w[i] * dv_dz[i];
  adv_w[i] = solver.u[i] * dw_dx[i] + solver.v[i] * dw_dy[i] + solver.w[i] * dw_dz[i];
}

// Full update: advection + diffusion
for (let i = 1; i < grid.Nx - 1; i++) {
  for (let j = 1; j < grid.Ny - 1; j++) {
    for (let k = 1; k < grid.Nz - 1; k++) {
      const idx = grid.idx(i, j, k);
      u_star[idx] = solver.u[idx] + dt * (-adv_u[idx] + nu * lap_u[idx]);
      v_star[idx] = solver.v[idx] + dt * (-adv_v[idx] + nu * lap_v[idx]);
      w_star[idx] = solver.w[idx] + dt * (-adv_w[idx] + nu * lap_w[idx]);
    }
  }
}

// Check divergence of intermediate velocity
const div_star = Derivatives3D.divergence(u_star, v_star, w_star, grid);
let max_div_star = 0;
for (let i = 0; i < grid.size; i++) {
  max_div_star = Math.max(max_div_star, Math.abs(div_star[i]));
}
console.log('Divergence after diffusion (u_star):', max_div_star.toExponential(4));

// 2. Set up pressure Poisson RHS
const rhs = new Float64Array(grid.size);
const factor = rho / dt;
for (let i = 0; i < grid.size; i++) {
  rhs[i] = factor * div_star[i];
}

let max_rhs = 0;
for (let i = 0; i < grid.size; i++) {
  max_rhs = Math.max(max_rhs, Math.abs(rhs[i]));
}
console.log('Max RHS:', max_rhs.toExponential(4));

// 3. Solve Poisson with SOR
const p = new Float64Array(grid.size);  // Start from zero
const dx2 = grid.dx * grid.dx;
const dy2 = grid.dy * grid.dy;
const dz2 = grid.dz * grid.dz;
const cx = 1 / dx2;
const cy = 1 / dy2;
const cz = 1 / dz2;
const cc = -2 * (cx + cy + cz);
const omega = 1.822;

console.log('');
console.log('SOR convergence:');

for (let iter = 0; iter < 500; iter++) {
  let residual = 0;

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

        const p_gs = (
          cx * (p[ip] + p[im]) +
          cy * (p[jp] + p[jm]) +
          cz * (p[kp] + p[km]) -
          rhs[idx]
        ) / (-cc);

        const delta = omega * (p_gs - p[idx]);
        p[idx] += delta;
        residual = Math.max(residual, Math.abs(delta));
      }
    }
  }

  if (iter % 50 === 0 || iter < 10) {
    console.log(`  Iter ${iter}: residual = ${residual.toExponential(4)}`);
  }

  if (residual < 1e-10) {
    console.log(`  Converged at iter ${iter}`);
    break;
  }
}

// Check pressure values
let max_p = 0;
for (let i = 0; i < grid.size; i++) {
  max_p = Math.max(max_p, Math.abs(p[i]));
}
console.log('Max pressure:', max_p.toExponential(4));

// 4. Project velocity
const dp_dx = Derivatives3D.dx(p, grid);
const dp_dy = Derivatives3D.dy(p, grid);
const dp_dz = Derivatives3D.dz(p, grid);

const u_new = new Float64Array(grid.size);
const v_new = new Float64Array(grid.size);
const w_new = new Float64Array(grid.size);

const proj_factor = dt / rho;
console.log('Projection factor (dt/rho):', proj_factor.toExponential(4));

for (let i = 1; i < grid.Nx - 1; i++) {
  for (let j = 1; j < grid.Ny - 1; j++) {
    for (let k = 1; k < grid.Nz - 1; k++) {
      const idx = grid.idx(i, j, k);
      u_new[idx] = u_star[idx] - proj_factor * dp_dx[idx];
      v_new[idx] = v_star[idx] - proj_factor * dp_dy[idx];
      w_new[idx] = w_star[idx] - proj_factor * dp_dz[idx];
    }
  }
}

// Check final divergence
const div_new = Derivatives3D.divergence(u_new, v_new, w_new, grid);
let max_div_new = 0;
for (let i = 0; i < grid.size; i++) {
  max_div_new = Math.max(max_div_new, Math.abs(div_new[i]));
}
console.log('');
console.log('Final divergence after projection:', max_div_new.toExponential(4));
