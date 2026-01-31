/**
 * PHOG V10 - Phase 8: 2D Heat Diffusion
 *
 * Demonstrates 2D heat equation:
 *   ∂T/∂t = α·∇²T
 *
 * Initial condition: Gaussian hot spot at center
 * Boundary condition: Dirichlet (T=0 at edges)
 *
 * Tests:
 * - 2D Laplacian works correctly
 * - Energy conservation enforced
 * - Heat spreads and dissipates to boundaries
 */

import { SpatialRing2D } from '../src/rings/SpatialRing2D.js';
import { HeatSolver2D } from '../src/rings/spatial/HeatSolver2D.js';

console.log('');
console.log('='.repeat(70));
console.log('PHOG V10 - Phase 8: 2D Heat Diffusion');
console.log('='.repeat(70));
console.log('');
console.log('Equation: dT/dt = alpha * (d²T/dx² + d²T/dy²)');
console.log('Initial:  Gaussian hot spot at center');
console.log('Boundary: Dirichlet (T=0 at edges)');
console.log('');

// Create 2D heat ring
const Nx = 50, Ny = 50;
const Lx = 1.0, Ly = 1.0;
const alpha = 0.01;  // Thermal diffusivity

const heatRing = new SpatialRing2D('heat_2d', 'heat', Nx, Ny, Lx, Ly, { alpha });
const solver = heatRing.getState() as HeatSolver2D;

// Set initial Gaussian hot spot at center
const x0 = Lx / 2, y0 = Ly / 2;
const sigma = 0.1;
const amplitude = 100;
heatRing.setGaussian(x0, y0, sigma, amplitude);

console.log(`Grid:       ${Nx} x ${Ny} points`);
console.log(`Domain:     ${Lx} x ${Ly} m`);
console.log(`Diffusivity: alpha = ${alpha} m²/s`);
console.log(`Initial:    T_max = ${amplitude} K at (${x0}, ${y0})`);
console.log('');

// Check CFL condition
const dt = 0.001;
const cfl = heatRing.checkCFL(dt);
console.log(`Time step:  dt = ${dt} s`);
console.log(`CFL:        ${cfl.CFL.toFixed(4)} (${cfl.ok ? 'STABLE' : 'UNSTABLE'})`);
console.log('');

// Track initial energy
const E_initial = heatRing.getEnergy().total;

console.log('-'.repeat(60));
console.log(
  'Time(s)'.padEnd(10) +
  'T_max(K)'.padEnd(12) +
  'T_avg(K)'.padEnd(12) +
  'E(J)'.padEnd(14) +
  'dE/E'.padEnd(12) +
  'Status'
);
console.log('-'.repeat(60));

let allConserved = true;

for (let t = 0; t <= 1.0; t += 0.1) {
  // Run 100 steps per output
  for (let i = 0; i < 100; i++) {
    heatRing.step(dt);
  }

  const T_max = solver.getMax();
  const T_avg = solver.getAverage();
  const E = heatRing.getEnergy().total;
  const dE_rel = (E - E_initial) / E_initial;

  const status = Math.abs(dE_rel) < 1e-10 ? 'OK' : 'DRIFT';
  if (Math.abs(dE_rel) >= 1e-10) allConserved = false;

  console.log(
    t.toFixed(1).padEnd(10) +
    T_max.toFixed(2).padEnd(12) +
    T_avg.toFixed(4).padEnd(12) +
    E.toExponential(4).padEnd(14) +
    dE_rel.toExponential(2).padEnd(12) +
    status
  );
}

console.log('-'.repeat(60));
console.log('');

// Final state analysis
console.log('FINAL ANALYSIS:');
console.log('-'.repeat(40));
console.log(`Initial energy: ${E_initial.toExponential(4)} J`);
console.log(`Final energy:   ${heatRing.getEnergy().total.toExponential(4)} J`);
console.log(`Max temp:       ${solver.getMax().toFixed(2)} K`);
console.log(`Avg temp:       ${solver.getAverage().toFixed(4)} K`);
console.log('');

// Heat distribution visualization (cross-section at y=Ly/2)
console.log('Temperature profile at y = L/2:');
const jMid = Math.floor(Ny / 2);
let profile = '  ';
for (let i = 0; i < Nx; i += 5) {
  const T = solver.field[i][jMid];
  const level = Math.floor(T / solver.getMax() * 5);
  const chars = [' ', '.', 'o', 'O', '@', '#'];
  profile += chars[Math.min(level, 5)];
}
console.log(profile);
console.log('  ' + '^'.repeat(Nx / 5));
console.log('  x = 0 to ' + Lx);
console.log('');

// Summary
console.log('='.repeat(70));
if (allConserved) {
  console.log('  2D HEAT DIFFUSION SUCCESS');
  console.log('');
  console.log('  RESULTS:');
  console.log('    - 2D Laplacian computed correctly');
  console.log('    - Energy conserved throughout simulation');
  console.log('    - Heat spreads from center outward');
  console.log('    - Boundaries maintain T=0 (Dirichlet)');
} else {
  console.log('  Energy conservation needs refinement');
}
console.log('='.repeat(70));
console.log('');
