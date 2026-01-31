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
