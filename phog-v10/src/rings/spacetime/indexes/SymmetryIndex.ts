/**
 * PHOG V10 - Phase 12: Spacetime Index Infrastructure
 *
 * SymmetryIndex.ts - Christoffel symbol symmetry handling
 *
 * The Christoffel symbols Γ^λ_μν are symmetric in the lower indices:
 * Γ^λ_μν = Γ^λ_νμ
 *
 * This reduces storage from 64 to 40 independent components.
 */

import { CoordIndex, symmetricIndex, indexToCoords, COORD_NAMES } from './Constants.js';

// ================================================================
// CHRISTOFFEL SYMMETRY TYPES
// ================================================================

/**
 * Canonical form for Christoffel indices: (λ, μ, ν) with μ ≤ ν
 */
export interface CanonicalChristoffelIndex {
  lambda: CoordIndex;  // Upper index (free)
  mu: CoordIndex;      // Lower index 1 (smaller or equal)
  nu: CoordIndex;      // Lower index 2 (larger or equal)
}

/**
 * Convert any (λ, μ, ν) to canonical form where μ ≤ ν
 *
 * This exploits the symmetry Γ^λ_μν = Γ^λ_νμ
 */
export function toCanonical(
  lambda: CoordIndex,
  mu: CoordIndex,
  nu: CoordIndex
): CanonicalChristoffelIndex {
  if (mu <= nu) {
    return { lambda, mu, nu };
  } else {
    return { lambda, mu: nu, nu: mu };
  }
}

/**
 * Convert canonical indices to linear storage index
 *
 * Layout: 40 components organized as:
 * - λ=0: 10 components (μν pairs: 00,01,02,03,11,12,13,22,23,33)
 * - λ=1: 10 components
 * - λ=2: 10 components
 * - λ=3: 10 components
 *
 * Index = λ * 10 + symmetricIndex(μ, ν)
 */
export function christoffelLinearIndex(
  lambda: CoordIndex,
  mu: CoordIndex,
  nu: CoordIndex
): number {
  const canonical = toCanonical(lambda, mu, nu);
  return canonical.lambda * 10 + symmetricIndex(canonical.mu, canonical.nu);
}

/**
 * Convert linear index back to canonical (λ, μ, ν)
 */
export function linearToChristoffel(idx: number): CanonicalChristoffelIndex {
  if (idx < 0 || idx >= 40) {
    throw new Error(`Invalid Christoffel linear index: ${idx}`);
  }
  const lambda = Math.floor(idx / 10) as CoordIndex;
  const symIdx = idx % 10;
  const [mu, nu] = indexToCoords(symIdx);
  return { lambda, mu, nu };
}

// ================================================================
// SYMMETRY GROUP TRACKING
// ================================================================

/**
 * A symmetry group contains indices that share the same value
 * due to the μ↔ν symmetry
 */
export interface SymmetryGroup {
  /** Canonical representative */
  canonical: CanonicalChristoffelIndex;
  /** All equivalent index tuples */
  members: [CoordIndex, CoordIndex, CoordIndex][];
  /** Linear storage index */
  linearIndex: number;
}

/**
 * Build all 40 symmetry groups
 *
 * For diagonal lower indices (μ = ν), group has 1 member
 * For off-diagonal lower indices (μ ≠ ν), group has 2 members
 */
export function buildSymmetryGroups(): SymmetryGroup[] {
  const groups: SymmetryGroup[] = [];

  for (let lambda = 0; lambda < 4; lambda++) {
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = mu; nu < 4; nu++) {
        const l = lambda as CoordIndex;
        const m = mu as CoordIndex;
        const n = nu as CoordIndex;

        const members: [CoordIndex, CoordIndex, CoordIndex][] = [[l, m, n]];
        if (m !== n) {
          members.push([l, n, m]);  // Add symmetric partner
        }

        groups.push({
          canonical: { lambda: l, mu: m, nu: n },
          members,
          linearIndex: christoffelLinearIndex(l, m, n)
        });
      }
    }
  }

  return groups;
}

/**
 * Pre-built symmetry groups (computed once at module load)
 */
export const SYMMETRY_GROUPS = buildSymmetryGroups();

// ================================================================
// LOOKUP TABLES FOR FAST ACCESS
// ================================================================

/**
 * Lookup table: (λ, μ, ν) → linear index
 *
 * indexLookup[λ][μ][ν] gives the linear storage index
 */
export const INDEX_LOOKUP: number[][][] = (() => {
  const table: number[][][] = [];
  for (let lambda = 0; lambda < 4; lambda++) {
    table[lambda] = [];
    for (let mu = 0; mu < 4; mu++) {
      table[lambda][mu] = [];
      for (let nu = 0; nu < 4; nu++) {
        table[lambda][mu][nu] = christoffelLinearIndex(
          lambda as CoordIndex,
          mu as CoordIndex,
          nu as CoordIndex
        );
      }
    }
  }
  return table;
})();

/**
 * Fast lookup: get linear index from indices
 */
export function getLinearIndex(lambda: number, mu: number, nu: number): number {
  return INDEX_LOOKUP[lambda][mu][nu];
}

// ================================================================
// SYMMETRY VERIFICATION UTILITIES
// ================================================================

/**
 * Verify that a Christoffel array respects symmetry
 *
 * @param gamma - Array of 40 Christoffel components
 * @param tolerance - Numerical tolerance for comparison
 * @returns true if symmetry is satisfied
 */
export function verifySymmetry(gamma: Float64Array, tolerance: number = 1e-14): boolean {
  for (let lambda = 0; lambda < 4; lambda++) {
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = 0; nu < 4; nu++) {
        const idx1 = INDEX_LOOKUP[lambda][mu][nu];
        const idx2 = INDEX_LOOKUP[lambda][nu][mu];
        if (Math.abs(gamma[idx1] - gamma[idx2]) > tolerance) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Find symmetry violations and report them
 */
export function findSymmetryViolations(
  gamma: Float64Array,
  tolerance: number = 1e-14
): { indices: [number, number, number]; violation: number }[] {
  const violations: { indices: [number, number, number]; violation: number }[] = [];

  for (let lambda = 0; lambda < 4; lambda++) {
    for (let mu = 0; mu < 4; mu++) {
      for (let nu = mu + 1; nu < 4; nu++) {
        const idx1 = INDEX_LOOKUP[lambda][mu][nu];
        const idx2 = INDEX_LOOKUP[lambda][nu][mu];
        const diff = Math.abs(gamma[idx1] - gamma[idx2]);
        if (diff > tolerance) {
          violations.push({
            indices: [lambda, mu, nu],
            violation: diff
          });
        }
      }
    }
  }

  return violations;
}

// ================================================================
// DEBUG AND DISPLAY UTILITIES
// ================================================================

/**
 * Format Christoffel index as string: Γ^λ_μν
 */
export function formatChristoffelIndex(lambda: CoordIndex, mu: CoordIndex, nu: CoordIndex): string {
  return `Γ^${COORD_NAMES[lambda]}_${COORD_NAMES[mu]}${COORD_NAMES[nu]}`;
}

/**
 * Print all Christoffel components with names
 */
export function printChristoffelComponents(gamma: Float64Array): void {
  console.log('Christoffel Symbols:');
  for (const group of SYMMETRY_GROUPS) {
    const { lambda, mu, nu } = group.canonical;
    const value = gamma[group.linearIndex];
    if (Math.abs(value) > 1e-20) {
      console.log(`  ${formatChristoffelIndex(lambda, mu, nu)} = ${value.toExponential(6)}`);
    }
  }
}

/**
 * Count non-zero Christoffel components
 */
export function countNonZero(gamma: Float64Array, threshold: number = 1e-20): number {
  let count = 0;
  for (let i = 0; i < 40; i++) {
    if (Math.abs(gamma[i]) > threshold) {
      count++;
    }
  }
  return count;
}
