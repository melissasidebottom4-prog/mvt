/**
 * Direct test of EMSolver1D without ConservationCore wrapper
 */

import { EMSolver1D } from '../src/rings/em/EMSolver1D.js';

const N = 100;
const L = 1e-6;
const solver = new EMSolver1D(N, L);

console.log('EMSolver1D Direct Test');
console.log(`N=${N}, L=${L}, dx=${solver.grid.dx}`);
console.log(`eps0=${solver.eps0}, mu0=${solver.mu0}, c=${solver.c}`);
console.log(`CFL: dt_max = dx/c = ${(solver.grid.dx / solver.c).toExponential(3)} s`);
console.log('');

// Initialize Gaussian pulse at center
const center = Math.floor(N / 2);
const sigma = 5;  // Grid points

for (let i = 0; i < N; i++) {
  const x = i - center;
  solver.Ez[i] = Math.exp(-x * x / (2 * sigma * sigma));
}

const dt = 1e-18;  // Well below CFL limit
console.log(`Using dt = ${dt.toExponential(2)} s`);
console.log(`Courant = c*dt/dx = ${(solver.c * dt / solver.grid.dx).toFixed(3)}`);
console.log('');

console.log('Step  Energy');
for (let step = 0; step <= 100; step++) {
  if (step % 10 === 0) {
    console.log(`${step.toString().padEnd(6)}${solver.getEnergy().toExponential(4)}`);
  }
  solver.step(dt);
}
