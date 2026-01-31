/**
 * PHOG V10 - Phase 3: Enzyme Reaction
 *
 * Demonstrates Michaelis-Menten kinetics as a COUPLING mechanism:
 * - Species: Substrate consumed via MM kinetics
 * - Thermal: Heat released from exothermic reaction
 * - Coupling: Chemical energy → thermal energy
 *
 * MICHAELIS-MENTEN EQUATION:
 *
 *        V_max · [S]
 *   v = ─────────────
 *        K_m + [S]
 *
 * Where:
 * - v = reaction rate (mol/s)
 * - V_max = maximum rate (enzyme saturated)
 * - [S] = substrate concentration (mol/m³)
 * - K_m = Michaelis constant (concentration at half V_max)
 *
 * Conservation proof:
 * - E_chemical decreases (substrate consumed)
 * - E_thermal increases (exothermic heat)
 * - E_total: CONSERVED
 * - Entropy: INCREASES (irreversible reaction)
 */

import { CouplingManager } from '../src/coupling/manager.js';
import { computeMultiDomainConservation } from '../src/conservation.js';

console.log('');
console.log('='.repeat(90));
console.log('PHOG V10 - Phase 3: Enzyme Reaction (Michaelis-Menten)');
console.log('='.repeat(90));
console.log('');
console.log('Physics: Species + Thermal + Enzyme Kinetics Coupling');
console.log('');
console.log('Michaelis-Menten: v = V_max·[S] / (K_m + [S])');
console.log('');

// Create coupling manager
const manager = new CouplingManager();

// Configure couplings
manager.config.enableFriction = false;  // No mechanics in this example
manager.config.enableReaction = true;   // Enable enzyme kinetics

// Initial conditions: Stationary system with substrate
manager.mechanics.init(0, 0, 0.1);        // No motion
manager.thermal.init(310.15, 4186, 0.1);  // 37°C (body temp), water cp, 100g

// Michaelis-Menten parameters
const S_initial = 10.0;    // mol/m³ initial substrate
const V_max = 1.0;         // mol/s maximum rate
const K_m = 5.0;           // mol/m³ Michaelis constant
const delta_H = -50000;    // J/mol (exothermic: -50 kJ/mol)

manager.species.init(S_initial, V_max, K_m, delta_H);

console.log('Initial Conditions:');
console.log(`  Substrate [S]:  ${S_initial} mol/m³`);
console.log(`  V_max:          ${V_max} mol/s`);
console.log(`  K_m:            ${K_m} mol/m³`);
console.log(`  ΔH:             ${delta_H / 1000} kJ/mol (exothermic)`);
console.log(`  Temperature:    ${manager.thermal.state.temperature - 273.15} °C`);
console.log(`  Mass:           ${manager.thermal.state.mass} kg`);
console.log('');

// Get initial energy
const initialState = manager.getState0D(0);
const initialConservation = computeMultiDomainConservation(initialState);

console.log('Initial Energy Budget:');
console.log(`  E_chemical: ${initialConservation.energy.species.toFixed(2)} J (ΔH × [S])`);
console.log(`  E_thermal:  ${initialConservation.energy.thermal.toFixed(2)} J`);
console.log(`  E_total:    ${initialConservation.energy.total.toFixed(2)} J`);
console.log('');

// Simulation parameters
const dt = 0.5;
const duration = 15.0;

// Output header
console.log('-'.repeat(90));
console.log(
  't(s)'.padStart(6) +
  '[S](mol/m³)'.padStart(13) +
  'v(mol/s)'.padStart(11) +
  'T(°C)'.padStart(9) +
  'E_chem(J)'.padStart(12) +
  'E_therm(J)'.padStart(12) +
  'E_total(J)'.padStart(12) +
  'dS(J/K)'.padStart(10) +
  'Status'.padStart(8)
);
console.log('-'.repeat(90));

// Track violations
let totalViolations = 0;
const E_initial = initialConservation.energy.total;

// Print initial state
const c0 = initialConservation;
console.log(
  '0.00'.padStart(6) +
  S_initial.toFixed(4).padStart(13) +
  '0.0000'.padStart(11) +
  (manager.thermal.state.temperature - 273.15).toFixed(2).padStart(9) +
  c0.energy.species.toFixed(2).padStart(12) +
  c0.energy.thermal.toFixed(2).padStart(12) +
  c0.energy.total.toFixed(2).padStart(12) +
  '0.0000'.padStart(10) +
  '\u2713'.padStart(8)
);

// Run simulation
for (let step = 1; step <= duration / dt; step++) {
  const t = step * dt;
  const result = manager.step(dt, 0);  // g=0 (no gravity)
  const c = result.conservation;

  totalViolations += result.violations.length;

  const T_celsius = result.state.temperature - 273.15;
  const status = result.violations.length === 0 ? '\u2713' : '\u2717';

  console.log(
    t.toFixed(2).padStart(6) +
    result.state.concentration.toFixed(4).padStart(13) +
    result.state.reactionRate.toFixed(4).padStart(11) +
    T_celsius.toFixed(2).padStart(9) +
    c.energy.species.toFixed(2).padStart(12) +
    c.energy.thermal.toFixed(2).padStart(12) +
    c.energy.total.toFixed(2).padStart(12) +
    c.entropy.irreversible.toFixed(4).padStart(10) +
    status.padStart(8)
  );

  // Stop if substrate exhausted
  if (result.state.concentration < 0.01) {
    console.log('  [Substrate exhausted]');
    break;
  }
}

// Final state
const finalState = manager.getState0D(0);
const finalConservation = computeMultiDomainConservation(finalState);

console.log('-'.repeat(90));
console.log('');

// Summary
console.log('CONSERVATION SUMMARY:');
console.log('-'.repeat(45));
console.log(`  Initial E_total: ${E_initial.toFixed(4)} J`);
console.log(`  Final E_total:   ${finalConservation.energy.total.toFixed(4)} J`);
console.log(`  Energy drift:    ${Math.abs(finalConservation.energy.total - E_initial).toExponential(4)} J`);
console.log('');
console.log('ENERGY TRANSFER (Chemical → Thermal):');
console.log('-'.repeat(45));
console.log(`  E_chem change:   ${(finalConservation.energy.species - initialConservation.energy.species).toFixed(4)} J`);
console.log(`  E_therm change:  ${(finalConservation.energy.thermal - initialConservation.energy.thermal).toFixed(4)} J`);
console.log(`  Sum (should≈0): ${((finalConservation.energy.species - initialConservation.energy.species) + (finalConservation.energy.thermal - initialConservation.energy.thermal)).toExponential(4)} J`);
console.log('');
console.log('ENTROPY SUMMARY:');
console.log('-'.repeat(45));
console.log(`  Initial entropy: ${initialConservation.entropy.total.toFixed(6)} J/K`);
console.log(`  Final entropy:   ${finalConservation.entropy.total.toFixed(6)} J/K`);
console.log(`  Entropy change:  ${(finalConservation.entropy.total - initialConservation.entropy.total).toFixed(6)} J/K`);
console.log(`  Irreversible:    ${finalConservation.entropy.irreversible.toFixed(6)} J/K`);
console.log('');
console.log('REACTION PROGRESS:');
console.log('-'.repeat(45));
console.log(`  Initial [S]:     ${S_initial.toFixed(4)} mol/m³`);
console.log(`  Final [S]:       ${finalState.concentration.toFixed(4)} mol/m³`);
console.log(`  Conversion:      ${((1 - finalState.concentration / S_initial) * 100).toFixed(1)}%`);
console.log(`  Temp rise:       ${(finalState.temperature - 310.15).toFixed(2)} K`);
console.log('');

// Verification
console.log('='.repeat(90));
if (totalViolations === 0) {
  console.log('\u2705 PHASE 3 SUCCESS: Michaelis-Menten embedded in coupling layer!');
  console.log('   - Energy: CONSERVED (chemical → thermal)');
  console.log('   - Entropy: INCREASED (irreversible reaction)');
  console.log('   - 2nd Law: OBEYED');
} else {
  console.log(`\u26A0  Simulation completed with ${totalViolations} conservation violations`);
}
console.log('='.repeat(90));
console.log('');
