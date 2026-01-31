/**
 * PHOG V10 - Entropy Tracker
 *
 * Tracks irreversible entropy production from dissipative processes.
 * This is what proves the 2nd law holds in multi-physics simulations.
 *
 * Key insight: Entropy has two parts:
 * 1. Reversible (thermal): S = m·cp·ln(T/T_ref) - changes with temperature
 * 2. Irreversible (produced): Always increases from friction, reactions, etc.
 *
 * The 2nd law says: dS_total >= 0, which means dS_irreversible >= -dS_thermal
 * In practice, irreversible production is always positive.
 */

export class EntropyTracker {

  /** Cumulative irreversible entropy production (J/K) - ALWAYS >= 0 */
  public irreversibleProduction: number = 0;

  /** History of entropy production events */
  public history: Array<{
    source: string;
    dS: number;
    t: number;
  }> = [];

  private currentTime: number = 0;

  /**
   * Update internal time (for history tracking)
   */
  setTime(t: number): void {
    this.currentTime = t;
  }

  /**
   * Track entropy from mechanical dissipation (friction)
   *
   * Physics:
   * - Friction force opposes motion: F_friction = -μ·v (or similar)
   * - Power dissipated: P = |F·v| (always positive)
   * - Heat generated: Q = P·dt
   * - Entropy produced: dS = Q/T = P·dt/T
   *
   * This entropy is IRREVERSIBLE - you can't "un-friction" the energy back.
   */
  trackMechanicalDissipation(
    force: number,
    velocity: number,
    temperature: number,
    dt: number
  ): number {
    // Power dissipated (always positive)
    const power = Math.abs(force * velocity);

    // Entropy production rate: dS/dt = P/T
    const dS = (power / temperature) * dt;

    this.irreversibleProduction += dS;
    this.history.push({
      source: 'friction',
      dS,
      t: this.currentTime
    });

    return dS;
  }

  /**
   * Track entropy from chemical reaction heat release
   *
   * Physics:
   * - Exothermic reaction releases heat: Q = -ΔH·v (ΔH < 0 for exothermic)
   * - Heat flows to surroundings at temperature T
   * - Entropy produced: dS = |Q|/T
   *
   * Note: This is a simplified model. Real reaction entropy also includes
   * mixing entropy and reaction coordinate entropy.
   */
  trackReactionDissipation(
    heatFlux: number,
    temperature: number,
    dt: number
  ): number {
    // Entropy from heat transfer at temperature T
    const dS = (Math.abs(heatFlux) / temperature) * dt;

    this.irreversibleProduction += dS;
    this.history.push({
      source: 'reaction',
      dS,
      t: this.currentTime
    });

    return dS;
  }

  /**
   * Track entropy from heat conduction between two temperatures
   *
   * Physics:
   * - Heat Q flows from T_hot to T_cold
   * - Entropy lost by hot body: -Q/T_hot
   * - Entropy gained by cold body: +Q/T_cold
   * - Net production: dS = Q·(1/T_cold - 1/T_hot) > 0 when T_hot > T_cold
   */
  trackHeatConduction(
    heatFlux: number,
    T_hot: number,
    T_cold: number,
    dt: number
  ): number {
    if (T_hot <= T_cold || heatFlux <= 0) return 0;

    const dS = heatFlux * (1 / T_cold - 1 / T_hot) * dt;

    this.irreversibleProduction += dS;
    this.history.push({
      source: 'conduction',
      dS,
      t: this.currentTime
    });

    return dS;
  }

  /**
   * Track generic irreversible process
   */
  trackGeneric(source: string, dS: number): void {
    if (dS < 0) {
      throw new Error(`Entropy production cannot be negative: ${source} dS=${dS}`);
    }

    this.irreversibleProduction += dS;
    this.history.push({
      source,
      dS,
      t: this.currentTime
    });
  }

  /**
   * Reset the tracker
   */
  reset(): void {
    this.irreversibleProduction = 0;
    this.history = [];
    this.currentTime = 0;
  }

  /**
   * Get summary of entropy production by source
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const event of this.history) {
      summary[event.source] = (summary[event.source] ?? 0) + event.dS;
    }

    return summary;
  }

  /**
   * Format entropy history for display
   */
  formatHistory(): string {
    const lines = ['Entropy Production History:'];
    const summary = this.getSummary();

    for (const [source, total] of Object.entries(summary)) {
      lines.push(`  ${source}: ${total.toExponential(4)} J/K`);
    }

    lines.push(`  TOTAL: ${this.irreversibleProduction.toExponential(4)} J/K`);

    return lines.join('\n');
  }
}
