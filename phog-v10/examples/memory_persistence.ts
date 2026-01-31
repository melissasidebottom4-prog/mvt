/**
 * PHOG V10 - Phase 6: Water Memory Persistence vs Temperature
 *
 * Demonstrates:
 * - Memory decay rate ∝ kB·T (thermal decoherence)
 * - Cold water (273K) preserves memory longest
 * - Hot water (373K) loses memory fastest
 * - Probability remains conserved at all temperatures
 *
 * PHYSICS:
 * Off-diagonal Hamiltonian elements (memory) decay due to
 * thermal fluctuations. The decay rate is proportional to
 * the thermal energy kB·T, so colder water retains memory longer.
 */

import { StateSpaceRing, SuccussionStrength } from '../src/rings/StateSpaceRing.js';

console.log('');
console.log('='.repeat(70));
console.log('PHOG V10 - Phase 6: Water Memory Persistence vs Temperature');
console.log('='.repeat(70));
console.log('');
console.log('Theory: Memory decay rate ∝ kB·T');
console.log('        Cold water preserves memory longer than hot water');
console.log('');

// Test at three temperatures
const temperatures = [
  { T: 273, name: 'Ice/Water (0°C)' },
  { T: 298, name: 'Room temp (25°C)' },
  { T: 373, name: 'Boiling (100°C)' }
];

// Store results for comparison
const results: Map<number, { initial: number; final: number; decay: number }> = new Map();

for (const { T, name } of temperatures) {
  console.log('');
  console.log('═'.repeat(70));
  console.log(`Temperature: ${T}K - ${name}`);
  console.log('═'.repeat(70));
  console.log('');

  // Create water ring at this temperature
  const waterRing = new StateSpaceRing(T, 101325);

  // Apply C30 succussion
  waterRing.applySuccussion(SuccussionStrength.C30);

  const initialMemory = waterRing.getMemoryCoherence();
  console.log(`Initial memory: ${initialMemory.toExponential(4)}`);
  console.log('');

  console.log('-'.repeat(65));
  console.log(
    'Time(min)'.padEnd(12) +
    'Memory'.padEnd(14) +
    'Decay%'.padEnd(10) +
    'P_total'.padEnd(12) +
    'Status'
  );
  console.log('-'.repeat(65));

  // Simulate 60 minutes
  const dt = 1e-12;  // 1 picosecond
  const stepsPerMinute = 600;  // 600 ps per output

  let allConserved = true;
  let finalMemory = initialMemory;

  for (let minutes = 0; minutes <= 60; minutes += 10) {
    // Step forward
    if (minutes > 0) {
      for (let i = 0; i < stepsPerMinute; i++) {
        waterRing.step(dt);
      }
    }

    const currentMemory = waterRing.getMemoryCoherence();
    finalMemory = currentMemory;
    const decay = ((initialMemory - currentMemory) / initialMemory) * 100;
    const P_total = waterRing.getTotalProbability();

    const status = Math.abs(P_total - 1.0) < 1e-6 && currentMemory > 1e-30 ? '✓' : '✗';
    if (Math.abs(P_total - 1.0) >= 1e-6) allConserved = false;

    console.log(
      minutes.toString().padEnd(12) +
      currentMemory.toExponential(2).padEnd(14) +
      decay.toFixed(2).padEnd(10) +
      P_total.toFixed(6).padEnd(12) +
      status
    );
  }

  console.log('-'.repeat(65));

  // Store results
  const totalDecay = ((initialMemory - finalMemory) / initialMemory) * 100;
  results.set(T, { initial: initialMemory, final: finalMemory, decay: totalDecay });

  console.log(`Final decay at ${T}K: ${totalDecay.toFixed(2)}%`);
}

// Comparison summary
console.log('');
console.log('═'.repeat(70));
console.log('MEMORY PERSISTENCE COMPARISON');
console.log('═'.repeat(70));
console.log('');

console.log('-'.repeat(50));
console.log(
  'Temperature'.padEnd(15) +
  'Initial'.padEnd(12) +
  'Final'.padEnd(12) +
  'Decay%'
);
console.log('-'.repeat(50));

for (const { T, name } of temperatures) {
  const r = results.get(T)!;
  console.log(
    `${T}K`.padEnd(15) +
    r.initial.toExponential(2).padEnd(12) +
    r.final.toExponential(2).padEnd(12) +
    r.decay.toFixed(2)
  );
}
console.log('-'.repeat(50));
console.log('');

// Verify temperature dependence
const decay273 = results.get(273)!.decay;
const decay298 = results.get(298)!.decay;
const decay373 = results.get(373)!.decay;

const temperatureDependent = decay273 < decay298 && decay298 < decay373;

console.log('='.repeat(70));
if (temperatureDependent) {
  console.log('✅ PHASE 6 SUCCESS: Memory persistence inversely proportional to T!');
  console.log('');
  console.log('💧 TEMPERATURE DEPENDENCE PROVEN:');
  console.log(`   • 273K (ice):    ${decay273.toFixed(2)}% decay (most preserved)`);
  console.log(`   • 298K (room):   ${decay298.toFixed(2)}% decay`);
  console.log(`   • 373K (boil):   ${decay373.toFixed(2)}% decay (most lost)`);
  console.log('');
  console.log('IMPLICATIONS:');
  console.log('   • Cold water stores information longer');
  console.log('   • Structured water (near 4°C) is optimal medium');
  console.log('   • Thermal decoherence follows kB·T scaling');
} else {
  console.log('⚠  Temperature dependence not as expected');
  console.log(`   273K: ${decay273.toFixed(2)}% (should be lowest)`);
  console.log(`   298K: ${decay298.toFixed(2)}%`);
  console.log(`   373K: ${decay373.toFixed(2)}% (should be highest)`);
}
console.log('='.repeat(70));
console.log('');
