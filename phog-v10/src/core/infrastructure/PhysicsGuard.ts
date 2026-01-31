/**
 * PHOG V10 - Tier 1 Infrastructure: Dimensional Analysis
 *
 * PhysicsGuard.ts - Automatic dimensional checking for all calculations
 */

import { DimensionalValue } from './DimensionalValue.js';
import { DimensionVector, DIMENSIONS } from './Dimensions.js';

/**
 * Error record for dimensional violations
 */
interface DimensionalError {
  type: 'equation' | 'derivative' | 'integral' | 'constraint';
  context: string;
  message: string;
  timestamp: number;
}

/**
 * Physics Guard: Automatic dimensional checking for all calculations
 */
export class PhysicsGuard {
  private static errorLog: DimensionalError[] = [];
  private static enabled: boolean = true;

  /**
   * Enable/disable dimensional checking
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if guard is enabled
   */
  static isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Verify equation is dimensionally consistent
   * Example: F = ma → [Force] = [Mass] × [Acceleration]
   */
  static verifyEquation(
    lhs: DimensionalValue,
    rhs: DimensionalValue,
    equationName: string
  ): boolean {
    if (!this.enabled) return true;

    if (!lhs.dimension.equals(rhs.dimension)) {
      const error: DimensionalError = {
        type: 'equation',
        context: equationName,
        message:
          `DIMENSIONAL ERROR in ${equationName}:\n` +
          `  LHS: ${lhs.dimension}\n` +
          `  RHS: ${rhs.dimension}\n` +
          `  Values: ${lhs.value.toExponential(2)} ≠ ${rhs.value.toExponential(2)}`,
        timestamp: Date.now()
      };

      this.errorLog.push(error);
      console.error(error.message);
      return false;
    }
    return true;
  }

  /**
   * Check derivative dimensions
   * d/dx: reduces dimension by [Length]
   * d/dt: reduces dimension by [Time]
   */
  static verifyDerivative(
    quantity: DimensionalValue,
    derivative: DimensionalValue,
    wrt: 'space' | 'time',
    context?: string
  ): boolean {
    if (!this.enabled) return true;

    const expectedDim = wrt === 'space'
      ? quantity.dimension.divide(DIMENSIONS.LENGTH)
      : quantity.dimension.divide(DIMENSIONS.TIME);

    if (!derivative.dimension.equals(expectedDim)) {
      const error: DimensionalError = {
        type: 'derivative',
        context: context || 'derivative',
        message:
          `DERIVATIVE ERROR${context ? ` in ${context}` : ''}:\n` +
          `  Quantity: ${quantity.dimension}\n` +
          `  Expected d/d${wrt === 'space' ? 'x' : 't'}: ${expectedDim}\n` +
          `  Got: ${derivative.dimension}`,
        timestamp: Date.now()
      };

      this.errorLog.push(error);
      console.error(error.message);
      return false;
    }
    return true;
  }

  /**
   * Verify integral dimensions
   * ∫dx: increases dimension by [Length]
   * ∫dt: increases dimension by [Time]
   */
  static verifyIntegral(
    integrand: DimensionalValue,
    result: DimensionalValue,
    wrt: 'space' | 'time',
    context?: string
  ): boolean {
    if (!this.enabled) return true;

    const expectedDim = wrt === 'space'
      ? integrand.dimension.multiply(DIMENSIONS.LENGTH)
      : integrand.dimension.multiply(DIMENSIONS.TIME);

    if (!result.dimension.equals(expectedDim)) {
      const error: DimensionalError = {
        type: 'integral',
        context: context || 'integral',
        message:
          `INTEGRAL ERROR${context ? ` in ${context}` : ''}:\n` +
          `  Integrand: ${integrand.dimension}\n` +
          `  Expected ∫d${wrt === 'space' ? 'x' : 't'}: ${expectedDim}\n` +
          `  Got: ${result.dimension}`,
        timestamp: Date.now()
      };

      this.errorLog.push(error);
      console.error(error.message);
      return false;
    }
    return true;
  }

  /**
   * Verify conservation law dimensions
   * All terms in conservation equation must have same dimensions
   */
  static verifyConservation(
    terms: DimensionalValue[],
    context: string
  ): boolean {
    if (!this.enabled) return true;
    if (terms.length < 2) return true;

    const baseDim = terms[0].dimension;

    for (let i = 1; i < terms.length; i++) {
      if (!terms[i].dimension.equals(baseDim)) {
        const error: DimensionalError = {
          type: 'constraint',
          context,
          message:
            `CONSERVATION ERROR in ${context}:\n` +
            `  Term 0: ${baseDim}\n` +
            `  Term ${i}: ${terms[i].dimension}\n` +
            `  All terms must have identical dimensions`,
          timestamp: Date.now()
        };

        this.errorLog.push(error);
        console.error(error.message);
        return false;
      }
    }
    return true;
  }

  /**
   * Verify that a ratio is dimensionless
   */
  static verifyDimensionless(
    value: DimensionalValue,
    context: string
  ): boolean {
    if (!this.enabled) return true;

    if (!value.isDimensionless()) {
      const error: DimensionalError = {
        type: 'constraint',
        context,
        message:
          `DIMENSIONLESS ERROR in ${context}:\n` +
          `  Expected: [dimensionless]\n` +
          `  Got: ${value.dimension}`,
        timestamp: Date.now()
      };

      this.errorLog.push(error);
      console.error(error.message);
      return false;
    }
    return true;
  }

  /**
   * Get error log
   */
  static getErrors(): DimensionalError[] {
    return [...this.errorLog];
  }

  /**
   * Get error count
   */
  static getErrorCount(): number {
    return this.errorLog.length;
  }

  /**
   * Clear error log
   */
  static clearErrors(): void {
    this.errorLog = [];
  }

  /**
   * Throw if any errors accumulated
   */
  static assertNoErrors(): void {
    if (this.errorLog.length > 0) {
      const messages = this.errorLog.map(e => e.message).join('\n\n');
      throw new Error(
        `Physics Guard detected ${this.errorLog.length} dimensional errors:\n` +
        messages
      );
    }
  }

  /**
   * Print error summary
   */
  static printSummary(): void {
    if (this.errorLog.length === 0) {
      console.log('PhysicsGuard: No dimensional errors detected');
      return;
    }

    console.log(`PhysicsGuard: ${this.errorLog.length} dimensional errors:`);

    const byType = new Map<string, number>();
    for (const error of this.errorLog) {
      byType.set(error.type, (byType.get(error.type) || 0) + 1);
    }

    for (const [type, count] of byType) {
      console.log(`  ${type}: ${count}`);
    }
  }
}

/**
 * Decorator for methods that should be dimensionally checked
 */
export function dimensionalCheck(context: string) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args: any[]) {
      const result = originalMethod.apply(this, args);

      // If result is DimensionalValue, log it for tracking
      if (result instanceof DimensionalValue) {
        // Could add automatic logging here
      }

      return result;
    };

    return descriptor;
  };
}
