/**
 * PHOG V10 - Phase 3: Hot Ball Falling
 *
 * Demonstrates multi-physics coupling:
 * - Mechanics: Ball falls under gravity
 * - Thermal: Ball starts hot, heats from friction
 * - Coupling: Friction converts mechanical energy to heat
 *
 * Conservation proof:
 * - E_mech decreases (friction)
 * - E_thermal increases (friction heating)
 * - E_total: CONSERVED
 * - Entropy: INCREASES (2nd law)
 */

import { CouplingManager } from '../src/coupling/manager.js';
import { computeMultiDomainConservation } from '../src/conservation.js';

console.log('');
console.log('='.repeat(85));
console.log('PHOG V10 - Phase 3: Hot Ball Falling with Friction');
console.log('='.repeat(85));
console.log('');
console.log('Physics: Mechanics + Thermal + Friction Coupling');
console.log('');

// Create coupling manager
const manager = new CouplingManager();

// Configure friction
manager.config.frictionCoeff = 0.5;  // Moderate friction
manager.config.enableFriction = true;
manager.config.enableReaction = false;  // No chemistry in this example

// Initial conditions: Hot ball at height 10m, at rest
manager.mechanics.init(10, 0, 0.1);           // 10m, 0m/s, 100g
manager.thermal.init(373.15, 500, 0.1);       // 100°C, 500 J/kg·K, 100g
manager.species.init(0, 0, 1, 0);             // No species

console.log('Initial Conditions:');
console.log(`  Height:      ${manager.mechanics.state.position} m`);
console.log(`  Velocity:    ${manager.mechanics.state.velocity} m/s`);
console.log(`  Mass:        ${manager.mechanics.state.mass} kg`);
console.log(`  Temperature: ${manager.thermal.state.temperature - 273.15} °C`);
console.log(`  Friction:    μ = ${manager.config.frictionCoeff}`);
console.log('');

// Get initial energy
const initialState = manager.getState0D(9.8);
const initialConservation = computeMultiDomainConservation(initialState);

console.log('Initial Energy Budget:');
console.log(`  E_mechanics: ${initialConservation.energy.mechanics.toFixed(4)} J`);
console.log(`  E_thermal:   ${initialConservation.energy.thermal.toFixed(4)} J`);
console.log(`  E_total:     ${initialConservation.energy.total.toFixed(4)} J`);
console.log('');

// Simulation parameters
const dt = 0.1;
const duration = 2.0;
const g = 9.8;

// Output header
console.log('-'.repeat(85));
console.log(
  't(s)'.padStart(6) +
  'y(m)'.padStart(10) +
  'v(m/s)'.padStart(10) +
  'T(°C)'.padStart(10) +
  'E_mech(J)'.padStart(12) +
  'E_therm(J)'.padStart(12) +
  'E_total(J)'.padStart(12) +
  'dS(J/K)'.padStart(10) +
  'Status'.padStart(8)
);
console.log('-'.repeat(85));

// Track violations
let totalViolations = 0;
const E_initial = initialConservation.energy.total;

// Run simulation
for (let t = 0; t <= duration; t += dt) {
  const result = manager.step(dt, g);
  const c = result.conservation;

  totalViolations += result.violations.length;

  const T_celsius = result.state.temperature - 273.15;
  const dE = Math.abs(c.energy.total - E_initial);
  const status = result.violations.length === 0 ? '\u2713' : '\u2717';

  console.log(
    t.toFixed(2).padStart(6) +
    result.state.position.toFixed(4).padStart(10) +
    result.state.velocity.toFixed(4).padStart(10) +
    T_celsius.toFixed(2).padStart(10) +
    c.energy.mechanics.toFixed(4).padStart(12) +
    c.energy.thermal.toFixed(4).padStart(12) +
    c.energy.total.toFixed(4).padStart(12) +
    c.entropy.irreversible.toFixed(4).padStart(10) +
    status.padStart(8)
  );

  // Stop if ball hits ground
  if (result.state.position <= 0) {
    console.log('  [Ball hit ground]');
    break;
  }
}

// Final state
const finalState = manager.getState0D(g);
const finalConservation = computeMultiDomainConservation(finalState);

console.log('-'.repeat(85));
console.log('');

// Summary
console.log('CONSERVATION SUMMARY:');
console.log('-'.repeat(40));
console.log(`  Initial E_total: ${E_initial.toFixed(6)} J`);
console.log(`  Final E_total:   ${finalConservation.energy.total.toFixed(6)} J`);
console.log(`  Energy drift:    ${Math.abs(finalConservation.energy.total - E_initial).toExponential(4)} J`);
console.log('');
console.log('ENTROPY SUMMARY:');
console.log('-'.repeat(40));
console.log(`  Initial entropy: ${initialConservation.entropy.total.toFixed(6)} J/K`);
console.log(`  Final entropy:   ${finalConservation.entropy.total.toFixed(6)} J/K`);
console.log(`  Entropy change:  ${(finalConservation.entropy.total - initialConservation.entropy.total).toFixed(6)} J/K`);
console.log(`  Irreversible:    ${finalConservation.entropy.irreversible.toFixed(6)} J/K`);
console.log('');
console.log('ENERGY TRANSFER:');
console.log('-'.repeat(40));
console.log(`  E_mech change:   ${(finalConservation.energy.mechanics - initialConservation.energy.mechanics).toFixed(4)} J`);
console.log(`  E_therm change:  ${(finalConservation.energy.thermal - initialConservation.energy.thermal).toFixed(4)} J`);
console.log('');

// Verification
console.log('='.repeat(85));
if (totalViolations === 0) {
  console.log('\u2705 PHASE 3 SUCCESS: Multi-physics coupling with conservation!');
  console.log('   - Energy: CONSERVED (mechanical → thermal via friction)');
  console.log('   - Entropy: INCREASED (2nd law obeyed)');
} else {
  console.log(`\u26A0  Simulation completed with ${totalViolations} conservation violations`);
}
console.log('='.repeat(85));
console.log('');
