export const GR_CONSTANTS = {
  G: 1,
  c: 1,
  SIGNATURE: [-1, 1, 1, 1] as const,
  COORDS: { TIME: 0, RADIAL: 1, THETA: 2, PHI: 3 } as const,
  SPACETIME_DIM: 4,
  TOLERANCE: {
    METRIC_INVERSE: 1e-14,
    RICCI_VACUUM: 1e-10,
    SYMMETRY: 1e-16,
    ZERO_COMPONENT: 1e-14
  }
} as const;

export const COORD_NAMES = ['t', 'r', 'θ', 'φ'] as const;
