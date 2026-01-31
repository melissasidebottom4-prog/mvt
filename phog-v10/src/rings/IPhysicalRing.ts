/**
 * PHOG V10 - Phase 4: Saturn Ring Architecture
 *
 * IPhysicalRing - Universal interface for physics domains
 *
 * Architecture Concept:
 *   ConservationCore (the "planet")
 *   └─ Rings orbit around it, each representing a physics domain:
 *       ├─ MomentumRing (classical mechanics)
 *       ├─ ThermalRing (thermodynamics)
 *       ├─ SpeciesRing (chemical kinetics)
 *       └─ [Any future physics domain...]
 *
 * Key Insight: Conservation is not a constraint ON physics,
 * it IS physics. The core enforces it universally.
 */

/**
 * Energy contributions from a physics domain
 */
export interface EnergyContributions {
  kinetic: number;     // J - energy from motion
  potential: number;   // J - energy from position/state
  internal: number;    // J - energy from internal degrees of freedom
  total: number;       // J - sum of all contributions
}

/**
 * Entropy signature for 2nd law enforcement
 */
export interface EntropySignature {
  thermal: number;      // J/K - entropy from thermal state
  irreversible: number; // J/K - entropy produced (never decreases)
  total: number;        // J/K - total entropy
}

/**
 * Kinematic state for coupling
 */
export interface KinematicState {
  position: number;   // m or mol/m³ (domain-dependent)
  velocity: number;   // m/s or mol/s (domain-dependent)
  mass: number;       // kg or effective mass
}

/**
 * Coupling data for inter-ring energy transfer
 */
export interface CouplingData {
  energyFlux: number;     // J/s - energy flow rate
  entropyFlux: number;    // J/(K·s) - entropy flow rate
  sourceRing: string;     // Ring providing energy
  targetRing: string;     // Ring receiving energy
}

/**
 * Universal ring interface - ALL physics domains implement this
 */
export interface IPhysicalRing {
  /**
   * Unique identifier for this ring
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Get current energy contributions
   */
  getEnergy(): EnergyContributions;

  /**
   * Get current entropy signature
   */
  getEntropy(): EntropySignature;

  /**
   * Get kinematic state for coupling calculations
   */
  getKinematicState(): KinematicState;

  /**
   * Step forward in time (isolated, no coupling)
   * Returns the energy delta from this step
   */
  step(dt: number, params?: Record<string, number>): number;

  /**
   * Apply energy transfer from coupling
   * Returns actual energy absorbed (may differ from requested)
   */
  absorbEnergy(amount: number): number;

  /**
   * Apply entropy production from irreversible process
   */
  produceEntropy(amount: number): void;

  /**
   * Get coupling data to another ring
   * Returns null if no coupling exists
   */
  getCouplingTo(targetId: string): CouplingData | null;

  /**
   * Receive coupling data from another ring
   * Optional - rings can implement to receive state from sources
   */
  receiveCouplingData?(sourceRing: string, data: Record<string, number>): void;

  /**
   * Reset to initial state
   */
  reset(): void;

  /**
   * Serialize state for receipts
   */
  serialize(): Record<string, number>;
}

/**
 * Abstract base class with common functionality
 */
export abstract class PhysicalRingBase implements IPhysicalRing {
  abstract readonly id: string;
  abstract readonly name: string;

  protected entropyProduced: number = 0;

  abstract getEnergy(): EnergyContributions;
  abstract getKinematicState(): KinematicState;
  abstract step(dt: number, params?: Record<string, number>): number;
  abstract absorbEnergy(amount: number): number;
  abstract reset(): void;
  abstract serialize(): Record<string, number>;

  getEntropy(): EntropySignature {
    return {
      thermal: 0,
      irreversible: this.entropyProduced,
      total: this.entropyProduced
    };
  }

  produceEntropy(amount: number): void {
    if (amount > 0) {
      this.entropyProduced += amount;
    }
  }

  getCouplingTo(_targetId: string): CouplingData | null {
    return null;  // Override in subclasses for specific couplings
  }
}
