/**
 * PHOG V10 - Phase 4: Thermal Ring
 *
 * Wraps thermodynamics (temperature, heat capacity, heat transfer).
 * This is the PRIMARY energy sink for dissipative processes.
 *
 * Energy contributions:
 * - Internal: m·cp·T (thermal energy)
 *
 * Key role: Absorbs energy from friction and chemical reactions.
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  EntropySignature,
  KinematicState
} from './IPhysicalRing.js';

export interface ThermalState {
  temperature: number;  // K
  cp: number;          // J/(kg·K) - specific heat capacity
  mass: number;        // kg
}

export class ThermalRing extends PhysicalRingBase {
  readonly id = 'thermal';
  readonly name = 'Thermal Ring (Thermodynamics)';

  private state: ThermalState = {
    temperature: 298.15,  // 25°C
    cp: 1000,
    mass: 1
  };

  // Heat sources (power, W)
  private heatSource: number = 0;

  // Initial state for reset
  private initialState: ThermalState = { ...this.state };

  /**
   * Initialize the ring
   */
  init(temperature: number, cp: number, mass: number): void {
    this.state = {
      temperature,
      cp,
      mass
    };
    this.initialState = { ...this.state };
    this.entropyProduced = 0;
    this.heatSource = 0;
  }

  /**
   * Add heat source power
   */
  addHeatSource(power: number): void {
    this.heatSource += power;
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    // Internal thermal energy: E = m·cp·T
    const internal = this.state.mass * this.state.cp * this.state.temperature;

    return {
      kinetic: 0,
      potential: 0,
      internal,
      total: internal
    };
  }

  /**
   * Get entropy signature
   *
   * Thermal entropy: S = m·cp·ln(T/T_ref)
   * Using reference T_ref = 1 K for absolute entropy
   */
  getEntropy(): EntropySignature {
    const m = this.state.mass;
    const cp = this.state.cp;
    const T = this.state.temperature;

    // Thermal entropy (using T_ref = 1K for simplicity)
    const thermal = m * cp * Math.log(T);

    return {
      thermal,
      irreversible: this.entropyProduced,
      total: thermal + this.entropyProduced
    };
  }

  /**
   * Get kinematic state (thermal doesn't have position/velocity in usual sense)
   */
  getKinematicState(): KinematicState {
    return {
      position: this.state.temperature,  // "position" is temperature
      velocity: 0,                         // No thermal velocity
      mass: this.state.mass
    };
  }

  /**
   * Step forward in time
   *
   * dT/dt = Q̇/(m·cp)
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.getEnergy().total;

    // Apply heat sources
    if (Math.abs(this.heatSource) > 1e-15) {
      const dT = (this.heatSource * dt) / (this.state.mass * this.state.cp);
      this.state.temperature += dT;
    }

    // Clear heat source
    this.heatSource = 0;

    return this.getEnergy().total - E_before;
  }

  /**
   * Absorb energy (primary mechanism for energy reception)
   *
   * Energy absorbed increases temperature:
   * ΔT = Q/(m·cp)
   */
  absorbEnergy(amount: number): number {
    const dT = amount / (this.state.mass * this.state.cp);
    this.state.temperature += dT;
    return amount;  // Thermal ring absorbs all energy
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = { ...this.initialState };
    this.heatSource = 0;
    this.entropyProduced = 0;
  }

  /**
   * Serialize for receipts
   */
  serialize(): Record<string, number> {
    return {
      temperature: this.state.temperature,
      cp: this.state.cp,
      mass: this.state.mass
    };
  }

  /**
   * Direct state access
   */
  getState(): ThermalState {
    return { ...this.state };
  }

  /**
   * Get temperature
   */
  getTemperature(): number {
    return this.state.temperature;
  }
}
