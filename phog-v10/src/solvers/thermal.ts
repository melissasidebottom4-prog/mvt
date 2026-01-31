/**
 * PHOG V10 - Thermal Solver
 *
 * Handles temperature evolution from heat inputs.
 * Uses simple Euler integration (temperature changes are typically slow).
 */

export interface ThermalState {
  temperature: number;  // K
  cp: number;           // J/(kg·K) - specific heat capacity
  mass: number;         // kg
  heatInput: number;    // W (accumulated from couplings)
}

export class ThermalSolver {
  state: ThermalState = {
    temperature: 298.15,  // Room temperature (K)
    cp: 1000,             // Generic solid (J/kg·K)
    mass: 1,              // kg
    heatInput: 0          // W
  };

  /**
   * Initialize with state
   */
  init(temperature: number, cp: number, mass: number): void {
    this.state.temperature = temperature;
    this.state.cp = cp;
    this.state.mass = mass;
    this.state.heatInput = 0;
  }

  /**
   * Step forward in time
   *
   * Physics:
   * - Heat capacity: Q = m·cp·ΔT
   * - Therefore: ΔT = Q / (m·cp)
   * - With power input P: dT/dt = P / (m·cp)
   */
  step(dt: number): void {
    // Temperature change from heat input
    // dT = (P · dt) / (m · cp) = Q / (m · cp)
    const dT = (this.state.heatInput * dt) / (this.state.mass * this.state.cp);
    this.state.temperature += dT;

    // Ensure temperature stays positive (absolute zero limit)
    if (this.state.temperature < 0) {
      this.state.temperature = 0.001; // Near absolute zero
    }

    // Reset heat input for next step
    this.state.heatInput = 0;
  }

  /**
   * Add heat power (from coupling)
   * Positive = heating, Negative = cooling
   */
  addHeat(P: number): void {
    this.state.heatInput += P;
  }

  /**
   * Get internal (thermal) energy
   * U = m · cp · T
   */
  getInternalEnergy(): number {
    return this.state.mass * this.state.cp * this.state.temperature;
  }

  /**
   * Get thermal entropy (relative to T_ref = 298.15 K)
   * S = m · cp · ln(T / T_ref)
   */
  getEntropy(T_ref: number = 298.15): number {
    if (this.state.temperature <= 0) return 0;
    return this.state.mass * this.state.cp * Math.log(this.state.temperature / T_ref);
  }

  /**
   * Get heat capacity (total, not specific)
   */
  getHeatCapacity(): number {
    return this.state.mass * this.state.cp;
  }
}
