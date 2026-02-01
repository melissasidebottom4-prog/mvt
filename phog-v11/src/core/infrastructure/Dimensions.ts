export class DimensionVector {
  readonly powers: readonly [number, number, number, number, number];

  constructor(L: number, M: number, T: number, I: number = 0, Theta: number = 0) {
    this.powers = [L, M, T, I, Theta];
  }

  equals(other: DimensionVector): boolean {
    return this.powers.every((p, i) => Math.abs(p - other.powers[i]) < 1e-10);
  }

  multiply(other: DimensionVector): DimensionVector {
    return new DimensionVector(
      this.powers[0] + other.powers[0],
      this.powers[1] + other.powers[1],
      this.powers[2] + other.powers[2],
      this.powers[3] + other.powers[3],
      this.powers[4] + other.powers[4]
    );
  }

  divide(other: DimensionVector): DimensionVector {
    return new DimensionVector(
      this.powers[0] - other.powers[0],
      this.powers[1] - other.powers[1],
      this.powers[2] - other.powers[2],
      this.powers[3] - other.powers[3],
      this.powers[4] - other.powers[4]
    );
  }

  pow(exponent: number): DimensionVector {
    return new DimensionVector(
      this.powers[0] * exponent,
      this.powers[1] * exponent,
      this.powers[2] * exponent,
      this.powers[3] * exponent,
      this.powers[4] * exponent
    );
  }

  isDimensionless(): boolean {
    return this.powers.every(p => Math.abs(p) < 1e-10);
  }

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

export const DIMENSIONS = {
  DIMENSIONLESS: new DimensionVector(0, 0, 0, 0, 0),
  LENGTH: new DimensionVector(1, 0, 0, 0, 0),
  MASS: new DimensionVector(0, 1, 0, 0, 0),
  TIME: new DimensionVector(0, 0, 1, 0, 0),
  TEMPERATURE: new DimensionVector(0, 0, 0, 0, 1),

  VELOCITY: new DimensionVector(1, 0, -1, 0, 0),
  ACCELERATION: new DimensionVector(1, 0, -2, 0, 0),
  FORCE: new DimensionVector(1, 1, -2, 0, 0),
  ENERGY: new DimensionVector(2, 1, -2, 0, 0),
  POWER: new DimensionVector(2, 1, -3, 0, 0),

  DENSITY: new DimensionVector(-3, 1, 0, 0, 0),
  VISCOSITY_KINEMATIC: new DimensionVector(2, 0, -1, 0, 0),
  WAVEFUNCTION_1D: new DimensionVector(-0.5, 0, 0, 0, 0),

  ACTION: new DimensionVector(2, 1, -1, 0, 0),
  ENTROPY: new DimensionVector(2, 1, -2, 0, -1),
} as const;
