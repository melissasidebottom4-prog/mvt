/**
 * PHOG V10 - Tier 1 Infrastructure: Dimensional Analysis
 *
 * Dimensions.ts - Power vectors using Buckingham Pi theorem
 *
 * Dimensions encoded as power vectors [L, M, T, I, Θ]
 * - L: Length (meters)
 * - M: Mass (kilograms)
 * - T: Time (seconds)
 * - I: Electric current (amperes)
 * - Θ: Temperature (kelvin)
 */

export class DimensionVector {
  // Powers: [L, M, T, I, Θ]
  readonly powers: readonly [number, number, number, number, number];

  constructor(L: number, M: number, T: number, I: number = 0, Theta: number = 0) {
    this.powers = [L, M, T, I, Theta];
  }

  /**
   * Check if dimensionally equal to another vector
   */
  equals(other: DimensionVector): boolean {
    return this.powers.every((p, i) => Math.abs(p - other.powers[i]) < 1e-10);
  }

  /**
   * Multiply dimensions (add powers)
   */
  multiply(other: DimensionVector): DimensionVector {
    return new DimensionVector(
      this.powers[0] + other.powers[0],
      this.powers[1] + other.powers[1],
      this.powers[2] + other.powers[2],
      this.powers[3] + other.powers[3],
      this.powers[4] + other.powers[4]
    );
  }

  /**
   * Divide dimensions (subtract powers)
   */
  divide(other: DimensionVector): DimensionVector {
    return new DimensionVector(
      this.powers[0] - other.powers[0],
      this.powers[1] - other.powers[1],
      this.powers[2] - other.powers[2],
      this.powers[3] - other.powers[3],
      this.powers[4] - other.powers[4]
    );
  }

  /**
   * Raise to power
   */
  pow(exponent: number): DimensionVector {
    return new DimensionVector(
      this.powers[0] * exponent,
      this.powers[1] * exponent,
      this.powers[2] * exponent,
      this.powers[3] * exponent,
      this.powers[4] * exponent
    );
  }

  /**
   * Check if dimensionless
   */
  isDimensionless(): boolean {
    return this.powers.every(p => Math.abs(p) < 1e-10);
  }

  /**
   * String representation
   */
  toString(): string {
    const parts: string[] = [];
    const labels = ['L', 'M', 'T', 'I', 'Θ'];

    for (let i = 0; i < 5; i++) {
      const p = this.powers[i];
      if (Math.abs(p) > 1e-10) {
        parts.push(p === 1 ? labels[i] : `${labels[i]}^${p}`);
      }
    }

    return parts.length > 0 ? `[${parts.join(' ')}]` : '[dimensionless]';
  }
}

/**
 * Standard physical dimensions
 */
export const DIMENSIONS = {
  // Base dimensions
  DIMENSIONLESS: new DimensionVector(0, 0, 0, 0, 0),
  LENGTH: new DimensionVector(1, 0, 0, 0, 0),
  MASS: new DimensionVector(0, 1, 0, 0, 0),
  TIME: new DimensionVector(0, 0, 1, 0, 0),
  CURRENT: new DimensionVector(0, 0, 0, 1, 0),
  TEMPERATURE: new DimensionVector(0, 0, 0, 0, 1),

  // Derived dimensions (kinematic)
  VELOCITY: new DimensionVector(1, 0, -1, 0, 0),        // L/T
  ACCELERATION: new DimensionVector(1, 0, -2, 0, 0),     // L/T²
  AREA: new DimensionVector(2, 0, 0, 0, 0),              // L²
  VOLUME: new DimensionVector(3, 0, 0, 0, 0),            // L³

  // Derived dimensions (dynamic)
  FORCE: new DimensionVector(1, 1, -2, 0, 0),            // M L/T²
  ENERGY: new DimensionVector(2, 1, -2, 0, 0),           // M L²/T²
  POWER: new DimensionVector(2, 1, -3, 0, 0),            // M L²/T³
  PRESSURE: new DimensionVector(-1, 1, -2, 0, 0),        // M/(L T²)
  MOMENTUM: new DimensionVector(1, 1, -1, 0, 0),         // M L/T

  // Fluid dynamics
  DENSITY: new DimensionVector(-3, 1, 0, 0, 0),          // M/L³
  VISCOSITY_KINEMATIC: new DimensionVector(2, 0, -1, 0, 0), // L²/T (ν)
  VISCOSITY_DYNAMIC: new DimensionVector(-1, 1, -1, 0, 0),  // M/(L T) (μ)
  VORTICITY: new DimensionVector(0, 0, -1, 0, 0),        // 1/T

  // Electromagnetic
  CHARGE: new DimensionVector(0, 0, 1, 1, 0),            // I T
  VOLTAGE: new DimensionVector(2, 1, -3, -1, 0),         // M L²/(T³ I)
  ELECTRIC_FIELD: new DimensionVector(1, 1, -3, -1, 0),  // M L/(T³ I)
  MAGNETIC_FIELD: new DimensionVector(0, 1, -2, -1, 0),  // M/(T² I)
  PERMITTIVITY: new DimensionVector(-3, -1, 4, 2, 0),    // I² T⁴/(M L³)

  // Quantum mechanics
  ACTION: new DimensionVector(2, 1, -1, 0, 0),           // M L²/T (ℏ)
  WAVEFUNCTION_1D: new DimensionVector(-0.5, 0, 0, 0, 0), // L^(-1/2)
  WAVEFUNCTION_3D: new DimensionVector(-1.5, 0, 0, 0, 0), // L^(-3/2)

  // Thermodynamics
  ENTROPY: new DimensionVector(2, 1, -2, 0, -1),         // M L²/(T² Θ)
  HEAT_CAPACITY: new DimensionVector(2, 1, -2, 0, -1),   // M L²/(T² Θ)

  // General relativity (geometric units where G=c=1)
  SPACETIME_CURVATURE: new DimensionVector(-2, 0, 0, 0, 0), // 1/L²
  RICCI_SCALAR: new DimensionVector(-2, 0, 0, 0, 0),        // 1/L²
} as const;
