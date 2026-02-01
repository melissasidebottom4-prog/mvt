export interface BoundSpec {
  min?: number;
  max?: number;
  strict_min?: boolean;
  strict_max?: boolean;
  units?: string;
  description?: string;
}

export class PhysicalBounds {
  private static bounds = new Map<string, BoundSpec>();

  static initialize(): void {
    this.register('temperature', { min: 0, strict_min: true, units: 'K' });
    this.register('density', { min: 0, strict_min: true, units: 'kg/m³' });
    this.register('probability_density', { min: 0, max: 1, units: 'dimensionless' });
    this.register('mass', { min: 0, units: 'kg' });
    console.log(`Physical bounds initialized with ${this.bounds.size} quantities`);
  }

  static register(quantity: string, bound: BoundSpec): void {
    this.bounds.set(quantity, bound);
  }

  static check(quantity: string, value: number): boolean {
    const bound = this.bounds.get(quantity);
    if (!bound) return true;

    if (!isFinite(value)) return false;
    if (bound.min !== undefined) {
      const below = bound.strict_min ? value <= bound.min : value < bound.min;
      if (below) return false;
    }
    if (bound.max !== undefined) {
      const above = bound.strict_max ? value >= bound.max : value > bound.max;
      if (above) return false;
    }
    return true;
  }

  static assert(quantity: string, value: number): void {
    if (!this.check(quantity, value)) {
      throw new Error(`Physical bound violation: ${quantity} = ${value}`);
    }
  }
}

PhysicalBounds.initialize();
