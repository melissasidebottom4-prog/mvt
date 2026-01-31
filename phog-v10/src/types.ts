/**
 * PHOG V10 - Phase 3 Type Definitions
 *
 * 0D point-based multi-physics state for coupled simulations
 */

/**
 * Complete 0D state vector for multi-physics simulation
 * Combines mechanics, thermal, and species domains
 */
export interface State0D {
  // === Mechanics Domain ===
  position: number;      // m - height/position
  velocity: number;      // m/s
  mass: number;          // kg

  // === Thermal Domain ===
  temperature: number;   // K
  cp: number;            // J/(kg·K) - specific heat capacity

  // === Species/Chemical Domain ===
  concentration: number; // mol/m³ - substrate concentration
  reactionRate: number;  // mol/s - current reaction rate
  delta_H: number;       // J/mol - reaction enthalpy (negative = exothermic)

  // === Environmental ===
  g: number;             // m/s² - gravitational acceleration

  // === Entropy Tracking ===
  entropyProduced: number; // J/K - cumulative irreversible entropy
}

/**
 * Conserved quantities broken down by domain
 */
export interface ConservedQuantities {
  energy: {
    mechanics: number;   // KE + PE (J)
    thermal: number;     // Internal energy (J)
    species: number;     // Chemical potential energy (J)
    total: number;       // Sum of all domains (J)
  };
  entropy: {
    thermal: number;     // Reversible thermal entropy (J/K)
    irreversible: number; // Cumulative irreversible production (J/K)
    total: number;       // Sum (J/K)
  };
  momentum: number;      // kg·m/s
  mass: number;          // kg
}

/**
 * Conservation verification result
 */
export interface ConservationResult {
  valid: boolean;
  violations: string[];
  deltas: {
    energy: number;
    entropy: number;
    momentum: number;
    mass: number;
  };
}

/**
 * Coupling step result
 */
export interface CouplingStepResult {
  state: State0D;
  conservation: ConservedQuantities;
  violations: string[];
  dt: number;
  t: number;
}

/**
 * Simulation configuration for coupled systems
 */
export interface CoupledSimConfig {
  dt: number;            // Time step (s)
  duration: number;      // Total simulation time (s)
  g: number;             // Gravity (m/s²)
  frictionCoeff: number; // Friction coefficient (dimensionless)
  outputInterval: number; // Steps between outputs
}

/**
 * Default initial state factory
 */
export function createDefaultState(): State0D {
  return {
    position: 0,
    velocity: 0,
    mass: 1,
    temperature: 298.15,  // Room temperature (K)
    cp: 1000,             // Generic solid (J/kg·K)
    concentration: 0,
    reactionRate: 0,
    delta_H: 0,
    g: 9.8,
    entropyProduced: 0
  };
}
