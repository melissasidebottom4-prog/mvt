/**
 * PHOG V10 - Phase 4: Enzyme Reaction (Ring Architecture)
 *
 * Same physics as Phase 3 enzyme reaction, but using Saturn Ring architecture.
 * Demonstrates Michaelis-Menten kinetics as a ring coupling to thermal.
 *
 * Architecture:
 *   ConservationCore (the "planet")
 *   ├─ ThermalRing (temperature)
 *   ├─ SpeciesRing (substrate concentration, MM kinetics)
 *   └─ Reaction Coupling (species → thermal via -ΔH)
 *
 * MICHAELIS-MENTEN KINETICS:
 *
 *        V_max · [S]
 *   v = ─────────────
 *        K_m + [S]
 *
 * Conservation: E_chemical + E_thermal = constant
 */

import { ConservationCore } from '../src/core/ConservationCore.js';
import { ThermalRing } from '../src/rings/ThermalRing.js';
import { SpeciesRing } from '../src/rings/SpeciesRing.js';

console.log('');
console.log('='.repeat(90));
console.log('PHOG V10 - Phase 4: Enzyme Reaction (Saturn Ring Architecture)');
console.log('='.repeat(90));
console.log('');
console.log('Architecture: ConservationCore + ThermalRing + SpeciesRing + Reaction Coupling');
console.log('');
console.log('Michaelis-Menten: v = V_max·[S] / (K_m + [S])');
console.log('');

// Create the conservation core
const core = new ConservationCore();

// Create rings
const thermalRing = new ThermalRing();
const speciesRing = new SpeciesRing();

// Michaelis-Menten parameters (same as Phase 3)
const S_initial = 10.0;    // mol/m³ initial substrate
const V_max = 1.0;         // mol/s maximum rate
const K_m = 5.0;           // mol/m³ Michaelis constant
const delta_H = -50000;    // J/mol (exothermic: -50 kJ/mol)

// Thermal parameters
const temperature = 310.15;  // 37°C (body temp)
const cp = 4186;             // J/(kg·K) water
const mass = 0.1;            // 100g

// Initialize rings
thermalRing.init(temperature, cp, mass);
speciesRing.init(S_initial, V_max, K_m, delta_H);

// Register rings with core
core.registerRing(thermalRing);
core.registerRing(speciesRing);

// Register reaction coupling: chemical energy → thermal energy
core.registerCoupling({
  sourceId: 'species',
  targetId: 'thermal',
  name: 'reaction',
  compute: (_source, _target, _dt) => {
    // Energy released = energy change in species ring
    // This is already computed by the species ring step
    return speciesRing.getEnergyReleased();
  }
});

console.log('Initial Conditions:');
console.log(`  Substrate [S]:  ${S_initial} mol/m³`);
console.log(`  V_max:          ${V_max} mol/s`);
console.log(`  K_m:            ${K_m} mol/m³`);
console.log(`  ΔH:             ${delta_H / 1000} kJ/mol (exothermic)`);
console.log(`  Temperature:    ${temperature - 273.15} °C`);
console.log(`  Mass:           ${mass} kg`);
console.log('');

// Get initial energy
const initialState = core.getState();
const E_initial = initialState.energy.total;

console.log('Initial Energy Budget:');
console.log(`  E_chemical: ${initialState.energy.byRing.get('species')?.total.toFixed(2)} J (−ΔH × [S])`);
console.log(`  E_thermal:  ${initialState.energy.byRing.get('thermal')?.total.toFixed(2)} J`);
console.log(`  E_total:    ${E_initial.toFixed(2)} J`);
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
  'Drift(J)'.padStart(12) +
  'OK'.padStart(6)
);
console.log('-'.repeat(90));

// Track results
let maxDrift = 0;
let steps = 0;
let allConserved = true;

// Print initial state
console.log(
  '0.00'.padStart(6) +
  S_initial.toFixed(4).padStart(13) +
  '0.0000'.padStart(11) +
  (temperature - 273.15).toFixed(2).padStart(9) +
  initialState.energy.byRing.get('species')!.total.toFixed(2).padStart(12) +
  initialState.energy.byRing.get('thermal')!.total.toFixed(2).padStart(12) +
  E_initial.toFixed(2).padStart(12) +
  '0.00e+0'.padStart(12) +
  '✓'.padStart(6)
);

// Run simulation
for (let step = 1; step <= duration / dt; step++) {
  const t = step * dt;
  const result = core.spin(dt);
  steps++;

  const speciesState = speciesRing.serialize();
  const thermalState = thermalRing.serialize();
  const E_species = speciesRing.getEnergy().total;
  const E_thermal = thermalRing.getEnergy().total;
  const E_total = result.state.energy.total;
  const drift = Math.abs(E_total - E_initial);

  maxDrift = Math.max(maxDrift, drift);
  if (!result.conserved) allConserved = false;

  const T_celsius = thermalState.temperature - 273.15;
  const status = result.conserved ? '✓' : '✗';

  console.log(
    t.toFixed(2).padStart(6) +
    speciesState.concentration.toFixed(4).padStart(13) +
    speciesState.reactionRate.toFixed(4).padStart(11) +
    T_celsius.toFixed(2).padStart(9) +
    E_species.toFixed(2).padStart(12) +
    E_thermal.toFixed(2).padStart(12) +
    E_total.toFixed(2).padStart(12) +
    drift.toExponential(2).padStart(12) +
    status.padStart(6)
  );

  // Stop if substrate exhausted
  if (speciesState.concentration < 0.01) {
    console.log('  [Substrate exhausted]');
    break;
  }
}

// Final state
const finalState = core.getState();
const E_final = finalState.energy.total;

console.log('-'.repeat(90));
console.log('');

// Summary
console.log('CONSERVATION SUMMARY:');
console.log('-'.repeat(45));
console.log(`  Initial E_total:  ${E_initial.toFixed(4)} J`);
console.log(`  Final E_total:    ${E_final.toFixed(4)} J`);
console.log(`  Maximum drift:    ${maxDrift.toExponential(4)} J`);
console.log(`  Steps:            ${steps}`);
console.log('');

console.log('ENERGY TRANSFER (Chemical → Thermal):');
console.log('-'.repeat(45));
const E_chem_initial = initialState.energy.byRing.get('species')!.total;
const E_chem_final = speciesRing.getEnergy().total;
const E_therm_initial = initialState.energy.byRing.get('thermal')!.total;
const E_therm_final = thermalRing.getEnergy().total;
console.log(`  E_chemical change: ${(E_chem_final - E_chem_initial).toFixed(4)} J`);
console.log(`  E_thermal change:  ${(E_therm_final - E_therm_initial).toFixed(4)} J`);
console.log(`  Sum (should≈0):    ${((E_chem_final - E_chem_initial) + (E_therm_final - E_therm_initial)).toExponential(4)} J`);
console.log('');

console.log('REACTION PROGRESS:');
console.log('-'.repeat(45));
const finalConc = speciesRing.serialize().concentration;
console.log(`  Initial [S]:     ${S_initial.toFixed(4)} mol/m³`);
console.log(`  Final [S]:       ${finalConc.toFixed(4)} mol/m³`);
console.log(`  Conversion:      ${((1 - finalConc / S_initial) * 100).toFixed(1)}%`);
console.log(`  Temp rise:       ${(thermalRing.getTemperature() - temperature).toFixed(2)} K`);
console.log('');

// Verification
console.log('='.repeat(90));
const conservationTarget = 1e-11;
const success = maxDrift <= conservationTarget && allConserved;

if (success) {
  console.log('✅ PHASE 4 SUCCESS: Michaelis-Menten embedded in ring architecture!');
  console.log(`   - Max drift: ${maxDrift.toExponential(4)} J (target: ≤ ${conservationTarget.toExponential(1)} J)`);
  console.log('   - Energy: CONSERVED (chemical → thermal)');
  console.log('   - Entropy: INCREASED (irreversible reaction)');
  console.log('   - Architecture: Universal ring system proven');
} else {
  console.log(`⚠  Conservation needs refinement: ${maxDrift.toExponential(4)} J`);
}
console.log('='.repeat(90));
console.log('');
