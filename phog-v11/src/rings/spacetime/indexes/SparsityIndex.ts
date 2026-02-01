export class SparsityIndex {
  static readonly NON_ZERO_COMPONENTS: ReadonlyArray<[number, number, number]> = [
    [0, 0, 1], // Γ^t_tr
    [1, 0, 0], // Γ^r_tt
    [1, 1, 1], // Γ^r_rr
    [1, 2, 2], // Γ^r_θθ
    [1, 3, 3], // Γ^r_φφ
    [2, 1, 2], // Γ^θ_rθ
    [2, 3, 3], // Γ^θ_φφ
    [3, 1, 3], // Γ^φ_rφ
    [3, 2, 3], // Γ^φ_θφ
  ] as const;

  static isNonZero(lambda: number, mu: number, nu: number): boolean {
    return this.NON_ZERO_COMPONENTS.some(
      ([l, m, n]) => l === lambda && ((m === mu && n === nu) || (m === nu && n === mu))
    );
  }
}
