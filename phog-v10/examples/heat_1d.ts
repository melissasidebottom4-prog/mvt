/**
 * PHOG V10 - Phase 5: 1D Heat Diffusion with Energy Conservation
 *
 * Demonstrates:
 * - Heat equation: ∂T/∂t = α·∂²T/∂x²
 * - Conservation of total thermal energy (Neumann BCs)
 * - Diffusive spreading of initial temperature pulse
 *
 * PHYSICS:
 * With Neumann (no-flux) boundaries, heat cannot escape.
 * Total energy E = ∫ρ·cp·T dx is conserved exactly.
 * Heat spreads until uniform T = T_avg everywhere.
 */

import { SpatialRing1D } from '../src/rings/SpatialRing1D.js';
import { HeatSolver1D } from '../src/rings/spatial/HeatSolver1D.js';

console.log('');
console.log('='.repeat(70));
console.log('PHOG V10 - Phase 5: 1D Heat Diffusion with Energy Conservation');
console.log('='.repeat(70));
console.log('');
console.log('Equation: ∂T/∂t = α·∂²T/∂x²');
console.log('Boundary: Neumann (no flux) → Energy conserved');
console.log('');

// Parameters
const N = 101;          // Grid points
const L = 1.0;          // Domain length (m)
const alpha = 0.01;     // Thermal diffusivity (m²/s)
const rho = 1000;       // Density (kg/m³)
const cp = 1000;        // Specific heat (J/(kg·K))
const T0 = 100;         // Initial peak temperature (K)
const x0 = 0.5;         // Initial peak position (m)

// Create spatial ring
const heatRing = new SpatialRing1D('heat', N, L, { alpha, rho, cp });
const solver = heatRing.getSolver() as HeatSolver1D;

// Ensure Neumann BC for energy conservation
solver.bc = 'neumann';

// Set initial condition: Gaussian pulse at center
const dx = L / (N - 1);
const sigma = 0.05;  // Width of initial pulse
for (let i = 0; i < N; i++) {
  const x = i * dx;
  solver.field[i] = T0 * Math.exp(-(x - x0) * (x - x0) / (2 * sigma * sigma));
}

console.log('Initial Conditions:');
console.log(`  Grid:           ${N} points, L = ${L} m`);
console.log(`  Diffusivity:    α = ${alpha} m²/s`);
console.log(`  Peak temp:      T₀ = ${T0} K at x₀ = ${x0} m`);
console.log(`  Pulse width:    σ = ${sigma} m`);
console.log(`  Stability:      dt < dx²/(2α) = ${(dx * dx / (2 * alpha)).toFixed(4)} s`);
console.log('');

// Get initial energy
const E_initial = heatRing.getEnergy().total;
console.log(`Initial Energy:   ${E_initial.toFixed(4)} J`);
console.log('');

// Compute expected final temperature (when uniform)
let T_sum = 0;
for (let i = 0; i < N; i++) {
  T_sum += solver.field[i];
}
const T_avg = T_sum / N;
console.log(`Expected T_final: ${T_avg.toFixed(4)} K (uniform when equilibrated)`);
console.log('');

// Simulation parameters
const dt = 0.001;       // Time step (well within stability limit)
const tMax = 1.0;       // Total simulation time

console.log('-'.repeat(70));
console.log(
  'Time(s)'.padEnd(10) +
  'E(J)'.padEnd(16) +
  'dE(J)'.padEnd(14) +
  'T_max(K)'.padEnd(12) +
  'T_min(K)'.padEnd(12) +
  'Status'
);
console.log('-'.repeat(70));

let maxDrift = 0;

// Run simulation
for (let t = 0.1; t <= tMax + 0.001; t += 0.1) {
  // Step 100 times to reach next output point
  for (let i = 0; i < 100; i++) {
    heatRing.step(dt);
  }

  const E = heatRing.getEnergy().total;
  const dE = Math.abs(E - E_initial);
  maxDrift = Math.max(maxDrift, dE);

  const T_max = solver.getMax();
  let T_min = Infinity;
  for (let i = 0; i < N; i++) {
    if (solver.field[i] < T_min) T_min = solver.field[i];
  }

  const status = dE < 1e-8 ? '✓' : '✗';

  console.log(
    t.toFixed(1).padEnd(10) +
    E.toExponential(8).padEnd(16) +
    dE.toExponential(2).padEnd(14) +
    T_max.toFixed(4).padEnd(12) +
    T_min.toFixed(4).padEnd(12) +
    status
  );
}

console.log('-'.repeat(70));
console.log('');

// Summary
console.log('CONSERVATION SUMMARY:');
console.log('-'.repeat(40));
console.log(`  Initial Energy:   ${E_initial.toExponential(8)} J`);
console.log(`  Final Energy:     ${heatRing.getEnergy().total.toExponential(8)} J`);
console.log(`  Maximum Drift:    ${maxDrift.toExponential(4)} J`);
console.log(`  Relative Drift:   ${(maxDrift / E_initial).toExponential(4)}`);
console.log('');

console.log('DIFFUSION BEHAVIOR:');
console.log('-'.repeat(40));
console.log(`  Initial T_max:    ${T0.toFixed(2)} K`);
console.log(`  Final T_max:      ${solver.getMax().toFixed(4)} K`);
console.log(`  Expected T_avg:   ${T_avg.toFixed(4)} K`);
console.log('');

// Verification
console.log('='.repeat(70));
const conservationOK = maxDrift < 1e-6;  // Relative to large energy values

if (conservationOK) {
  console.log('✅ PHASE 5 HEAT: Energy conservation verified!');
  console.log(`   - Energy drift: ${maxDrift.toExponential(2)} J`);
  console.log(`   - Relative:     ${(maxDrift / E_initial).toExponential(2)}`);
  console.log('   - Physics:      Heat spreads (T_max → T_avg) with E conserved');
  console.log('   - Ready for planet-auditable heat proofs');
} else {
  console.log('⚠  Conservation needs refinement');
  console.log(`   - Energy drift: ${maxDrift.toExponential(2)} J exceeds target`);
}
console.log('='.repeat(70));
console.log('');
