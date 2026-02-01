import { GR_CONSTANTS } from './Constants.js';

export class SymmetryIndex {
  static canonicalLowerIndices(mu: number, nu: number): [number, number] {
    return mu <= nu ? [mu, nu] : [nu, mu];
  }

  static getAllUniqueComponents(): Array<[number, number, number]> {
    const components: Array<[number, number, number]> = [];
    for (let lambda = 0; lambda < GR_CONSTANTS.SPACETIME_DIM; lambda++) {
      for (let mu = 0; mu < GR_CONSTANTS.SPACETIME_DIM; mu++) {
        for (let nu = mu; nu < GR_CONSTANTS.SPACETIME_DIM; nu++) {
          components.push([lambda, mu, nu]);
        }
      }
    }
    return components;
  }
}
