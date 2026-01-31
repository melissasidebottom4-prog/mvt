/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure
 *
 * Constants.ts - GR constants and coordinate conventions
 *
 * Establishes fundamental constants and coordinate system conventions
 * for Schwarzschild spacetime calculations.
 */

// ================================================================
// FUNDAMENTAL GR CONSTANTS
// ================================================================

export const GR_CONSTANTS = {
  /** Speed of light in m/s */
  c: 299792458,

  /** Gravitational constant in m³/(kg·s²) */
  G: 6.67430e-11,

  /** Solar mass in kg */
  M_sun: 1.98847e30,

  /** Schwarzschild radius of the Sun in meters: r_s = 2GM/c² */
  r_s_sun: 2953.25,  // 2 * G * M_sun / c^2

  /** Planck length in meters */
  l_p: 1.616255e-35,

  /** Planck mass in kg */
  m_p: 2.176434e-8,

  /** Planck time in seconds */
  t_p: 5.391247e-44
} as const;

// ================================================================
// COORDINATE CONVENTIONS
// ================================================================

/**
 * Schwarzschild coordinate indices
 *
 * Convention: (t, r, θ, φ) = (0, 1, 2, 3)
 *
 * This follows the standard GR textbook convention (Misner-Thorne-Wheeler).
 */
export const COORD = {
  t: 0,
  r: 1,
  theta: 2,
  phi: 3
} as const;

export type CoordIndex = 0 | 1 | 2 | 3;

/**
 * Human-readable coordinate names for debugging and output
 */
export const COORD_NAMES: Record<CoordIndex, string> = {
  0: 't',
  1: 'r',
  2: 'θ',
  3: 'φ'
};

/**
 * Metric signature convention: (-,+,+,+)
 *
 * This is the "mostly plus" or "West Coast" convention.
 * g_tt < 0, g_rr > 0, g_θθ > 0, g_φφ > 0
 */
export const METRIC_SIGNATURE = [-1, 1, 1, 1] as const;

// ================================================================
// SCHWARZSCHILD METRIC HELPERS
// ================================================================

/**
 * Schwarzschild radius for a given mass
 * r_s = 2GM/c²
 *
 * @param M - Mass in kg
 * @returns Schwarzschild radius in meters
 */
export function schwarzschildRadius(M: number): number {
  return (2 * GR_CONSTANTS.G * M) / (GR_CONSTANTS.c * GR_CONSTANTS.c);
}

/**
 * Check if radius is outside the event horizon
 *
 * @param r - Radial coordinate in meters
 * @param r_s - Schwarzschild radius in meters
 * @returns true if r > r_s (outside horizon)
 */
export function isValidRadius(r: number, r_s: number): boolean {
  return r > r_s;
}

/**
 * Schwarzschild metric coefficient: f(r) = 1 - r_s/r
 *
 * This appears in g_tt = -f(r) and g_rr = 1/f(r)
 *
 * @param r - Radial coordinate in meters
 * @param r_s - Schwarzschild radius in meters
 * @returns The metric function f(r)
 */
export function metricFunction(r: number, r_s: number): number {
  if (r <= r_s) {
    throw new Error(`Invalid radius: r=${r} <= r_s=${r_s} (inside horizon)`);
  }
  return 1 - r_s / r;
}

/**
 * Derivative of metric function: df/dr = r_s/r²
 *
 * @param r - Radial coordinate in meters
 * @param r_s - Schwarzschild radius in meters
 * @returns df/dr
 */
export function metricFunctionDerivative(r: number, r_s: number): number {
  return r_s / (r * r);
}

// ================================================================
// TENSOR INDEX UTILITIES
// ================================================================

/**
 * Convert (μ, ν) pair to linear index for symmetric 4x4 tensor
 *
 * Uses upper triangular storage: only stores μ ≤ ν
 * Index = μ * 4 + ν - μ*(μ+1)/2 for μ ≤ ν
 *
 * 10 independent components for symmetric tensor:
 * (0,0), (0,1), (0,2), (0,3), (1,1), (1,2), (1,3), (2,2), (2,3), (3,3)
 *   0      1      2      3      4      5      6      7      8      9
 */
export function symmetricIndex(mu: CoordIndex, nu: CoordIndex): number {
  const [i, j] = mu <= nu ? [mu, nu] : [nu, mu];
  return i * 4 + j - (i * (i + 1)) / 2;
}

/**
 * Convert linear index back to (μ, ν) pair
 */
export function indexToCoords(idx: number): [CoordIndex, CoordIndex] {
  const pairs: [CoordIndex, CoordIndex][] = [
    [0, 0], [0, 1], [0, 2], [0, 3],
    [1, 1], [1, 2], [1, 3],
    [2, 2], [2, 3],
    [3, 3]
  ];
  if (idx < 0 || idx >= 10) {
    throw new Error(`Invalid symmetric index: ${idx}`);
  }
  return pairs[idx];
}

/**
 * Total number of independent components in a symmetric 4x4 tensor
 */
export const SYMMETRIC_COMPONENTS = 10;

/**
 * Total number of independent Christoffel symbol components
 *
 * Γ^λ_μν has 4 × 10 = 40 components (first index free, last two symmetric)
 */
export const CHRISTOFFEL_COMPONENTS = 40;

// ================================================================
// VALIDATION HELPERS
// ================================================================

/**
 * Check if a value is a valid coordinate index
 */
export function isValidCoordIndex(idx: number): idx is CoordIndex {
  return idx === 0 || idx === 1 || idx === 2 || idx === 3;
}

/**
 * Assert that indices are valid
 */
export function assertValidIndices(...indices: number[]): void {
  for (const idx of indices) {
    if (!isValidCoordIndex(idx)) {
      throw new Error(`Invalid coordinate index: ${idx}`);
    }
  }
}
