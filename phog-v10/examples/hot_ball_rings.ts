/**
 * PHOG V10 - Phase 4: Hot Ball Falling (Ring Architecture)
 *
 * Same physics as Phase 3, but using the Saturn Ring architecture.
 * Demonstrates that the universal kernel achieves same conservation.
 *
 * Architecture:
 *   ConservationCore (the "planet")
 *   ├─ MomentumRing (ball mechanics)
 *   ├─ ThermalRing (ball temperature)
 *   └─ Friction Coupling (momentum → thermal)
 *
 * Conservation target: ≤ 1e-11 J (within 10x of Phase 3's 3.6e-12 J)
 */

import { ConservationCore } from '../src/core/ConservationCore.js';
import { MomentumRing } from '../src/rings/MomentumRing.js';
import { ThermalRing } from '../src/rings/ThermalRing.js';

console.log('');
console.log('='.repeat(85));
console.log('PHOG V10 - Phase 4: Hot Ball Falling (Saturn Ring Architecture)');
console.log('='.repeat(85));
console.log('');
console.log('Architecture: ConservationCore + MomentumRing + ThermalRing + Friction Coupling');
console.log('');

// Create the conservation core
const core = new ConservationCore();

// Create rings
const momentumRing = new MomentumRing();
const thermalRing = new ThermalRing();

// Initialize rings with same parameters as Phase 3
const g = 9.8;
const mass = 0.1;         // 100g
const height = 10;        // 10m
const velocity = 0;       // at rest
const temperature = 373.15; // 100°C
const cp = 500;           // J/(kg·K)
const frictionCoeff = 0.5;

momentumRing.init(height, velocity, mass, g);
momentumRing.setFriction(frictionCoeff);
thermalRing.init(temperature, cp, mass);

// Register rings with core
core.registerRing(momentumRing);
core.registerRing(thermalRing);

// Register friction coupling
core.registerCoupling({
  sourceId: 'momentum',
  targetId: 'thermal',
  name: 'friction',
  compute: (source, _target, dt) => {
    // Energy dissipated = μ·v²·dt
    const v = source.getKinematicState().velocity;
    const power = frictionCoeff * v * v;
    return power * dt;
  }
});

console.log('Initial Conditions:');
console.log(`  Height:      ${height} m`);
console.log(`  Velocity:    ${velocity} m/s`);
console.log(`  Mass:        ${mass} kg`);
console.log(`  Temperature: ${temperature - 273.15} °C`);
console.log(`  Friction:    μ = ${frictionCoeff}`);
console.log('');

// Get initial energy
const initialState = core.getState();
const E_initial = initialState.energy.total;

console.log('Initial Energy Budget:');
console.log(`  E_momentum:  ${initialState.energy.byRing.get('momentum')?.total.toFixed(4)} J`);
console.log(`  E_thermal:   ${initialState.energy.byRing.get('thermal')?.total.toFixed(4)} J`);
console.log(`  E_total:     ${E_initial.toFixed(4)} J`);
console.log('');

// Simulation parameters
const dt = 0.1;
const duration = 2.0;

// Output header
console.log('-'.repeat(85));
console.log(
  't(s)'.padStart(6) +
  'y(m)'.padStart(10) +
  'v(m/s)'.padStart(10) +
  'T(°C)'.padStart(10) +
  'E_mom(J)'.padStart(12) +
  'E_therm(J)'.padStart(12) +
  'E_total(J)'.padStart(12) +
  'Drift(J)'.padStart(12) +
  'OK'.padStart(6)
);
console.log('-'.repeat(85));

// Track results
let maxDrift = 0;
let steps = 0;
let allConserved = true;

// Run simulation
for (let t = 0; t <= duration; t += dt) {
  const result = core.spin(dt, { g });
  steps++;

  const momState = momentumRing.serialize();
  const thermState = thermalRing.serialize();
  const E_mom = momentumRing.getEnergy().total;
  const E_therm = thermalRing.getEnergy().total;
  const E_total = result.state.energy.total;
  const drift = Math.abs(E_total - E_initial);

  maxDrift = Math.max(maxDrift, drift);
  if (!result.conserved) allConserved = false;

  const T_celsius = thermState.temperature - 273.15;
  const status = result.conserved ? '✓' : '✗';

  console.log(
    t.toFixed(2).padStart(6) +
    momState.position.toFixed(4).padStart(10) +
    momState.velocity.toFixed(4).padStart(10) +
    T_celsius.toFixed(2).padStart(10) +
    E_mom.toFixed(4).padStart(12) +
    E_therm.toFixed(4).padStart(12) +
    E_total.toFixed(4).padStart(12) +
    drift.toExponential(2).padStart(12) +
    status.padStart(6)
  );

  // Stop if ball hits ground
  if (momState.position <= 0) {
    console.log('  [Ball hit ground]');
    break;
  }
}

// Final state
const finalState = core.getState();
const E_final = finalState.energy.total;

console.log('-'.repeat(85));
console.log('');

// Summary
console.log('CONSERVATION SUMMARY:');
console.log('-'.repeat(45));
console.log(`  Initial E_total:  ${E_initial.toFixed(6)} J`);
console.log(`  Final E_total:    ${E_final.toFixed(6)} J`);
console.log(`  Maximum drift:    ${maxDrift.toExponential(4)} J`);
console.log(`  Steps:            ${steps}`);
console.log('');

console.log('ENERGY TRANSFER (Momentum → Thermal):');
console.log('-'.repeat(45));
const E_mom_initial = 0.5 * mass * velocity * velocity + mass * g * height;
const E_mom_final = momentumRing.getEnergy().total;
const E_therm_initial = mass * cp * temperature;
const E_therm_final = thermalRing.getEnergy().total;
console.log(`  E_momentum change: ${(E_mom_final - E_mom_initial).toFixed(4)} J`);
console.log(`  E_thermal change:  ${(E_therm_final - E_therm_initial).toFixed(4)} J`);
console.log('');

console.log('ENTROPY SUMMARY:');
console.log('-'.repeat(45));
const entropy = core.getTotalEntropy();
console.log(`  Total entropy:     ${entropy.total.toFixed(6)} J/K`);
console.log(`  Irreversible:      ${entropy.irreversible.toFixed(6)} J/K`);
console.log('');

// Verification
console.log('='.repeat(85));
const conservationTarget = 1e-11;  // Within 10x of Phase 3
const success = maxDrift <= conservationTarget && allConserved;

if (success) {
  console.log('✅ PHASE 4 SUCCESS: Saturn Ring Architecture with certified conservation!');
  console.log(`   - Max drift: ${maxDrift.toExponential(4)} J (target: ≤ ${conservationTarget.toExponential(1)} J)`);
  console.log('   - Energy: CONSERVED via universal kernel');
  console.log('   - Architecture: ANY physics can plug in as a ring');
} else {
  console.log(`⚠  Conservation target not met: ${maxDrift.toExponential(4)} J > ${conservationTarget.toExponential(1)} J`);
  console.log('   The ring architecture needs refinement.');
}
console.log('='.repeat(85));
console.log('');

// Phase 3 comparison
console.log('PHASE 3 vs PHASE 4 COMPARISON:');
console.log('-'.repeat(45));
console.log('  Phase 3 (CouplingManager): ~3.6e-12 J drift');
console.log(`  Phase 4 (Ring Architecture): ${maxDrift.toExponential(2)} J drift`);
console.log('');
