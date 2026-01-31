/**
 * PHOG V10 - Species Solver
 *
 * Handles chemical concentration and reaction kinetics.
 * Implements Michaelis-Menten enzyme kinetics.
 *
 * THIS IS WHERE MICHAELIS-MENTEN LIVES!
 * Not as a standalone law, but as a coupling mechanism.
 */

export interface SpeciesState {
  concentration: number;  // mol/m³ - substrate concentration [S]
  V_max: number;          // mol/s - maximum reaction rate
  K_m: number;            // mol/m³ - Michaelis constant
  delta_H: number;        // J/mol - reaction enthalpy (negative = exothermic)
  reactionRate: number;   // mol/s - current reaction rate (computed)
}

export class SpeciesSolver {
  state: SpeciesState = {
    concentration: 0,
    V_max: 0,
    K_m: 1,        // Avoid division by zero
    delta_H: 0,
    reactionRate: 0
  };

  /**
   * Initialize with state
   */
  init(concentration: number, V_max: number, K_m: number, delta_H: number): void {
    this.state.concentration = concentration;
    this.state.V_max = V_max;
    this.state.K_m = K_m;
    this.state.delta_H = delta_H;
    this.state.reactionRate = 0;
  }

  /**
   * Step forward in time
   *
   * MICHAELIS-MENTEN KINETICS:
   *
   *        V_max · [S]
   *   v = ─────────────
   *        K_m + [S]
   *
   * Where:
   * - v = reaction rate (mol/s)
   * - V_max = maximum rate when enzyme is saturated
   * - [S] = substrate concentration
   * - K_m = Michaelis constant (substrate concentration at half V_max)
   *
   * Physical interpretation:
   * - At low [S]: v ≈ (V_max/K_m)·[S] (first-order kinetics)
   * - At high [S]: v ≈ V_max (zero-order, enzyme saturated)
   * - At [S] = K_m: v = V_max/2
   */
  step(dt: number): void {
    const S = this.state.concentration;

    // Skip if no substrate or no enzyme
    if (S <= 0 || this.state.V_max <= 0) {
      this.state.reactionRate = 0;
      return;
    }

    // Michaelis-Menten reaction rate
    const v = (this.state.V_max * S) / (this.state.K_m + S);

    // Update concentration (substrate consumed)
    // d[S]/dt = -v
    const dS = -v * dt;
    this.state.concentration = Math.max(0, S + dS);

    // Store rate for coupling to thermal domain
    this.state.reactionRate = v;
  }

  /**
   * Get current reaction rate (for coupling)
   */
  getReactionRate(): number {
    return this.state.reactionRate;
  }

  /**
   * Get heat release rate from reaction
   *
   * Q = -ΔH · v
   *
   * For exothermic reactions (ΔH < 0):
   * - Q > 0 (heat is released)
   *
   * For endothermic reactions (ΔH > 0):
   * - Q < 0 (heat is absorbed)
   */
  getHeatRate(): number {
    return -this.state.delta_H * this.state.reactionRate;
  }

  /**
   * Get chemical potential energy stored in substrate
   *
   * E_chem = -ΔH × [S]
   *
   * For exothermic (ΔH < 0):
   *   - E_chem = -(-50000) × [S] = +50000 × [S] (positive)
   *   - As [S] decreases, E_chem decreases (energy released)
   * For endothermic (ΔH > 0):
   *   - E_chem = -(+50000) × [S] = -50000 × [S] (negative)
   *   - As [S] decreases, E_chem increases (energy absorbed)
   */
  getChemicalEnergy(): number {
    return -this.state.delta_H * this.state.concentration;
  }

  /**
   * Get fraction of substrate consumed
   */
  getConversion(initial_concentration: number): number {
    if (initial_concentration <= 0) return 0;
    return 1 - this.state.concentration / initial_concentration;
  }
}
