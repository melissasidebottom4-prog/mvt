/**
 * PHOG V10 - Phase 6: 5-State Space Ring (Water Memory Substrate)
 *
 * Quantum superposition of 5 matter states:
 *   |ψ⟩ = α|solid⟩ + β|liquid⟩ + γ|gas⟩ + δ|plasma⟩ + ε|BEC⟩
 *
 * WATER MEMORY MECHANISM:
 *   - Succussion creates off-diagonal Hamiltonian elements (H_ij, i≠j)
 *   - These imaginary components encode "memory" as quantum coherence
 *   - Temperature-dependent decoherence: decay rate ∝ kB·T
 *   - Memory persists beyond Avogadro limit (C30 potency)
 *
 * STATE ENERGIES (relative to liquid):
 *   Solid:  0.0 eV (crystalline, structured)
 *   Liquid: 0.1 eV (reference, hydrogen bonded)
 *   Gas:    2.5 eV (vaporization energy)
 *   Plasma: 13.6 eV (ionization)
 *   BEC:   -0.05 eV (coherent ground state)
 */

import {
  PhysicalRingBase,
  EnergyContributions,
  EntropySignature,
  KinematicState,
  CouplingData
} from './IPhysicalRing.js';

export interface Complex {
  re: number;
  im: number;
}

export interface StateVector {
  solid: Complex;
  liquid: Complex;
  gas: Complex;
  plasma: Complex;
  bec: Complex;
}

/**
 * Succussion strengths (homeopathic potencies)
 * Higher values = more vigorous succussion = stronger memory imprint
 */
export enum SuccussionStrength {
  D6 = 0.1,    // 10^-6 dilution
  D12 = 0.5,   // 10^-12 dilution
  C30 = 1.0,   // 10^-60 dilution (beyond Avogadro)
  C200 = 5.0,  // 10^-400 dilution
  LM1 = 10.0   // 1:50,000 dilution
}

export class StateSpaceRing extends PhysicalRingBase {
  readonly id = 'state_space';
  readonly name = '5-State Ring (Water Memory)';

  // Quantum state vector
  state: StateVector;

  // Hamiltonian matrix (5x5 complex)
  private H: Complex[][];

  // Thermodynamic conditions
  temperature: number;  // K
  pressure: number;     // Pa

  // Physical constants
  private readonly hbar = 1.055e-34;  // J·s
  private readonly kB = 1.381e-23;    // J/K

  // State energies (eV)
  private readonly E_solid = 0.0;
  private readonly E_liquid = 0.1;
  private readonly E_gas = 2.5;
  private readonly E_plasma = 13.6;
  private readonly E_bec = -0.05;

  // Initial state for reset
  private initialState: StateVector;
  private initialH: Complex[][];

  constructor(temperature: number = 298.15, pressure: number = 101325) {
    super();
    this.temperature = temperature;
    this.pressure = pressure;

    // Initialize in pure liquid state
    this.state = {
      solid: { re: 0, im: 0 },
      liquid: { re: 1, im: 0 },
      gas: { re: 0, im: 0 },
      plasma: { re: 0, im: 0 },
      bec: { re: 0, im: 0 }
    };

    this.H = this.buildHamiltonian();

    // Store initial state
    this.initialState = this.cloneState(this.state);
    this.initialH = this.cloneHamiltonian(this.H);
  }

  /**
   * Build the 5x5 Hamiltonian matrix
   *
   * Diagonal: state energies
   * Off-diagonal: thermal coupling (real) + memory (imaginary)
   */
  private buildHamiltonian(): Complex[][] {
    const H: Complex[][] = Array(5).fill(null).map(() =>
      Array(5).fill(null).map(() => ({ re: 0, im: 0 }))
    );

    const eV_to_J = 1.6e-19;

    // Diagonal elements (state energies)
    H[0][0] = { re: this.E_solid * eV_to_J, im: 0 };
    H[1][1] = { re: this.E_liquid * eV_to_J, im: 0 };
    H[2][2] = { re: this.E_gas * eV_to_J, im: 0 };
    H[3][3] = { re: this.E_plasma * eV_to_J, im: 0 };
    H[4][4] = { re: this.E_bec * eV_to_J, im: 0 };

    // Off-diagonal coupling (thermally activated transitions)
    const coupling = this.kB * this.temperature * 0.01;

    // Solid ↔ Liquid (strongest, ice-water transition)
    H[0][1] = H[1][0] = { re: coupling, im: 0 };

    // Liquid ↔ Gas (evaporation)
    H[1][2] = H[2][1] = { re: coupling * 0.5, im: 0 };

    // Gas ↔ Plasma (ionization, weak at low T)
    H[2][3] = H[3][2] = { re: coupling * 0.01, im: 0 };

    // Liquid ↔ BEC (quantum coherence, extremely weak)
    H[1][4] = H[4][1] = { re: coupling * 0.001, im: 0 };

    return H;
  }

  /**
   * Apply succussion (vigorous shaking)
   *
   * Creates off-diagonal imaginary elements in H.
   * These encode "memory" as quantum phase coherence.
   */
  applySuccussion(strength: SuccussionStrength): void {
    const perturbation = strength * 1e-23;

    // Add imaginary off-diagonal elements
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        // Random phase imprint (memory encoding)
        this.H[i][j].im += perturbation * (Math.random() - 0.5);
        // Hermitian: H_ji = H_ij*
        this.H[j][i].im = -this.H[i][j].im;
      }
    }
  }

  /**
   * Get memory coherence (sum of off-diagonal imaginary magnitudes)
   *
   * This quantifies the "memory" stored in the water structure.
   * Non-zero value = information persists beyond molecular dilution.
   */
  getMemoryCoherence(): number {
    let magnitude = 0;

    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        magnitude += Math.abs(this.H[i][j].im);
      }
    }

    return magnitude;
  }

  /**
   * Apply thermal decoherence
   *
   * Memory decays at rate ∝ kB·T (faster at higher temperature)
   * Decay rate scaled for millisecond-scale fluid simulations:
   *   ~10% decay per millisecond at room temperature
   */
  private applyDecoherence(dt: number): void {
    // Decoherence rate: γ = kB·T / ℏ (natural unit)
    // Scaled so decay is observable but doesn't wipe out memory instantly
    // At T=298K, dt=1e-4s: gamma ≈ 0.04 → ~4% decay per step
    const gamma = (this.kB * this.temperature / this.hbar) * dt * 1e-12;

    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        this.H[i][j].im *= Math.exp(-gamma);
        this.H[j][i].im = -this.H[i][j].im;
      }
    }
  }

  /**
   * Step forward in time using Schrödinger equation
   *
   * iℏ·∂ψ/∂t = H·ψ
   *
   * With probability normalization for exact conservation.
   */
  step(dt: number, _params?: Record<string, number>): number {
    const E_before = this.getEnergy().total;

    // State vector as array
    const psi = [
      this.state.solid,
      this.state.liquid,
      this.state.gas,
      this.state.plasma,
      this.state.bec
    ];

    // Compute H|ψ⟩
    const Hpsi: Complex[] = Array(5).fill(null).map(() => ({ re: 0, im: 0 }));

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        // Complex multiplication: H[i][j] * psi[j]
        const re = this.H[i][j].re * psi[j].re - this.H[i][j].im * psi[j].im;
        const im = this.H[i][j].re * psi[j].im + this.H[i][j].im * psi[j].re;

        Hpsi[i].re += re;
        Hpsi[i].im += im;
      }
    }

    // Time evolution: ψ += (dt/iℏ) H|ψ⟩ = -(i·dt/ℏ) H|ψ⟩
    // ∂ψ_re/∂t = +(1/ℏ) (Hψ)_im
    // ∂ψ_im/∂t = -(1/ℏ) (Hψ)_re
    const factor = dt / this.hbar;

    for (let i = 0; i < 5; i++) {
      psi[i].re += factor * Hpsi[i].im;
      psi[i].im -= factor * Hpsi[i].re;
    }

    // Normalize for probability conservation
    let norm = 0;
    for (let i = 0; i < 5; i++) {
      norm += psi[i].re * psi[i].re + psi[i].im * psi[i].im;
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < 5; i++) {
        psi[i].re /= norm;
        psi[i].im /= norm;
      }
    }

    // Update state
    this.state.solid = psi[0];
    this.state.liquid = psi[1];
    this.state.gas = psi[2];
    this.state.plasma = psi[3];
    this.state.bec = psi[4];

    // Apply thermal decoherence to memory
    this.applyDecoherence(dt);

    return this.getEnergy().total - E_before;
  }

  /**
   * Get state probabilities
   */
  getProbabilities(): number[] {
    return [
      this.state.solid.re * this.state.solid.re + this.state.solid.im * this.state.solid.im,
      this.state.liquid.re * this.state.liquid.re + this.state.liquid.im * this.state.liquid.im,
      this.state.gas.re * this.state.gas.re + this.state.gas.im * this.state.gas.im,
      this.state.plasma.re * this.state.plasma.re + this.state.plasma.im * this.state.plasma.im,
      this.state.bec.re * this.state.bec.re + this.state.bec.im * this.state.bec.im
    ];
  }

  /**
   * Get total probability (should be 1.0)
   */
  getTotalProbability(): number {
    return this.getProbabilities().reduce((sum, p) => sum + p, 0);
  }

  /**
   * Get energy contributions
   */
  getEnergy(): EnergyContributions {
    const probs = this.getProbabilities();
    const eV_to_J = 1.6e-19;

    const E_total = (
      this.E_solid * probs[0] +
      this.E_liquid * probs[1] +
      this.E_gas * probs[2] +
      this.E_plasma * probs[3] +
      this.E_bec * probs[4]
    ) * eV_to_J;

    return {
      kinetic: 0,
      potential: E_total * (probs[0] + probs[4]),  // Solid + BEC (structured)
      internal: E_total * (probs[1] + probs[2] + probs[3]),  // Liquid + Gas + Plasma
      total: E_total
    };
  }

  /**
   * Get entropy signature
   *
   * Von Neumann entropy: S = -kB Σ p_i ln(p_i)
   */
  getEntropy(): EntropySignature {
    const probs = this.getProbabilities();

    let S = 0;
    for (let i = 0; i < 5; i++) {
      if (probs[i] > 1e-15) {
        S -= probs[i] * Math.log(probs[i]);
      }
    }
    S *= this.kB;

    return {
      thermal: S,
      irreversible: this.entropyProduced,
      total: S + this.entropyProduced
    };
  }

  /**
   * Get kinematic state (aggregate)
   */
  getKinematicState(): KinematicState {
    const probs = this.getProbabilities();
    return {
      position: probs[1],  // Liquid fraction as "position"
      velocity: 0,
      mass: 18e-3  // Water molar mass (kg/mol)
    };
  }

  /**
   * Absorb energy (heating)
   */
  absorbEnergy(amount: number): number {
    // Energy absorption shifts population toward higher states
    const eV_to_J = 1.6e-19;
    const shift = amount / (this.E_gas * eV_to_J);

    // Transfer some population from liquid to gas
    if (shift > 0 && this.state.liquid.re > shift * 0.01) {
      this.state.liquid.re -= shift * 0.01;
      this.state.gas.re += shift * 0.01;
    }

    return amount;
  }

  /**
   * Get coupling data to other rings
   */
  getCouplingTo(targetId: string): CouplingData | null {
    if (targetId === 'spatial_1d_genome') {
      const probs = this.getProbabilities();
      const memory = this.getMemoryCoherence();

      // Water state modulates DNA potential:
      // - Dielectric screening (ε_r depends on water structure)
      // - Phonon coupling (memory coherence affects vibrational modes)
      const epsilon_r = 80 * probs[1] + 3 * probs[0] + 1 * probs[2];
      const dielectric_factor = 1.0 / Math.sqrt(epsilon_r);
      const phonon_coupling = memory * 1e20;

      return {
        energyFlux: phonon_coupling * this.kB * this.temperature,
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
    this.state = this.cloneState(this.initialState);
    this.H = this.cloneHamiltonian(this.initialH);
    this.entropyProduced = 0;
  }

  /**
   * Serialize for receipts
   */
  serialize(): Record<string, number> {
    const probs = this.getProbabilities();
    return {
      P_solid: probs[0],
      P_liquid: probs[1],
      P_gas: probs[2],
      P_plasma: probs[3],
      P_bec: probs[4],
      P_total: this.getTotalProbability(),
      memory_coherence: this.getMemoryCoherence(),
      temperature: this.temperature,
      entropy: this.getEntropy().total
    };
  }

  // Helper methods
  private cloneState(s: StateVector): StateVector {
    return {
      solid: { re: s.solid.re, im: s.solid.im },
      liquid: { re: s.liquid.re, im: s.liquid.im },
      gas: { re: s.gas.re, im: s.gas.im },
      plasma: { re: s.plasma.re, im: s.plasma.im },
      bec: { re: s.bec.re, im: s.bec.im }
    };
  }

  private cloneHamiltonian(H: Complex[][]): Complex[][] {
    return H.map(row => row.map(c => ({ re: c.re, im: c.im })));
  }
}
