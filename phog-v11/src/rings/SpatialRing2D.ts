import { IPhysicalRing, EnergyContributions, EntropySignature, KinematicState, CouplingData } from './IPhysicalRing.js';
import { NavierStokes2D } from './spatial/NavierStokes2D.js';

export class SpatialRing2D implements IPhysicalRing {
  readonly id: string;
  readonly type = 'spatial_2d';
  private solver: NavierStokes2D;

  constructor(id: string, Nx: number, Ny: number, Lx: number, Ly: number, nu: number) {
    this.id = id;
    this.solver = new NavierStokes2D(Nx, Ny, Lx, Ly, nu);
  }

  spin(dt: number): void {}

  getEnergyTensor(): EnergyContributions {
    return { kinetic: 1e-6, potential: 0, thermal: 0, chemical: 0, electromagnetic: 0, quantum: 0, total: 1e-6 };
  }

  getEntropyState(): EntropySignature {
    return { thermal: 0, configurational: 0, information: 0, irreversible: 0, total: 0 };
  }

  getMassMomentum(): KinematicState {
    return { mass: 0, momentum: {x:0,y:0,z:0}, angular_momentum: {x:0,y:0,z:0}, center_of_mass: {x:0,y:0,z:0} };
  }

  getCouplingData(targetRing: string): CouplingData {
    return { energy_flux: 0, momentum_flux: {x:0,y:0,z:0}, entropy_flux: 0 };
  }

  receiveCouplingData(sourceRing: string, data: CouplingData): void {
    if (data.field_values?.memory) {
      this.solver.setMemoryModulatedViscosity(data.field_values.memory);
    }
  }

  getState(): any {
    return this.solver;
  }

  setState(state: any): void {}
}
