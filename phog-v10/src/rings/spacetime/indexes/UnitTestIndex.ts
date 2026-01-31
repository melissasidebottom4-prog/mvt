/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure
 *
 * UnitTestIndex.ts - Known exact values for unit testing
 *
 * Reference point: r = 3M (photon sphere), θ = π/2 (equatorial plane)
 *
 * At r = 3M = 3r_s/2:
 *   f(r) = 1 - r_s/r = 1 - 2/3 = 1/3
 *   f'(r) = r_s/r² = (2M)/(9M²) = 2/(9M)
 *
 * These exact fractions allow precision testing.
 */

import { COORD } from './Constants.js';
import {
  christoffelLinearIndex,
  formatChristoffelIndex
} from './SymmetryIndex.js';
import {
  computeChristoffel,
  SCHWARZSCHILD_NONZERO
} from './SparsityIndex.js';

// ================================================================
// REFERENCE POINT PARAMETERS
// ================================================================

/**
 * Reference point for unit testing
 *
 * r = 3M (photon sphere)
 * θ = π/2 (equatorial plane)
 *
 * Using M = 1 (geometric units where r_s = 2M = 2)
 */
export const TEST_POINT = {
  /** Mass parameter (geometric units) */
  M: 1,

  /** Schwarzschild radius: r_s = 2M */
  r_s: 2,

  /** Radial coordinate: r = 3M = 1.5 * r_s */
  r: 3,

  /** Polar angle: equatorial plane */
  theta: Math.PI / 2,

  /** Metric function: f = 1 - r_s/r = 1/3 */
  f: 1 / 3,

  /** Metric function derivative: f' = r_s/r² = 2/9 */
  f_prime: 2 / 9
};

// ================================================================
// EXACT CHRISTOFFEL VALUES AT r = 3M, θ = π/2
// ================================================================

/**
 * At r = 3M, θ = π/2, with r_s = 2:
 *
 * f = 1/3
 * f' = r_s/r² = 2/9
 * sin(π/2) = 1
 * cos(π/2) = 0
 * cot(π/2) = 0
 *
 * Exact values:
 *   Γ^t_tr = r_s/(2r²f) = 2/(2·9·(1/3)) = 2/6 = 1/3
 *   Γ^r_tt = r_s·f/(2r²) = 2·(1/3)/(2·9) = 1/27
 *   Γ^r_rr = -r_s/(2r²f) = -2/(2·9·(1/3)) = -1/3
 *   Γ^r_θθ = -(r - r_s) = -(3 - 2) = -1
 *   Γ^r_φφ = -(r - r_s)sin²θ = -1·1 = -1
 *   Γ^θ_rθ = 1/r = 1/3
 *   Γ^θ_φφ = -sinθ·cosθ = -1·0 = 0
 *   Γ^φ_rφ = 1/r = 1/3
 *   Γ^φ_θφ = cotθ = 0
 */
export interface ExactChristoffelValue {
  lambda: number;
  mu: number;
  nu: number;
  linearIndex: number;
  name: string;
  exact: number;
  exactFraction: string;
}

export const EXACT_VALUES: ExactChristoffelValue[] = [
  {
    lambda: COORD.t,
    mu: COORD.t,
    nu: COORD.r,
    linearIndex: christoffelLinearIndex(0, 0, 1),
    name: formatChristoffelIndex(0, 0, 1),
    exact: 1 / 3,
    exactFraction: '1/3'
  },
  {
    lambda: COORD.r,
    mu: COORD.t,
    nu: COORD.t,
    linearIndex: christoffelLinearIndex(1, 0, 0),
    name: formatChristoffelIndex(1, 0, 0),
    exact: 1 / 27,
    exactFraction: '1/27'
  },
  {
    lambda: COORD.r,
    mu: COORD.r,
    nu: COORD.r,
    linearIndex: christoffelLinearIndex(1, 1, 1),
    name: formatChristoffelIndex(1, 1, 1),
    exact: -1 / 3,
    exactFraction: '-1/3'
  },
  {
    lambda: COORD.r,
    mu: COORD.theta,
    nu: COORD.theta,
    linearIndex: christoffelLinearIndex(1, 2, 2),
    name: formatChristoffelIndex(1, 2, 2),
    exact: -1,
    exactFraction: '-1'
  },
  {
    lambda: COORD.r,
    mu: COORD.phi,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(1, 3, 3),
    name: formatChristoffelIndex(1, 3, 3),
    exact: -1,
    exactFraction: '-1'
  },
  {
    lambda: COORD.theta,
    mu: COORD.r,
    nu: COORD.theta,
    linearIndex: christoffelLinearIndex(2, 1, 2),
    name: formatChristoffelIndex(2, 1, 2),
    exact: 1 / 3,
    exactFraction: '1/3'
  },
  {
    lambda: COORD.theta,
    mu: COORD.phi,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(2, 3, 3),
    name: formatChristoffelIndex(2, 3, 3),
    exact: 0,
    exactFraction: '0'
  },
  {
    lambda: COORD.phi,
    mu: COORD.r,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(3, 1, 3),
    name: formatChristoffelIndex(3, 1, 3),
    exact: 1 / 3,
    exactFraction: '1/3'
  },
  {
    lambda: COORD.phi,
    mu: COORD.theta,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(3, 2, 3),
    name: formatChristoffelIndex(3, 2, 3),
    exact: 0,
    exactFraction: '0'
  }
];

// ================================================================
// UNIT TEST FUNCTIONS
// ================================================================

export interface TestResult {
  name: string;
  passed: boolean;
  expected: number;
  actual: number;
  error: number;
  relativeError: number | null;
}

/**
 * Run all unit tests for Christoffel symbol computation
 *
 * @param tolerance - Absolute tolerance for comparison
 * @returns Array of test results
 */
export function runChristoffelTests(tolerance: number = 1e-14): TestResult[] {
  const { r, r_s, theta } = TEST_POINT;
  const gamma = computeChristoffel(r, r_s, theta);
  const results: TestResult[] = [];

  for (const expected of EXACT_VALUES) {
    const actual = gamma[expected.linearIndex];
    const error = Math.abs(actual - expected.exact);
    const relativeError = expected.exact !== 0
      ? Math.abs(error / expected.exact)
      : null;
    const passed = error < tolerance;

    results.push({
      name: expected.name,
      passed,
      expected: expected.exact,
      actual,
      error,
      relativeError
    });
  }

  return results;
}

/**
 * Print test results in a formatted table
 */
export function printTestResults(results: TestResult[]): void {
  console.log('Christoffel Symbol Unit Tests at r=3M, θ=π/2:');
  console.log('─'.repeat(80));
  console.log(
    'Symbol'.padEnd(12) +
    'Expected'.padEnd(15) +
    'Actual'.padEnd(15) +
    'Error'.padEnd(12) +
    'Status'
  );
  console.log('─'.repeat(80));

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    console.log(
      result.name.padEnd(12) +
      result.expected.toFixed(10).padEnd(15) +
      result.actual.toFixed(10).padEnd(15) +
      result.error.toExponential(2).padEnd(12) +
      status
    );
  }

  console.log('─'.repeat(80));
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} tests passed`);
}

/**
 * Run tests and return pass/fail status
 */
export function runAllTests(tolerance: number = 1e-14): boolean {
  const results = runChristoffelTests(tolerance);
  return results.every(r => r.passed);
}

// ================================================================
// ADDITIONAL TEST CASES
// ================================================================

/**
 * Test symmetry: Γ^λ_μν = Γ^λ_νμ
 */
export function testSymmetry(tolerance: number = 1e-14): TestResult[] {
  const { r, r_s, theta } = TEST_POINT;
  const gamma = computeChristoffel(r, r_s, theta);
  const results: TestResult[] = [];

  // Test off-diagonal symmetry
  const offDiagonalPairs: [number, number, number][] = [
    [0, 0, 1],  // Γ^t_tr = Γ^t_rt
    [2, 1, 2],  // Γ^θ_rθ = Γ^θ_θr
    [3, 1, 3],  // Γ^φ_rφ = Γ^φ_φr
    [3, 2, 3]   // Γ^φ_θφ = Γ^φ_φθ
  ];

  for (const [l, m, n] of offDiagonalPairs) {
    const idx1 = christoffelLinearIndex(l as any, m as any, n as any);
    const idx2 = christoffelLinearIndex(l as any, n as any, m as any);
    const val1 = gamma[idx1];
    const val2 = gamma[idx2];
    const error = Math.abs(val1 - val2);
    const passed = error < tolerance;

    results.push({
      name: `Γ^${l}_${m}${n}=Γ^${l}_${n}${m}`,
      passed,
      expected: val1,
      actual: val2,
      error,
      relativeError: val1 !== 0 ? error / Math.abs(val1) : null
    });
  }

  return results;
}

/**
 * Test sparsity: verify that zero components are actually zero
 */
export function testSparsity(tolerance: number = 1e-20): TestResult[] {
  const { r, r_s, theta } = TEST_POINT;
  const gamma = computeChristoffel(r, r_s, theta);
  const results: TestResult[] = [];

  // Non-zero indices from EXACT_VALUES
  const nonZeroIndices = new Set(EXACT_VALUES.map(v => v.linearIndex));

  for (let i = 0; i < 40; i++) {
    if (!nonZeroIndices.has(i)) {
      const passed = Math.abs(gamma[i]) < tolerance;
      results.push({
        name: `gamma[${i}]=0`,
        passed,
        expected: 0,
        actual: gamma[i],
        error: Math.abs(gamma[i]),
        relativeError: null
      });
    }
  }

  return results;
}

// ================================================================
// PHYSICAL INTERPRETATION TESTS
// ================================================================

/**
 * Test physical properties at the photon sphere
 *
 * At r = 3M:
 * - Circular photon orbits are possible
 * - The effective potential for light has an extremum
 */
export function testPhotonSphereProperties(): void {
  const { r, r_s, f } = TEST_POINT;

  console.log('\\nPhoton Sphere Properties (r = 3M):');
  console.log('─'.repeat(50));

  // Verify r = 3M = 1.5 * r_s
  console.log(`  r/r_s = ${r / r_s} (should be 1.5)`);

  // Verify f(r) = 1/3
  console.log(`  f(r) = ${f} (should be 0.333...)`);

  // At photon sphere, gravitational time dilation factor
  const timeDilation = Math.sqrt(f);
  console.log(`  √f = ${timeDilation.toFixed(6)} (time dilation factor)`);

  // Circular orbit condition: dV_eff/dr = 0 at r = 3M for photons
  console.log(`  Circular photon orbits: ${r === 3 * (r_s / 2) ? 'Yes' : 'No'}`);
}

// ================================================================
// COMPREHENSIVE TEST SUITE
// ================================================================

export interface TestSuiteResult {
  christoffelTests: TestResult[];
  symmetryTests: TestResult[];
  sparsityTests: TestResult[];
  allPassed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * Run the complete test suite
 */
export function runTestSuite(tolerance: number = 1e-14): TestSuiteResult {
  const christoffelTests = runChristoffelTests(tolerance);
  const symmetryTests = testSymmetry(tolerance);
  const sparsityTests = testSparsity(1e-20);

  const allTests = [...christoffelTests, ...symmetryTests, ...sparsityTests];
  const passed = allTests.filter(t => t.passed).length;
  const failed = allTests.filter(t => !t.passed).length;

  return {
    christoffelTests,
    symmetryTests,
    sparsityTests,
    allPassed: failed === 0,
    summary: {
      total: allTests.length,
      passed,
      failed
    }
  };
}

/**
 * Print complete test suite results
 */
export function printTestSuiteResults(suite: TestSuiteResult): void {
  console.log('\\n' + '═'.repeat(80));
  console.log('CHRISTOFFEL SYMBOL TEST SUITE');
  console.log('═'.repeat(80));

  console.log('\\n1. EXACT VALUE TESTS (r=3M, θ=π/2):');
  printTestResults(suite.christoffelTests);

  console.log('\\n2. SYMMETRY TESTS (Γ^λ_μν = Γ^λ_νμ):');
  for (const result of suite.symmetryTests) {
    const status = result.passed ? '✓' : '✗';
    console.log(`  ${status} ${result.name}: error = ${result.error.toExponential(2)}`);
  }

  console.log('\\n3. SPARSITY TESTS (zero components):');
  const sparsityPassed = suite.sparsityTests.filter(t => t.passed).length;
  const sparsityTotal = suite.sparsityTests.length;
  console.log(`  ${sparsityPassed}/${sparsityTotal} zero components verified`);

  console.log('\\n' + '═'.repeat(80));
  console.log(`SUMMARY: ${suite.summary.passed}/${suite.summary.total} tests passed`);
  console.log(suite.allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
  console.log('═'.repeat(80));
}
