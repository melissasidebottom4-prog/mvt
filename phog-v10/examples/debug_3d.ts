/**
 * Debug 3D Navier-Stokes solver
 */

import { NavierStokes3D } from '../src/rings/spatial/NavierStokes3D.js';

const solver = new NavierStokes3D(32, 32, 32, 1e-3, 1e-6, 1000);

console.log('3D Navier-Stokes Debug');
console.log('======================');
console.log('Grid:', solver.grid.Nx, '×', solver.grid.Ny, '×', solver.grid.Nz);
console.log('dx:', solver.grid.dx.toExponential(4), 'm');
console.log('');

// Initialize Taylor-Green
solver.setTaylorGreen(0.1);

console.log('After Taylor-Green initialization:');
console.log('  Max velocity:', solver.getMaxVelocity().toExponential(4), 'm/s');
console.log('  Kinetic energy:', solver.getKineticEnergy().toExponential(4), 'J');
console.log('  Divergence:', solver.getDivergence().toExponential(4));
console.log('');

// Check a few velocity values
const grid = solver.grid;
const center = Math.floor(grid.Nx / 2);
console.log('Velocity at center (', center, ',', center, ',', center, '):');
const idx_c = grid.idx(center, center, center);
console.log('  u:', solver.u[idx_c].toExponential(4));
console.log('  v:', solver.v[idx_c].toExponential(4));
console.log('  w:', solver.w[idx_c].toExponential(4));

// Check velocity at corner
console.log('Velocity at (1, 1, 1):');
const idx_1 = grid.idx(1, 1, 1);
console.log('  u:', solver.u[idx_1].toExponential(4));
console.log('  v:', solver.v[idx_1].toExponential(4));
console.log('  w:', solver.w[idx_1].toExponential(4));

// Step once
const dt = 1e-5;  // Very small dt
console.log('\nStepping with dt =', dt.toExponential(2), 's');
solver.step(dt);

console.log('\nAfter one step:');
console.log('  Max velocity:', solver.getMaxVelocity().toExponential(4), 'm/s');
console.log('  Kinetic energy:', solver.getKineticEnergy().toExponential(4), 'J');
console.log('  Divergence:', solver.getDivergence().toExponential(4));
console.log('');

// Step a few more times
for (let i = 0; i < 5; i++) {
  solver.step(dt);
  const div = solver.getDivergence();
  const E = solver.getKineticEnergy();
  console.log(`Step ${i + 2}: E = ${E.toExponential(4)}, div = ${div.toExponential(4)}`);
}
