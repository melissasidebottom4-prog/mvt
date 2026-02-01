import { DimensionalValue } from './DimensionalValue.js';

export class PhysicsGuard {
  private static errorLog: string[] = [];

  static verifyEquation(lhs: DimensionalValue, rhs: DimensionalValue, name: string): boolean {
    if (!lhs.dimension.equals(rhs.dimension)) {
      const error = `DIMENSIONAL ERROR in ${name}: ${lhs.dimension} ≠ ${rhs.dimension}`;
      this.errorLog.push(error);
      console.error(error);
      return false;
    }
    return true;
  }

  static clearErrors(): void {
    this.errorLog = [];
  }

  static assertNoErrors(): void {
    if (this.errorLog.length > 0) {
      throw new Error(`Physics Guard: ${this.errorLog.length} errors detected`);
    }
  }
}
