import { IPhysicalRing, EnergyContributions } from '../rings/IPhysicalRing.js';

export class ConservationCore {
  private rings: Map<string, IPhysicalRing> = new Map();
  private couplings: Array<[string, string]> = [];

  addRing(ring: IPhysicalRing): void {
    this.rings.set(ring.id, ring);
  }

  couple(sourceId: string, targetId: string): void {
    this.couplings.push([sourceId, targetId]);
  }

  initialize(): void {
    for (const [sourceId, targetId] of this.couplings) {
      const source = this.rings.get(sourceId);
      const target = this.rings.get(targetId);
      if (source && target) {
        const data = source.getCouplingData(targetId);
        target.receiveCouplingData(sourceId, data);
      }
    }
  }

  spin(dt: number): void {
    this.initialize();
    for (const ring of this.rings.values()) {
      ring.spin(dt);
    }
  }

  getTotalEnergy(): number {
    let total = 0;
    for (const ring of this.rings.values()) {
      total += ring.getEnergyTensor().total;
    }
    return total;
  }
}
