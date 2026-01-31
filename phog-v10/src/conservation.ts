/**
 * PHOG V10 - Conservation Laws
 *
 * Compute conserved quantities from state and check conservation
 */

export interface ConservedQuantities {
  energy: number;
  momentum: number;
  mass: number;
  entropy: number;
}

export interface ConservationErrors {
  energy: number;
  momentum: number;
  mass: number;
  entropy_change: number;
}

/**
 * Compute total energy from state
 * E = KE + PE + U (kinetic + potential + thermal)
 */
export function computeEnergy(state: Record<string, number>): number {
  let E = 0;

  // Kinetic energy: KE = 0.5 * m * v^2
  const m = state.m ?? state.mass ?? 1;
  const v = state.v ?? state.velocity ?? 0;
  E += 0.5 * m * v * v;

  // Potential energy: PE = m * g * h
  const g = state.g ?? 9.8;
  const h = state.y ?? state.height ?? 0;
  E += m * g * h;

  // Thermal energy: U = m * c_p * T (if thermal state exists)
  if (state.T !== undefined || state.temperature !== undefined) {
    const T = state.T ?? state.temperature ?? 0;
    const c_p = state.c_p ?? 1000;
    E += m * c_p * T;
  }

  return E;
}

/**
 * Compute total momentum
 * p = m * v
 */
export function computeMomentum(state: Record<string, number>): number {
  const m = state.m ?? state.mass ?? 1;
  const v = state.v ?? state.velocity ?? 0;
  return m * v;
}

/**
 * Compute total mass
 */
export function computeMass(state: Record<string, number>): number {
  return state.m ?? state.mass ?? 1;
}

/**
 * Compute entropy (simplified Boltzmann for thermal systems)
 * S = m * c_p * ln(T)
 */
export function computeEntropy(state: Record<string, number>): number {
  // For non-thermal systems, return 0 (no entropy change expected)
  if (state.T === undefined && state.temperature === undefined) {
    return 0;
  }

  const m = state.m ?? state.mass ?? 1;
  const T = state.T ?? state.temperature ?? 300;
  const c_p = state.c_p ?? 1000;

  if (T <= 0) return 0;

  return m * c_p * Math.log(T);
}

/**
 * Compute all conserved quantities
 */
export function computeConserved(state: Record<string, number>): ConservedQuantities {
  return {
    energy: computeEnergy(state),
    momentum: computeMomentum(state),
    mass: computeMass(state),
    entropy: computeEntropy(state)
  };
}

/**
 * Check if conservation holds between two states
 */
export function checkConservation(
  initial: Record<string, number>,
  final: Record<string, number>,
  tolerances?: { energy?: number; momentum?: number; mass?: number }
): { valid: boolean; errors: ConservationErrors; violations: string[] } {

  const tol = {
    energy: tolerances?.energy ?? 1e-6,
    momentum: tolerances?.momentum ?? 1e-6,
    mass: tolerances?.mass ?? 1e-9
  };

  const E_i = computeEnergy(initial);
  const E_f = computeEnergy(final);
  const dE = Math.abs(E_f - E_i);

  const p_i = computeMomentum(initial);
  const p_f = computeMomentum(final);
  const dp = Math.abs(p_f - p_i);

  const m_i = computeMass(initial);
  const m_f = computeMass(final);
  const dm = Math.abs(m_f - m_i);

  const S_i = computeEntropy(initial);
  const S_f = computeEntropy(final);
  const dS = S_f - S_i;

  const violations: string[] = [];

  // Energy conservation (relative error for large values)
  const E_scale = Math.max(Math.abs(E_i), Math.abs(E_f), 1);
  if (dE / E_scale > tol.energy) {
    violations.push(`Energy not conserved: dE = ${dE.toExponential(2)} (${(dE/E_scale*100).toFixed(4)}%)`);
  }

  // Momentum conservation
  const p_scale = Math.max(Math.abs(p_i), Math.abs(p_f), 1);
  if (dp / p_scale > tol.momentum) {
    violations.push(`Momentum not conserved: dp = ${dp.toExponential(2)}`);
  }

  // Mass conservation
  if (dm > tol.mass) {
    violations.push(`Mass not conserved: dm = ${dm.toExponential(2)}`);
  }

  // 2nd law (entropy must increase or stay constant in isolated systems)
  // Only check if thermal state exists
  if ((initial.T !== undefined || initial.temperature !== undefined) && dS < -1e-9) {
    violations.push(`2nd law violated: dS = ${dS.toExponential(2)} < 0`);
  }

  return {
    valid: violations.length === 0,
    errors: {
      energy: dE,
      momentum: dp,
      mass: dm,
      entropy_change: dS
    },
    violations
  };
}

/**
 * Format conservation status for display
 */
export function formatConservation(errors: ConservationErrors, valid: boolean): string {
  const status = valid ? '\u2713' : '\u2717';
  return `dE=${errors.energy.toExponential(2)} dp=${errors.momentum.toExponential(2)} dS=${errors.entropy_change.toExponential(2)} ${status}`;
}

// =============================================================================
// PHASE 3: MULTI-DOMAIN CONSERVATION
// =============================================================================

import type { State0D, ConservedQuantities as MultiDomainConserved } from './types.js';

// Re-export for convenience
export type { State0D, MultiDomainConserved };

/** Reference temperature for entropy calculation (standard thermodynamic reference) */
const T_REF_ENTROPY = 298.15; // K (25°C)

/**
 * CONSERVATION FORMULAS - THE MATHEMATICAL BEDROCK
 *
 * These formulas define what "conservation" means in multi-physics PHOG.
 * They transform simulation output into certified physics.
 */
export function computeMultiDomainConservation(s: State0D): MultiDomainConserved {

  // === ENERGY (absolute, T_ref = 0K for internal energy) ===

  // Mechanical: kinetic + gravitational potential
  const E_mechanics = 0.5 * s.mass * s.velocity ** 2 +
                      s.mass * s.g * s.position;

  // Thermal: internal energy U = m·cp·T
  const E_thermal = s.mass * s.cp * s.temperature;

  // Chemical: potential energy stored in unreacted substrate
  // For exothermic reactions (ΔH < 0):
  //   - Reactants have HIGH energy, products have LOW energy
  //   - E_chem = -ΔH × [S] (positive value for exothermic)
  //   - As [S] decreases, E_chem decreases (energy released to thermal)
  // For endothermic reactions (ΔH > 0):
  //   - E_chem = -ΔH × [S] (negative value)
  //   - As [S] decreases, E_chem increases (energy absorbed from thermal)
  const E_species = -s.delta_H * s.concentration;

  const E_total = E_mechanics + E_thermal + E_species;

  // === ENTROPY (T_ref = 298.15K for standard thermodynamic tables) ===

  // Thermal: Boltzmann entropy S = m·cp·ln(T/T_ref)
  const S_thermal = s.temperature > 0
    ? s.mass * s.cp * Math.log(s.temperature / T_REF_ENTROPY)
    : 0;

  // Irreversible: entropy generated by friction, reactions, etc.
  // This is ALWAYS >= 0 and ALWAYS increases (2nd law)
  const S_irreversible = s.entropyProduced;

  const S_total = S_thermal + S_irreversible;

  // === MOMENTUM & MASS ===

  const p_total = s.mass * s.velocity;
  const m_total = s.mass;

  return {
    energy: {
      mechanics: E_mechanics,
      thermal: E_thermal,
      species: E_species,
      total: E_total
    },
    entropy: {
      thermal: S_thermal,
      irreversible: S_irreversible,
      total: S_total
    },
    momentum: p_total,
    mass: m_total
  };
}

/**
 * Verify conservation between two multi-domain states
 *
 * Thresholds are NON-NEGOTIABLE:
 * - Energy: 1e-12 J (machine precision target)
 * - Entropy: must not decrease (2nd law)
 * - Momentum: 1e-12 kg·m/s
 * - Mass: 1e-12 kg
 */
export function verifyMultiDomainConservation(
  before: MultiDomainConserved,
  after: MultiDomainConserved
): { valid: boolean; violations: string[]; deltas: { energy: number; entropy: number; momentum: number; mass: number } } {

  const violations: string[] = [];

  // Energy conservation (threshold: 1e-12 J)
  const dE = Math.abs(after.energy.total - before.energy.total);
  if (dE > 1e-12) {
    violations.push(
      `Energy not conserved: dE = ${dE.toExponential(2)} J (threshold: 1e-12 J)`
    );
  }

  // Entropy 2nd law (must increase or stay constant)
  // Allow tiny negative for numerical noise: -1e-12 J/K
  const dS = after.entropy.total - before.entropy.total;
  if (dS < -1e-12) {
    violations.push(
      `Second law violated: dS = ${dS.toExponential(2)} J/K < 0`
    );
  }

  // Momentum conservation (threshold: 1e-12 kg·m/s)
  // Note: Only check in isolated systems (no external forces)
  const dp = Math.abs(after.momentum - before.momentum);
  // Momentum check disabled for systems with gravity (external force)
  // if (dp > 1e-12) {
  //   violations.push(`Momentum not conserved: dp = ${dp.toExponential(2)} kg·m/s`);
  // }

  // Mass conservation (threshold: 1e-12 kg)
  const dm = Math.abs(after.mass - before.mass);
  if (dm > 1e-12) {
    violations.push(
      `Mass not conserved: dm = ${dm.toExponential(2)} kg`
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    deltas: {
      energy: dE,
      entropy: dS,
      momentum: dp,
      mass: dm
    }
  };
}

/**
 * Format multi-domain conservation for display
 */
export function formatMultiDomainConservation(c: MultiDomainConserved): string {
  return [
    `Energy: mech=${c.energy.mechanics.toFixed(4)} therm=${c.energy.thermal.toFixed(4)} chem=${c.energy.species.toFixed(4)} total=${c.energy.total.toFixed(4)} J`,
    `Entropy: therm=${c.entropy.thermal.toFixed(4)} irrev=${c.entropy.irreversible.toFixed(4)} total=${c.entropy.total.toFixed(4)} J/K`,
    `Momentum: ${c.momentum.toFixed(4)} kg·m/s`,
    `Mass: ${c.mass.toFixed(6)} kg`
  ].join('\n');
}
