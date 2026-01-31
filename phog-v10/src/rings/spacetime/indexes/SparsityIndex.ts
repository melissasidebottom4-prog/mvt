/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure
 *
 * SparsityIndex.ts - Schwarzschild metric sparsity pattern
 *
 * The Schwarzschild metric has only 4 non-zero diagonal components,
 * leading to significant sparsity in Christoffel symbols.
 *
 * Of the 40 independent Christoffel components, only 9 are non-zero.
 */

import {
  CoordIndex,
  COORD,
  metricFunction,
  metricFunctionDerivative,
  COORD_NAMES
} from './Constants.js';
import {
  christoffelLinearIndex,
  formatChristoffelIndex,
  INDEX_LOOKUP
} from './SymmetryIndex.js';

// ================================================================
// SCHWARZSCHILD NON-ZERO CHRISTOFFEL SYMBOLS
// ================================================================

/**
 * The 9 non-zero Christoffel symbols in Schwarzschild spacetime
 *
 * With f(r) = 1 - r_s/r and f'(r) = r_s/r²:
 *
 * 1. Γ^t_tr = Γ^t_rt = f'/(2f) = r_s/(2r²f)
 * 2. Γ^r_tt = f·f'/2 = r_s·f/(2r²)
 * 3. Γ^r_rr = -f'/(2f) = -r_s/(2r²f)
 * 4. Γ^r_θθ = -(r - r_s) = -r·f
 * 5. Γ^r_φφ = -(r - r_s)sin²θ = -r·f·sin²θ
 * 6. Γ^θ_rθ = Γ^θ_θr = 1/r
 * 7. Γ^θ_φφ = -sinθ·cosθ
 * 8. Γ^φ_rφ = Γ^φ_φr = 1/r
 * 9. Γ^φ_θφ = Γ^φ_φθ = cotθ = cosθ/sinθ
 */

/**
 * Specification for a non-zero Christoffel component
 */
export interface NonZeroChristoffel {
  /** Upper index */
  lambda: CoordIndex;
  /** Lower index 1 */
  mu: CoordIndex;
  /** Lower index 2 */
  nu: CoordIndex;
  /** Linear storage index */
  linearIndex: number;
  /** Human-readable name */
  name: string;
  /** Formula as string */
  formula: string;
  /** Compute the value given r, r_s, and theta */
  compute: (r: number, r_s: number, theta: number) => number;
}

/**
 * All 9 non-zero Schwarzschild Christoffel symbols
 */
export const SCHWARZSCHILD_NONZERO: NonZeroChristoffel[] = [
  // Γ^t_tr = r_s / (2r²f)
  {
    lambda: COORD.t,
    mu: COORD.t,
    nu: COORD.r,
    linearIndex: christoffelLinearIndex(0, 0, 1),
    name: formatChristoffelIndex(0, 0, 1),
    formula: 'r_s / (2r²f)',
    compute: (r, r_s, _theta) => {
      const f = metricFunction(r, r_s);
      return r_s / (2 * r * r * f);
    }
  },

  // Γ^r_tt = r_s·f / (2r²)
  {
    lambda: COORD.r,
    mu: COORD.t,
    nu: COORD.t,
    linearIndex: christoffelLinearIndex(1, 0, 0),
    name: formatChristoffelIndex(1, 0, 0),
    formula: 'r_s·f / (2r²)',
    compute: (r, r_s, _theta) => {
      const f = metricFunction(r, r_s);
      return r_s * f / (2 * r * r);
    }
  },

  // Γ^r_rr = -r_s / (2r²f)
  {
    lambda: COORD.r,
    mu: COORD.r,
    nu: COORD.r,
    linearIndex: christoffelLinearIndex(1, 1, 1),
    name: formatChristoffelIndex(1, 1, 1),
    formula: '-r_s / (2r²f)',
    compute: (r, r_s, _theta) => {
      const f = metricFunction(r, r_s);
      return -r_s / (2 * r * r * f);
    }
  },

  // Γ^r_θθ = -r·f = -(r - r_s)
  {
    lambda: COORD.r,
    mu: COORD.theta,
    nu: COORD.theta,
    linearIndex: christoffelLinearIndex(1, 2, 2),
    name: formatChristoffelIndex(1, 2, 2),
    formula: '-(r - r_s)',
    compute: (r, r_s, _theta) => {
      return -(r - r_s);
    }
  },

  // Γ^r_φφ = -r·f·sin²θ = -(r - r_s)sin²θ
  {
    lambda: COORD.r,
    mu: COORD.phi,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(1, 3, 3),
    name: formatChristoffelIndex(1, 3, 3),
    formula: '-(r - r_s)sin²θ',
    compute: (r, r_s, theta) => {
      const sinTheta = Math.sin(theta);
      return -(r - r_s) * sinTheta * sinTheta;
    }
  },

  // Γ^θ_rθ = 1/r
  {
    lambda: COORD.theta,
    mu: COORD.r,
    nu: COORD.theta,
    linearIndex: christoffelLinearIndex(2, 1, 2),
    name: formatChristoffelIndex(2, 1, 2),
    formula: '1/r',
    compute: (r, _r_s, _theta) => {
      return 1 / r;
    }
  },

  // Γ^θ_φφ = -sinθ·cosθ
  {
    lambda: COORD.theta,
    mu: COORD.phi,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(2, 3, 3),
    name: formatChristoffelIndex(2, 3, 3),
    formula: '-sinθ·cosθ',
    compute: (_r, _r_s, theta) => {
      return -Math.sin(theta) * Math.cos(theta);
    }
  },

  // Γ^φ_rφ = 1/r
  {
    lambda: COORD.phi,
    mu: COORD.r,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(3, 1, 3),
    name: formatChristoffelIndex(3, 1, 3),
    formula: '1/r',
    compute: (r, _r_s, _theta) => {
      return 1 / r;
    }
  },

  // Γ^φ_θφ = cotθ = cosθ/sinθ
  {
    lambda: COORD.phi,
    mu: COORD.theta,
    nu: COORD.phi,
    linearIndex: christoffelLinearIndex(3, 2, 3),
    name: formatChristoffelIndex(3, 2, 3),
    formula: 'cotθ',
    compute: (_r, _r_s, theta) => {
      return Math.cos(theta) / Math.sin(theta);
    }
  }
];

/**
 * Set of linear indices that are non-zero in Schwarzschild
 */
export const NONZERO_INDICES: Set<number> = new Set(
  SCHWARZSCHILD_NONZERO.map(c => c.linearIndex)
);

/**
 * Check if a Christoffel component is non-zero in Schwarzschild
 */
export function isNonZero(lambda: CoordIndex, mu: CoordIndex, nu: CoordIndex): boolean {
  const idx = christoffelLinearIndex(lambda, mu, nu);
  return NONZERO_INDICES.has(idx);
}

// ================================================================
// SPARSITY PATTERN
// ================================================================

/**
 * Sparsity pattern as a boolean array (40 elements)
 *
 * pattern[i] = true means component i is non-zero
 */
export const SPARSITY_PATTERN: boolean[] = (() => {
  const pattern = new Array(40).fill(false);
  for (const idx of NONZERO_INDICES) {
    pattern[idx] = true;
  }
  return pattern;
})();

/**
 * Get the sparsity ratio: nonzero / total
 */
export function getSparsityRatio(): number {
  return NONZERO_INDICES.size / 40;
}

/**
 * Print sparsity statistics
 */
export function printSparsityStats(): void {
  console.log('Schwarzschild Sparsity Statistics:');
  console.log(`  Total Christoffel components: 40`);
  console.log(`  Non-zero components: ${NONZERO_INDICES.size}`);
  console.log(`  Sparsity: ${((1 - getSparsityRatio()) * 100).toFixed(1)}% zeros`);
  console.log(`  Storage savings: ${(40 - NONZERO_INDICES.size)} components`);
}

// ================================================================
// CHRISTOFFEL COMPUTATION
// ================================================================

/**
 * Compute all Schwarzschild Christoffel symbols at a given point
 *
 * @param r - Radial coordinate in meters
 * @param r_s - Schwarzschild radius in meters
 * @param theta - Polar angle in radians
 * @returns Float64Array of 40 Christoffel components
 */
export function computeChristoffel(r: number, r_s: number, theta: number): Float64Array {
  const gamma = new Float64Array(40);  // All zeros initially

  for (const component of SCHWARZSCHILD_NONZERO) {
    gamma[component.linearIndex] = component.compute(r, r_s, theta);
  }

  return gamma;
}

/**
 * Compute only non-zero Christoffel symbols (sparse representation)
 *
 * @returns Map from linear index to value
 */
export function computeChristoffelSparse(
  r: number,
  r_s: number,
  theta: number
): Map<number, number> {
  const gamma = new Map<number, number>();

  for (const component of SCHWARZSCHILD_NONZERO) {
    gamma.set(component.linearIndex, component.compute(r, r_s, theta));
  }

  return gamma;
}

/**
 * Get a single Christoffel symbol value (with sparsity optimization)
 */
export function getChristoffel(
  lambda: CoordIndex,
  mu: CoordIndex,
  nu: CoordIndex,
  r: number,
  r_s: number,
  theta: number
): number {
  const idx = INDEX_LOOKUP[lambda][mu][nu];

  // Quick check for zero components
  if (!NONZERO_INDICES.has(idx)) {
    return 0;
  }

  // Find and compute the non-zero component
  const component = SCHWARZSCHILD_NONZERO.find(c => c.linearIndex === idx);
  if (!component) {
    return 0;  // Shouldn't happen, but safe fallback
  }

  return component.compute(r, r_s, theta);
}

// ================================================================
// VALIDATION
// ================================================================

/**
 * Verify that computed Christoffel symbols match sparsity pattern
 */
export function verifySparsity(gamma: Float64Array, tolerance: number = 1e-20): boolean {
  for (let i = 0; i < 40; i++) {
    const shouldBeZero = !NONZERO_INDICES.has(i);
    const isZero = Math.abs(gamma[i]) < tolerance;
    if (shouldBeZero && !isZero) {
      return false;  // Non-zero where we expected zero
    }
  }
  return true;
}

/**
 * Find sparsity violations
 */
export function findSparsityViolations(
  gamma: Float64Array,
  tolerance: number = 1e-20
): { index: number; value: number }[] {
  const violations: { index: number; value: number }[] = [];

  for (let i = 0; i < 40; i++) {
    const shouldBeZero = !NONZERO_INDICES.has(i);
    if (shouldBeZero && Math.abs(gamma[i]) >= tolerance) {
      violations.push({ index: i, value: gamma[i] });
    }
  }

  return violations;
}

// ================================================================
// DEBUG UTILITIES
// ================================================================

/**
 * Print all non-zero Christoffel symbols with their formulas
 */
export function printNonZeroComponents(): void {
  console.log('Non-zero Schwarzschild Christoffel Symbols:');
  for (const c of SCHWARZSCHILD_NONZERO) {
    console.log(`  ${c.name} = ${c.formula}`);
  }
}

/**
 * Print computed Christoffel values at a specific point
 */
export function printChristoffelAt(r: number, r_s: number, theta: number): void {
  console.log(`Christoffel symbols at r=${r.toExponential(2)}, r_s=${r_s.toExponential(2)}, θ=${(theta * 180 / Math.PI).toFixed(1)}°:`);
  for (const c of SCHWARZSCHILD_NONZERO) {
    const value = c.compute(r, r_s, theta);
    console.log(`  ${c.name} = ${value.toExponential(6)}`);
  }
}
