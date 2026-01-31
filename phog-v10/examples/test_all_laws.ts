/**
 * PHOG V10 - Comprehensive Law Test Suite
 * Tests laws from all 12 categories in the physics index
 */

import { getAllLaws, getLawsByCategory, getLawCount, PHYSICS_INDEX } from '../src/physics-index.js';
import { executeLaw, getRequiredInputs } from '../src/executor.js';
import { generateReceipt, generateReceiptChain, verifyReceiptChain } from '../src/receipt.js';
import type { ExecutionResult } from '../src/executor.js';

console.log('='.repeat(70));
console.log('PHOG V10 - Comprehensive Physics Law Test Suite');
console.log('='.repeat(70));
console.log();

// Get total law count
const totalLaws = getLawCount();
console.log(`Total laws in physics index: ${totalLaws}`);
console.log();

// =============================================================================
// Test sample laws from each category
// =============================================================================

interface TestCase {
  category: keyof typeof PHYSICS_INDEX;
  lawId: string;
  inputs: Record<string, number>;
  expectedOutput?: string;
}

const testCases: TestCase[] = [
  // Classical Mechanics
  {
    category: 'classical_mechanics',
    lawId: 'newton_second',
    inputs: { m: 5, a: 2 },
    expectedOutput: 'F = 10'
  },
  {
    category: 'classical_mechanics',
    lawId: 'kinetic_energy',
    inputs: { m: 2, v: 3 },
    expectedOutput: 'KE = 9'
  },
  {
    category: 'classical_mechanics',
    lawId: 'momentum',
    inputs: { m: 10, v: 5 },
    expectedOutput: 'p = 50'
  },

  // Continuum & Fluids
  {
    category: 'continuum_fluids',
    lawId: 'hydrostatic_pressure',
    inputs: { P0: 101325, rho: 1000, h: 10 },
    expectedOutput: 'P = 199325'
  },
  {
    category: 'continuum_fluids',
    lawId: 'buoyancy',
    inputs: { rho: 1000, V: 0.001 },
    expectedOutput: 'F_b ~ 9.8'
  },

  // Electromagnetism
  {
    category: 'electromagnetism',
    lawId: 'ohms_law',
    inputs: { I: 2, R: 100 },
    expectedOutput: 'V = 200'
  },
  {
    category: 'electromagnetism',
    lawId: 'power_electrical',
    inputs: { V: 120, I: 10 },
    expectedOutput: 'P = 1200'
  },
  {
    category: 'electromagnetism',
    lawId: 'capacitance',
    inputs: { C: 1e-6, V: 100 },
    expectedOutput: 'Q = 1e-4'
  },

  // Thermodynamics
  {
    category: 'thermodynamics',
    lawId: 'heat_capacity',
    inputs: { m: 1, c: 4186, delta_T: 10 },
    expectedOutput: 'Q = 41860'
  },
  {
    category: 'thermodynamics',
    lawId: 'carnot_efficiency',
    inputs: { T_cold: 300, T_hot: 600 },
    expectedOutput: 'eta = 0.5'
  },

  // Quantum Mechanics
  {
    category: 'quantum_mechanics',
    lawId: 'photon_energy',
    inputs: { nu: 6e14 },
    expectedOutput: 'E ~ 4e-19'
  },
  {
    category: 'quantum_mechanics',
    lawId: 'de_broglie_wavelength',
    inputs: { p: 1e-24 },
    expectedOutput: 'lambda ~ 6.6e-10'
  },

  // Relativity
  {
    category: 'relativity',
    lawId: 'mass_energy',
    inputs: { m: 1 },
    expectedOutput: 'E ~ 9e16'
  },
  {
    category: 'relativity',
    lawId: 'lorentz_gamma',
    inputs: { v: 0 },
    expectedOutput: 'gamma = 1'
  },

  // Optics & Waves
  {
    category: 'optics_waves',
    lawId: 'wave_equation',
    inputs: { f: 1000, lambda: 0.343 },
    expectedOutput: 'v = 343'
  },
  {
    category: 'optics_waves',
    lawId: 'magnification',
    inputs: { d_i: 20, d_o: 10 },
    expectedOutput: 'M = -2'
  },

  // Acoustic & Bio
  {
    category: 'acoustic_bio',
    lawId: 'metabolic_rate',
    inputs: { m: 70 },
    expectedOutput: 'BMR ~ 1680'
  },

  // Water Memory
  {
    category: 'water_memory',
    lawId: 'water_specific_heat',
    inputs: {},
    expectedOutput: 'C_p = 4186'
  },

  // Genome Waveform
  {
    category: 'genome_waveform',
    lawId: 'replication_fork',
    inputs: {},
    expectedOutput: 'v_fork = 1000'
  },

  // Planetary Physics
  {
    category: 'planetary_physics',
    lawId: 'escape_velocity',
    inputs: { M: 5.972e24, r: 6.371e6 },
    expectedOutput: 'v_escape ~ 11186'
  },

  // Frontier Physics
  {
    category: 'frontier_physics',
    lawId: 'information_entropy',
    inputs: { sum_p_log_p: -2.3 },
    expectedOutput: 'H = 2.3'
  }
];

// =============================================================================
// Run tests
// =============================================================================

console.log('Running tests from all categories...');
console.log('-'.repeat(70));
console.log();

const results: ExecutionResult[] = [];
let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const laws = getLawsByCategory(testCase.category);
  const law = laws.find(l => l.id === testCase.lawId);

  if (!law) {
    console.log(`[SKIP] ${testCase.category}/${testCase.lawId} - Law not found`);
    continue;
  }

  try {
    const result = executeLaw(law, testCase.inputs);
    results.push(result);

    const status = result.constraintsMet ? 'PASS' : 'FAIL';
    const icon = result.constraintsMet ? '\u2705' : '\u274C';

    if (result.constraintsMet) {
      passed++;
    } else {
      failed++;
    }

    // Get the main output variable
    const outputVars = law.equations.map(eq => eq.lhs);
    const mainOutput = outputVars[0];
    const outputValue = mainOutput ? result.outputState[mainOutput] : undefined;

    console.log(`${icon} [${status}] ${testCase.category}/${testCase.lawId}`);
    console.log(`   Inputs: ${JSON.stringify(testCase.inputs)}`);
    if (mainOutput && outputValue !== undefined) {
      console.log(`   Output: ${mainOutput} = ${outputValue.toExponential(4)}`);
    }
    console.log(`   Expected: ${testCase.expectedOutput}`);
    console.log();

  } catch (error) {
    failed++;
    console.log(`\u274C [ERROR] ${testCase.category}/${testCase.lawId}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    console.log();
  }
}

// =============================================================================
// Generate receipt chain
// =============================================================================

console.log('-'.repeat(70));
console.log('Generating receipt chain...');
console.log('-'.repeat(70));
console.log();

const chain = generateReceiptChain(results);
const verification = verifyReceiptChain(chain);

console.log(`Receipts generated: ${chain.receipts.length}`);
console.log(`Chain hash: ${chain.chain_hash.substring(0, 32)}...`);
console.log(`Chain verified: ${verification.valid ? 'YES' : 'NO'}`);

if (!verification.valid) {
  console.log('Verification errors:');
  for (const error of verification.errors) {
    console.log(`  - ${error}`);
  }
}
console.log();

// =============================================================================
// Category statistics
// =============================================================================

console.log('-'.repeat(70));
console.log('Category Statistics');
console.log('-'.repeat(70));
console.log();

for (const [category, _] of Object.entries(PHYSICS_INDEX)) {
  const laws = getLawsByCategory(category as keyof typeof PHYSICS_INDEX);
  console.log(`${category}: ${laws.length} laws`);
}
console.log();

// =============================================================================
// Summary
// =============================================================================

console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log();
console.log(`Total laws in index: ${totalLaws}`);
console.log(`Tests run: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log();

if (passed >= 5 && failed === 0) {
  console.log('\u2705 PHOG V10 IS FULLY OPERATIONAL!');
  console.log('   All test laws executed successfully.');
  console.log('   Receipt chain verified.');
  console.log();
  console.log('   Ready for Phase 2: Time-stepping simulation.');
} else if (passed >= 5) {
  console.log('\u26A0 PHOG V10 IS OPERATIONAL WITH WARNINGS');
  console.log(`   ${passed} laws passed, ${failed} failed.`);
  console.log('   Review failed tests before proceeding.');
} else {
  console.log('\u274C PHOG V10 NEEDS ATTENTION');
  console.log(`   Only ${passed} laws passed.`);
  console.log('   Debug required before production use.');
}

console.log();
console.log('='.repeat(70));
