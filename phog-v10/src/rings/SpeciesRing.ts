/**
 * PHOG V10 - Phase 4: Species Ring
 *
 * Wraps chemical kinetics with Michaelis-Menten enzyme kinetics.
 * Couples to thermal ring via reaction enthalpy.
 *
 * MICHAELIS-MENTEN KINETICS:
 *
 *        V_max · [S]
 *   v = ─────────────
 *        K_m + [S]
 *
 * Energy contributions:
 * - Potential: -ΔH × [S] (chemical potential energy)
 *   For exothermic (ΔH < 0): E_chem is positive
 *   As reaction proceeds: [S] decreases → E_chem decreases → thermal gains
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';

export interface SpeciesState {
  concentration: number;  // mol/m³ - substrate [S]
  V_max: number;          // mol/s - maximum rate
  K_m: number;            // mol/m³ - Michaelis constant
  delta_H: number;        // J/mol - reaction enthalpy
  reactionRate: number;   // mol/s - current rate
}

export class SpeciesRing extends PhysicalRingBase {
  readonly id = 'species';
  readonly name = 'Species Ring (Chemical Kinetics)';

  private state: SpeciesState = {
    concentration: 0,
    V_max: 0,
    K_m: 1,      // Avoid division by zero
    delta_H: 0,
    reactionRate: 0
  };

  // Initial state for reset
  private initialState: SpeciesState = { ...this.state };

  // Track energy released this step (for coupling)
  private energyReleased: number = 0;

  /**
   * Initialize the ring
   */
  init(concentration: number, V_max: number, K_m: number, delta_H: number): void {
    this.state = {
      concentration,
      V_max,
      K_m: K_m > 0 ? K_m : 1,  // Prevent division by zero
      delta_H,
      reactionRate: 0
    };
    this.initialState = { ...this.state };
    this.entropyProduced = 0;
    this.energyReleased = 0;
  }

  /**
   * Get energy contributions
   *
   * Chemical potential energy: E_chem = -ΔH × [S]
   *
   * For exothermic reactions (ΔH < 0):
   *   E_chem = -(-50000) × [S] = +50000 × [S]
   *   Positive energy stored in substrate
   *
   * For endothermic reactions (ΔH > 0):
   *   E_chem = -(+50000) × [S] = -50000 × [S]
   *   Negative (energy needed to react)
   */
  getEnergy(): EnergyContributions {
    const potential = -this.state.delta_H * this.state.concentration;

    return {
      kinetic: 0,
      potential,
      internal: 0,
      total: potential
    };
  }

  /**
   * Get kinematic state
   */
  getKinematicState(): KinematicState {
    return {
      position: this.state.concentration,
      velocity: -this.state.reactionRate,  // Consumption rate
      mass: 1  // Effective mass for kinetics
    };
  }

  /**
   * Step using Michaelis-Menten kinetics
   *
   * v = V_max · [S] / (K_m + [S])
   * d[S]/dt = -v
   */
  step(dt: number, _params?: Record<string, number>): number {
    const S = this.state.concentration;
    const E_before = this.getEnergy().total;

    // Skip if no substrate or no enzyme
    if (S <= 0 || this.state.V_max <= 0) {
      this.state.reactionRate = 0;
      this.energyReleased = 0;
      return 0;
    }

    // Michaelis-Menten reaction rate
    const v = (this.state.V_max * S) / (this.state.K_m + S);

    // Update concentration (substrate consumed)
    const dS = -v * dt;
    this.state.concentration = Math.max(0, S + dS);
    this.state.reactionRate = v;

    // Energy change (released if exothermic)
    const E_after = this.getEnergy().total;
    const dE = E_after - E_before;

    // For exothermic: E decreases (dE < 0), energy is released (-dE > 0)
    this.energyReleased = -dE;

    return dE;
  }

  /**
   * Absorb energy (species ring releases energy, doesn't absorb)
   */
  absorbEnergy(_amount: number): number {
    return 0;  // Chemical reactions are driven by kinetics, not energy input
  }

  /**
   * Get energy released this step (for coupling to thermal)
   */
  getEnergyReleased(): number {
    return this.energyReleased;
  }

  /**
   * Get heat rate from reaction
   *
   * Q̇ = -ΔH · v
   *
   * For exothermic (ΔH < 0): Q̇ > 0 (heat released)
   */
  getHeatRate(): number {
    return -this.state.delta_H * this.state.reactionRate;
  }

  /**
   * Get coupling data to thermal ring
   */
  getCouplingTo(targetId: string): CouplingData | null {
    if (targetId === 'thermal' && this.state.reactionRate > 0) {
      return {
        energyFlux: this.getHeatRate(),
        entropyFlux: 0,
        sourceRing: this.id,
        targetRing: targetId
      };
    }
    return null;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = { ...this.initialState };
    this.entropyProduced = 0;
    this.energyReleased = 0;
  }

  /**
   * Serialize for receipts
   */
  serialize(): Record<string, number> {
    return {
      concentration: this.state.concentration,
      V_max: this.state.V_max,
      K_m: this.state.K_m,
      delta_H: this.state.delta_H,
      reactionRate: this.state.reactionRate
    };
  }

  /**
   * Direct state access
   */
  getState(): SpeciesState {
    return { ...this.state };
  }

  /**
   * Get reaction rate
   */
  getReactionRate(): number {
    return this.state.reactionRate;
  }

  /**
   * Get conversion fraction
   */
  getConversion(initialConcentration: number): number {
    if (initialConcentration <= 0) return 0;
    return 1 - this.state.concentration / initialConcentration;
  }
}
