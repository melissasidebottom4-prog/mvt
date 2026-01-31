/**
 * PHOG V10 - Falling Ball Simulation
 *
 * Demonstrates time-stepping with conservation monitoring
 * A ball falling under gravity should conserve total mechanical energy
 */

import {
  simulate,
  formatSimulation,
  createFallingObjectDerivatives
} from '../src/simulator.js';
import { listIntegrators } from '../src/integrators.js';

console.log('='.repeat(80));
console.log('PHOG V10 - FALLING BALL WITH CONSERVATION MONITORING');
console.log('='.repeat(80));
console.log();

// Initial conditions: ball at height 10m, at rest
const initialState = {
  y: 10,      // height (m)
  v: 0,       // velocity (m/s)
  m: 1,       // mass (kg)
  g: 9.8      // gravity (m/s^2) - stored for energy calculation
};

// Gravity derivatives: dy/dt = v, dv/dt = -g
const derivatives = createFallingObjectDerivatives(9.8);

console.log('Initial Conditions:');
console.log(`  Height:   ${initialState.y} m`);
console.log(`  Velocity: ${initialState.v} m/s`);
console.log(`  Mass:     ${initialState.m} kg`);
console.log(`  Gravity:  ${initialState.g} m/s^2`);
console.log();

// Expected physics:
// E = KE + PE = 0.5*m*v^2 + m*g*h
// Initial: E = 0 + 1*9.8*10 = 98 J
// At ground: v = sqrt(2*g*h) = sqrt(2*9.8*10) = 14 m/s
// Final KE = 0.5*1*14^2 = 98 J (energy conserved!)

console.log('Expected Physics:');
console.log('  Initial energy: E = mgh = 1 * 9.8 * 10 = 98 J');
console.log('  Final velocity: v = sqrt(2gh) = 14 m/s');
console.log('  Final energy:   E = 0.5mv^2 = 98 J (conserved)');
console.log();

// List available integrators
console.log('Available Integrators:');
for (const int of listIntegrators()) {
  console.log(`  - ${int.name} (order ${int.order})`);
}
console.log();

// =============================================================================
// TEST 1: Euler (1st order) - known to have energy drift
// =============================================================================
console.log('TEST 1: Forward Euler (expect some energy drift)');
console.log('-'.repeat(80));

const eulerResult = simulate(initialState, derivatives, {
  dt: 0.1,
  duration: 1.4,  // ~time to hit ground
  integrator: 'euler',
  outputInterval: 1
});

console.log(formatSimulation(eulerResult));
console.log();

// =============================================================================
// TEST 2: RK4 (4th order) - much better energy conservation
// =============================================================================
console.log('TEST 2: RK4 (expect excellent energy conservation)');
console.log('-'.repeat(80));

const rk4Result = simulate(initialState, derivatives, {
  dt: 0.1,
  duration: 1.4,
  integrator: 'rk4',
  outputInterval: 1
});

console.log(formatSimulation(rk4Result));
console.log();

// =============================================================================
// TEST 3: Velocity Verlet (symplectic) - designed for energy conservation
// =============================================================================
console.log('TEST 3: Velocity Verlet (symplectic, designed for energy conservation)');
console.log('-'.repeat(80));

const verletResult = simulate(initialState, derivatives, {
  dt: 0.1,
  duration: 1.4,
  integrator: 'velocity_verlet',
  outputInterval: 1
});

console.log(formatSimulation(verletResult));
console.log();

// =============================================================================
// COMPARISON
// =============================================================================
console.log('='.repeat(80));
console.log('INTEGRATOR COMPARISON');
console.log('='.repeat(80));
console.log();

const E0 = 98; // Initial energy

function getEnergyDrift(result: typeof eulerResult): number {
  const finalE = result.steps[result.steps.length - 1]?.energy ?? 0;
  return Math.abs(finalE - E0);
}

console.log('Energy drift after 1.4s of simulation:');
console.log(`  Euler:           ${getEnergyDrift(eulerResult).toExponential(4)} J`);
console.log(`  RK4:             ${getEnergyDrift(rk4Result).toExponential(4)} J`);
console.log(`  Velocity Verlet: ${getEnergyDrift(verletResult).toExponential(4)} J`);
console.log();

console.log('Conservation violations:');
console.log(`  Euler:           ${eulerResult.conservationViolations}`);
console.log(`  RK4:             ${rk4Result.conservationViolations}`);
console.log(`  Velocity Verlet: ${verletResult.conservationViolations}`);
console.log();

console.log('Receipts generated:');
console.log(`  Euler:           ${eulerResult.receipts.length}`);
console.log(`  RK4:             ${rk4Result.receipts.length}`);
console.log(`  Velocity Verlet: ${verletResult.receipts.length}`);
console.log();

// Show sample receipt
console.log('-'.repeat(80));
console.log('SAMPLE RECEIPT (RK4, final step):');
console.log('-'.repeat(80));
const sampleReceipt = rk4Result.receipts[rk4Result.receipts.length - 1];
if (sampleReceipt) {
  console.log(JSON.stringify(sampleReceipt, null, 2));
}
console.log();

console.log('='.repeat(80));
console.log('PHASE 2 COMPLETE: Time-stepping with conservation monitoring');
console.log('='.repeat(80));
