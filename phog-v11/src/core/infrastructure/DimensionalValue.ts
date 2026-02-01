import { DimensionVector } from './Dimensions.js';

export class DimensionalValue {
  readonly value: number;
  readonly dimension: DimensionVector;
  readonly name?: string;

  constructor(value: number, dimension: DimensionVector, name?: string) {
    if (!isFinite(value)) {
      throw new Error(`Invalid value: ${value} for ${name || 'quantity'}`);
    }
    this.value = value;
    this.dimension = dimension;
    this.name = name;
  }

  add(other: DimensionalValue): DimensionalValue {
    if (!this.dimension.equals(other.dimension)) {
      throw new Error(
        `Dimension mismatch in addition: ${this.dimension} + ${other.dimension}`
      );
    }
    return new DimensionalValue(this.value + other.value, this.dimension, this.name);
  }

  multiply(other: DimensionalValue): DimensionalValue {
    return new DimensionalValue(
      this.value * other.value,
      this.dimension.multiply(other.dimension)
    );
  }

  divide(other: DimensionalValue): DimensionalValue {
    if (Math.abs(other.value) < 1e-100) {
      throw new Error(`Division by zero`);
    }
    return new DimensionalValue(
      this.value / other.value,
      this.dimension.divide(other.dimension)
    );
  }

  assertDimensions(expected: DimensionVector, context?: string): void {
    if (!this.dimension.equals(expected)) {
      throw new Error(
        `Dimension mismatch${context ? ` in ${context}` : ''}: ` +
        `expected ${expected}, got ${this.dimension}`
      );
    }
  }
}
