export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface EnergyContributions {
  kinetic: number;
  potential: number;
  thermal: number;
  chemical: number;
  electromagnetic: number;
  quantum: number;
  total: number;
}

export interface EntropySignature {
  thermal: number;
  configurational: number;
  information: number;
  irreversible: number;
  total: number;
}

export interface KinematicState {
  mass: number;
  momentum: Vector3D;
  angular_momentum: Vector3D;
  center_of_mass: Vector3D;
}

export interface CouplingData {
  energy_flux: number;
  momentum_flux: Vector3D;
  entropy_flux: number;
  field_values?: Record<string, any>;
}

export interface IPhysicalRing {
  readonly id: string;
  readonly type: string;

  spin(dt: number): void;
  getEnergyTensor(): EnergyContributions;
  getEntropyState(): EntropySignature;
  getMassMomentum(): KinematicState;
  getCouplingData(targetRing: string): CouplingData;
  receiveCouplingData(sourceRing: string, data: CouplingData): void;
  getState(): any;
  setState(state: any): void;
}
