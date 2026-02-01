export class UnitTestIndex {
  static readonly TEST_CONFIG = {
    M: 1,
    r: 3,
    theta: Math.PI / 4
  } as const;

  static readonly CHRISTOFFEL_VALUES = {
    Gamma_t_tr: 1/3,
    Gamma_r_tt: 1/27,
    Gamma_r_rr: -1/3,
    Gamma_r_theta_theta: -1,
    Gamma_theta_r_theta: 1/3
  } as const;

  static readonly RICCI_VALUES = {
    R_tt: 0,
    R_rr: 0,
    R_scalar: 0
  } as const;
}
