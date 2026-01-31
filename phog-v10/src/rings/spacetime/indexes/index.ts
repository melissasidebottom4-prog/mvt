/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure
 *
 * index.ts - Export all spacetime index components
 */

// Constants and coordinate conventions
export {
  GR_CONSTANTS,
  COORD,
  COORD_NAMES,
  METRIC_SIGNATURE,
  schwarzschildRadius,
  isValidRadius,
  metricFunction,
  metricFunctionDerivative,
  symmetricIndex,
  indexToCoords,
  SYMMETRIC_COMPONENTS,
  CHRISTOFFEL_COMPONENTS,
  isValidCoordIndex,
  assertValidIndices
} from './Constants.js';

export type { CoordIndex } from './Constants.js';

// Symmetry index handling
export {
  toCanonical,
  christoffelLinearIndex,
  linearToChristoffel,
  buildSymmetryGroups,
  SYMMETRY_GROUPS,
  INDEX_LOOKUP,
  getLinearIndex,
  verifySymmetry,
  findSymmetryViolations,
  formatChristoffelIndex,
  printChristoffelComponents,
  countNonZero
} from './SymmetryIndex.js';

export type { CanonicalChristoffelIndex, SymmetryGroup } from './SymmetryIndex.js';

// Sparsity pattern for Schwarzschild
export {
  SCHWARZSCHILD_NONZERO,
  NONZERO_INDICES,
  isNonZero,
  SPARSITY_PATTERN,
  getSparsityRatio,
  printSparsityStats,
  computeChristoffel,
  computeChristoffelSparse,
  getChristoffel,
  verifySparsity,
  findSparsityViolations,
  printNonZeroComponents,
  printChristoffelAt
} from './SparsityIndex.js';

export type { NonZeroChristoffel } from './SparsityIndex.js';

// Unit test reference values
export {
  TEST_POINT,
  EXACT_VALUES,
  runChristoffelTests,
  printTestResults,
  runAllTests,
  testSymmetry,
  testSparsity,
  testPhotonSphereProperties,
  runTestSuite,
  printTestSuiteResults
} from './UnitTestIndex.js';

export type { ExactChristoffelValue, TestResult, TestSuiteResult } from './UnitTestIndex.js';
