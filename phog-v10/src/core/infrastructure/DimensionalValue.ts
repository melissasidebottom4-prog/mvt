/**
 * PHOG V10 - Tier 1 Infrastructure: Dimensional Analysis
 *
 * DimensionalValue.ts - Physical values with automatic dimensional checking
 */

import { DimensionVector } from './Dimensions.js';

/**
 * A physical value with automatic dimensional checking
 */
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

  /**
   * Add two quantities (must have same dimensions)
   */
  add(other: DimensionalValue): DimensionalValue {
    if (!this.dimension.equals(other.dimension)) {
      throw new Error(
        `Dimension mismatch in addition: ${this.dimension} + ${other.dimension}\n` +
        `Cannot add ${this.name || 'quantity'} to ${other.name || 'quantity'}`
      );
    }
    return new DimensionalValue(
      this.value + other.value,
      this.dimension,
      this.name
    );
  }

  /**
   * Subtract two quantities (must have same dimensions)
   */
  subtract(other: DimensionalValue): DimensionalValue {
    if (!this.dimension.equals(other.dimension)) {
      throw new Error(
        `Dimension mismatch in subtraction: ${this.dimension} - ${other.dimension}\n` +
        `Cannot subtract ${other.name || 'quantity'} from ${this.name || 'quantity'}`
      );
    }
    return new DimensionalValue(
      this.value - other.value,
      this.dimension,
      this.name
    );
  }

  /**
   * Multiply two quantities (dimensions multiply)
   */
  multiply(other: DimensionalValue): DimensionalValue {
    return new DimensionalValue(
      this.value * other.value,
      this.dimension.multiply(other.dimension),
      this.name && other.name ? `${this.name}×${other.name}` : undefined
    );
  }

  /**
   * Divide two quantities (dimensions divide)
   */
  divide(other: DimensionalValue): DimensionalValue {
    if (Math.abs(other.value) < 1e-100) {
      throw new Error(`Division by zero: ${this.name || 'quantity'} / ${other.name || 'quantity'}`);
    }
    return new DimensionalValue(
      this.value / other.value,
      this.dimension.divide(other.dimension),
      this.name && other.name ? `${this.name}/${other.name}` : undefined
    );
  }

  /**
   * Raise to power
   */
  pow(exponent: number): DimensionalValue {
    return new DimensionalValue(
      Math.pow(this.value, exponent),
      this.dimension.pow(exponent),
      this.name ? `(${this.name})^${exponent}` : undefined
    );
  }

  /**
   * Scale by dimensionless number
   */
  scale(factor: number): DimensionalValue {
    return new DimensionalValue(
      this.value * factor,
      this.dimension,
      this.name
    );
  }

  /**
   * Negate value
   */
  negate(): DimensionalValue {
    return new DimensionalValue(
      -this.value,
      this.dimension,
      this.name
    );
  }

  /**
   * Absolute value
   */
  abs(): DimensionalValue {
    return new DimensionalValue(
      Math.abs(this.value),
      this.dimension,
      this.name
    );
  }

  /**
   * Square root (halves dimension powers)
   */
  sqrt(): DimensionalValue {
    if (this.value < 0) {
      throw new Error(`Cannot take sqrt of negative value: ${this.value}`);
    }
    return new DimensionalValue(
      Math.sqrt(this.value),
      this.dimension.pow(0.5),
      this.name ? `√(${this.name})` : undefined
    );
  }

  /**
   * Verify this quantity has expected dimensions
   */
  assertDimensions(expected: DimensionVector, context?: string): void {
    if (!this.dimension.equals(expected)) {
      throw new Error(
        `Dimension mismatch${context ? ` in ${context}` : ''}: ` +
        `expected ${expected}, got ${this.dimension}\n` +
        `Quantity: ${this.name || 'unnamed'} = ${this.value}`
      );
    }
  }

  /**
   * Check if dimensionless
   */
  isDimensionless(): boolean {
    return this.dimension.isDimensionless();
  }

  /**
   * Compare values (must have same dimensions)
   */
  compare(other: DimensionalValue): number {
    if (!this.dimension.equals(other.dimension)) {
      throw new Error(
        `Cannot compare quantities with different dimensions: ` +
        `${this.dimension} vs ${other.dimension}`
      );
    }
    return this.value - other.value;
  }

  /**
   * Check if approximately equal
   */
  approxEquals(other: DimensionalValue, tolerance: number = 1e-10): boolean {
    if (!this.dimension.equals(other.dimension)) {
      return false;
    }
    const maxVal = Math.max(Math.abs(this.value), Math.abs(other.value), 1e-100);
    return Math.abs(this.value - other.value) / maxVal < tolerance;
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.value.toExponential(4)} ${this.dimension}${this.name ? ` (${this.name})` : ''}`;
  }
}

/**
 * Factory functions for common quantities
 */
export const Quantity = {
  /**
   * Create dimensionless quantity
   */
  dimensionless(value: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(value, DIMENSIONS.DIMENSIONLESS, name);
  },

  /**
   * Create length quantity
   */
  length(meters: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(meters, DIMENSIONS.LENGTH, name);
  },

  /**
   * Create mass quantity
   */
  mass(kg: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(kg, DIMENSIONS.MASS, name);
  },

  /**
   * Create time quantity
   */
  time(seconds: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(seconds, DIMENSIONS.TIME, name);
  },

  /**
   * Create energy quantity
   */
  energy(joules: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(joules, DIMENSIONS.ENERGY, name);
  },

  /**
   * Create force quantity
   */
  force(newtons: number, name?: string): DimensionalValue {
    const { DIMENSIONS } = require('./Dimensions.js');
    return new DimensionalValue(newtons, DIMENSIONS.FORCE, name);
  }
};
