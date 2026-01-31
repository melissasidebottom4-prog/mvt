/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure Tests
 *
 * Comprehensive test suite for GR index infrastructure
 */

import {
  // Constants
  GR_CONSTANTS,
  COORD,
  COORD_NAMES,
  METRIC_SIGNATURE,
  schwarzschildRadius,
  isValidRadius,
  metricFunction,
  metricFunctionDerivative,
  SYMMETRIC_COMPONENTS,
  CHRISTOFFEL_COMPONENTS,

  // Symmetry
  christoffelLinearIndex,
  linearToChristoffel,
  SYMMETRY_GROUPS,
  INDEX_LOOKUP,
  verifySymmetry,
  formatChristoffelIndex,
  countNonZero,

  // Sparsity
  SCHWARZSCHILD_NONZERO,
  NONZERO_INDICES,
  isNonZero,
  getSparsityRatio,
  printSparsityStats,
  computeChristoffel,
  verifySparsity,
  printNonZeroComponents,
  printChristoffelAt,

  // Unit tests
  TEST_POINT,
  EXACT_VALUES,
  runTestSuite,
  printTestSuiteResults,
  testPhotonSphereProperties
} from '../src/rings/spacetime/indexes/index.js';

console.log('\n' + '═'.repeat(70));
console.log('PHOG V10 - PHASE 12: SPACETIME INDEX INFRASTRUCTURE TESTS');
console.log('═'.repeat(70));

// ================================================================
// TEST 1: Constants Module
// ================================================================

console.log('\n1. CONSTANTS MODULE');
console.log('─'.repeat(70));

console.log('\nGR Constants:');
console.log(`  Speed of light: c = ${GR_CONSTANTS.c} m/s`);
console.log(`  Gravitational constant: G = ${GR_CONSTANTS.G} m³/(kg·s²)`);
console.log(`  Solar mass: M_sun = ${GR_CONSTANTS.M_sun.toExponential(5)} kg`);
console.log(`  Solar Schwarzschild radius: r_s = ${GR_CONSTANTS.r_s_sun.toFixed(2)} m`);

console.log('\nCoordinate Convention (t, r, θ, φ):');
console.log(`  COORD.t = ${COORD.t}`);
console.log(`  COORD.r = ${COORD.r}`);
console.log(`  COORD.theta = ${COORD.theta}`);
console.log(`  COORD.phi = ${COORD.phi}`);

console.log('\nMetric Signature (-,+,+,+):');
console.log(`  ${METRIC_SIGNATURE.join(', ')}`);

// Test Schwarzschild radius calculation
const M_test = GR_CONSTANTS.M_sun;
const r_s_calc = schwarzschildRadius(M_test);
const r_s_diff = Math.abs(r_s_calc - GR_CONSTANTS.r_s_sun);
console.log(`\nSchwarzschild Radius Test:`);
console.log(`  Calculated: ${r_s_calc.toFixed(2)} m`);
console.log(`  Expected: ${GR_CONSTANTS.r_s_sun.toFixed(2)} m`);
console.log(`  Difference: ${r_s_diff.toExponential(2)} m`);
console.log(`  ✓ PASS: ${r_s_diff < 1 ? 'Yes' : 'No'}`);

// Test metric function
const r_test = 3 * (GR_CONSTANTS.r_s_sun / 2);  // r = 3M
const f_test = metricFunction(r_test, GR_CONSTANTS.r_s_sun);
console.log(`\nMetric Function f(r) = 1 - r_s/r:`);
console.log(`  At r = 3M: f = ${f_test.toFixed(6)} (expected: 0.333333)`);
console.log(`  ✓ PASS: ${Math.abs(f_test - 1/3) < 1e-10 ? 'Yes' : 'No'}`);

// ================================================================
// TEST 2: Symmetry Index Module
// ================================================================

console.log('\n2. SYMMETRY INDEX MODULE');
console.log('─'.repeat(70));

console.log(`\nSymmetric tensor components: ${SYMMETRIC_COMPONENTS}`);
console.log(`Total Christoffel components: ${CHRISTOFFEL_COMPONENTS}`);
console.log(`Symmetry groups: ${SYMMETRY_GROUPS.length}`);

// Test linear index conversion
console.log('\nLinear Index Tests:');
const testIndices: [number, number, number][] = [
  [0, 0, 0],
  [0, 0, 1],
  [1, 0, 0],
  [1, 2, 2],
  [3, 2, 3]
];

for (const [l, m, n] of testIndices) {
  const idx = christoffelLinearIndex(l as any, m as any, n as any);
  const back = linearToChristoffel(idx);
  const roundTrip = back.lambda === l &&
    ((back.mu === m && back.nu === n) || (back.mu === n && back.nu === m));
  console.log(`  Γ^${l}_${m}${n} → idx=${idx} → Γ^${back.lambda}_${back.mu}${back.nu} ${roundTrip ? '✓' : '✗'}`);
}

// Verify INDEX_LOOKUP table
console.log('\nINDEX_LOOKUP Table Verification:');
let lookupErrors = 0;
for (let l = 0; l < 4; l++) {
  for (let m = 0; m < 4; m++) {
    for (let n = 0; n < 4; n++) {
      const fromLookup = INDEX_LOOKUP[l][m][n];
      const computed = christoffelLinearIndex(l as any, m as any, n as any);
      if (fromLookup !== computed) lookupErrors++;
    }
  }
}
console.log(`  Errors: ${lookupErrors}/64`);
console.log(`  ✓ PASS: ${lookupErrors === 0 ? 'Yes' : 'No'}`);

// ================================================================
// TEST 3: Sparsity Index Module
// ================================================================

console.log('\n3. SPARSITY INDEX MODULE');
console.log('─'.repeat(70));

printSparsityStats();

console.log('\nNon-zero Christoffel Symbols:');
printNonZeroComponents();

console.log(`\nSparsity ratio: ${(getSparsityRatio() * 100).toFixed(1)}% non-zero`);
console.log(`Storage: ${NONZERO_INDICES.size} values vs ${CHRISTOFFEL_COMPONENTS} total`);

// Test isNonZero function
console.log('\nisNonZero() Tests:');
const nonZeroTests: [number, number, number, boolean][] = [
  [0, 0, 1, true],   // Γ^t_tr
  [1, 0, 0, true],   // Γ^r_tt
  [1, 1, 1, true],   // Γ^r_rr
  [0, 0, 0, false],  // Γ^t_tt (zero)
  [0, 1, 1, false],  // Γ^t_rr (zero)
  [2, 2, 2, false]   // Γ^θ_θθ (zero)
];

for (const [l, m, n, expected] of nonZeroTests) {
  const result = isNonZero(l as any, m as any, n as any);
  const status = result === expected ? '✓' : '✗';
  console.log(`  ${formatChristoffelIndex(l as any, m as any, n as any)} is ${result ? 'non-zero' : 'zero'} ${status}`);
}

// ================================================================
// TEST 4: Christoffel Computation
// ================================================================

console.log('\n4. CHRISTOFFEL COMPUTATION');
console.log('─'.repeat(70));

const { r, r_s, theta } = TEST_POINT;
console.log(`\nTest Point: r=${r} (3M), θ=π/2, r_s=${r_s}`);
printChristoffelAt(r, r_s, theta);

// Compute and verify sparsity
const gamma = computeChristoffel(r, r_s, theta);
const nonZeroCount = countNonZero(gamma);
console.log(`\nComputed array: ${nonZeroCount} non-zero values`);
console.log(`Sparsity verified: ${verifySparsity(gamma) ? '✓ Yes' : '✗ No'}`);
console.log(`Symmetry verified: ${verifySymmetry(gamma) ? '✓ Yes' : '✗ No'}`);

// ================================================================
// TEST 5: Unit Test Suite
// ================================================================

console.log('\n5. UNIT TEST SUITE');
console.log('─'.repeat(70));

const suite = runTestSuite();
printTestSuiteResults(suite);

// ================================================================
// TEST 6: Physical Interpretation
// ================================================================

console.log('\n6. PHYSICAL INTERPRETATION');
console.log('─'.repeat(70));
testPhotonSphereProperties();

// ================================================================
// FINAL SUMMARY
// ================================================================

console.log('\n' + '═'.repeat(70));
console.log('PHASE 12 INDEX INFRASTRUCTURE: FINAL SUMMARY');
console.log('═'.repeat(70));

const allPassed = suite.allPassed && lookupErrors === 0;

console.log(`
  Constants Module:     ✓ Loaded
  Symmetry Index:       ✓ ${SYMMETRY_GROUPS.length} groups
  Sparsity Pattern:     ✓ ${NONZERO_INDICES.size} non-zero components
  Unit Tests:           ${suite.summary.passed}/${suite.summary.total} passed

  Overall Status: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}
`);

if (allPassed) {
  console.log('═'.repeat(70));
  console.log('✅ Phase 12 Foundation Complete - Ready for Schwarzschild Geodesics');
  console.log('═'.repeat(70));
} else {
  console.log('═'.repeat(70));
  console.log('❌ Some tests failed - review output above');
  console.log('═'.repeat(70));
  process.exit(1);
}
