/**
 * HEARTHSTONE CONTINUUM SOLVER
 *
 * Laws are equations. Cases are initial conditions. Compliance is computed state.
 *
 * Just like a physics engine:
 * PHOG computes field state from physics equations + initial conditions
 * Hearthstone computes compliance state from legal equations + case events
 *
 * EVENTS (facts)  →  SOLVER  →  COMPLIANCE FLAGS
 *                      ↑
 *                 EQUATIONS
 *             (verified statutes)
 */

import {
  CaseEvent,
  LegalEquation,
  ComplianceFlag,
  CaseState,
  SolverOutput,
  Deadline,
  Safeguard,
  SafeguardStatus,
  FlagSeverity,
  EventType
} from './types';

export class HearthstoneContinuum {
  private equations: Map<string, LegalEquation[]> = new Map();
  private federalEquations: LegalEquation[] = [];

  loadJurisdiction(jurisdiction: string, equations: LegalEquation[]): void {
    this.equations.set(jurisdiction.toUpperCase(), equations);
  }

  loadFederalEquations(equations: LegalEquation[]): void {
    this.federalEquations = equations;
  }

  private getEquations(jurisdiction: string): LegalEquation[] {
    const stateEquations = this.equations.get(jurisdiction.toUpperCase()) || [];
    return [...stateEquations, ...this.federalEquations];
  }

  /**
   * MAIN SOLVER - Like PHOG's field evolution
   */
  solve(events: CaseEvent[], jurisdiction: string): SolverOutput {
    const equations = this.getEquations(jurisdiction);

    if (equations.length === 0) {
      throw new Error(`No equations loaded for jurisdiction: ${jurisdiction}`);
    }

    // Sort chronologically (causality)
    const timeline = [...events].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );

    // Initial state
    let state: CaseState = {
      jurisdiction,
      deadlines: {},
      safeguards: {},
      findings: {},
      actors: {},
      custodyStatus: 'UNKNOWN',
      serviced: false,
      hearingsHeld: 0,
      hearingsCancelled: 0,
      removalDate: null,
      lastContactWithChildren: null,
      cpsResponsePending: false
    };

    const flags: ComplianceFlag[] = [];

    // Process each event through equations
    for (const event of timeline) {
      const triggered = equations.filter((eq) => eq.triggers.includes(event.eventType));

      for (const equation of triggered) {
        try {
          const result = equation.compute(event, state, timeline);
          state = { ...state, ...result.stateUpdates };

          if (result.flags && result.flags.length > 0) {
            flags.push(
              ...result.flags.map((flag) => ({
                ...flag,
                triggeredByEvent: event.id,
                equationId: equation.id,
                computedAt: new Date().toISOString()
              }))
            );
          }
        } catch (error) {
          console.error(`Equation ${equation.id} failed:`, error);
        }
      }
    }

    // Run deadline checks
    const now = new Date();
    for (const equation of equations) {
      if (equation.triggers.includes(EventType.DEADLINE_CHECK)) {
        const result = equation.compute(
          {
            id: 'deadline-check',
            caseId: timeline[0]?.caseId || 'unknown',
            eventType: EventType.DEADLINE_CHECK,
            occurredAt: now.toISOString(),
            title: 'Deadline Check'
          } as CaseEvent,
          state,
          timeline
        );
        if (result.flags) {
          flags.push(
            ...result.flags.map((flag) => ({
              ...flag,
              equationId: equation.id,
              computedAt: now.toISOString()
            }))
          );
        }
      }
    }

    return this.buildOutput(timeline, state, flags, jurisdiction);
  }

  private buildOutput(
    timeline: CaseEvent[],
    state: CaseState,
    flags: ComplianceFlag[],
    jurisdiction: string
  ): SolverOutput {
    const uniqueFlags = this.deduplicateFlags(flags);
    const sortedFlags = uniqueFlags.sort(
      (a, b) => this.severityWeight(b.severity) - this.severityWeight(a.severity)
    );
    const deadlines = this.extractDeadlines(state);
    const safeguards = this.extractSafeguards(state);
    const score = this.computeScore(sortedFlags, safeguards);
    const riskLevel = this.computeRiskLevel(sortedFlags, score);
    const recommendations = this.generateRecommendations(sortedFlags, safeguards, state);

    return {
      caseId: timeline[0]?.caseId || 'unknown',
      jurisdiction,
      computedAt: new Date().toISOString(),
      timeline,
      compliance: {
        flags: sortedFlags,
        score,
        riskLevel,
        totalViolations: sortedFlags.length,
        criticalCount: sortedFlags.filter(
          (f) => f.severity === 'EMERGENCY' || f.severity === 'CRITICAL'
        ).length,
        highCount: sortedFlags.filter((f) => f.severity === 'HIGH').length,
        mediumCount: sortedFlags.filter((f) => f.severity === 'MEDIUM').length,
        lowCount: sortedFlags.filter((f) => f.severity === 'LOW').length
      },
      deadlines,
      safeguards,
      recommendations,
      state
    };
  }

  private deduplicateFlags(flags: ComplianceFlag[]): ComplianceFlag[] {
    const seen = new Set<string>();
    return flags.filter((flag) => {
      const key = `${flag.type}-${flag.triggeredByEvent || 'general'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private severityWeight(severity: FlagSeverity): number {
    const weights: Record<FlagSeverity, number> = {
      EMERGENCY: 5,
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };
    return weights[severity] || 0;
  }

  private extractDeadlines(state: CaseState): { upcoming: Deadline[]; missed: Deadline[] } {
    const now = new Date();
    const upcoming: Deadline[] = [];
    const missed: Deadline[] = [];

    for (const [key, deadline] of Object.entries(state.deadlines || {})) {
      if (!deadline) continue;
      const dueDate = new Date(deadline.dueBy);
      const deadlineObj: Deadline = {
        id: key,
        ...deadline,
        daysRemaining: Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      };

      if (!deadline.completed) {
        if (dueDate < now) {
          missed.push({ ...deadlineObj, daysOverdue: Math.abs(deadlineObj.daysRemaining) });
        } else {
          upcoming.push(deadlineObj);
        }
      }
    }

    return {
      upcoming: upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining),
      missed: missed.sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))
    };
  }

  private extractSafeguards(state: CaseState): {
    required: Safeguard[];
    completed: Safeguard[];
    missing: Safeguard[];
  } {
    const required: Safeguard[] = [];
    const completed: Safeguard[] = [];
    const missing: Safeguard[] = [];

    for (const [, safeguard] of Object.entries(state.safeguards || {})) {
      if (!safeguard) continue;
      required.push(safeguard);
      if (safeguard.status === SafeguardStatus.COMPLETED) {
        completed.push(safeguard);
      } else if (
        safeguard.status === SafeguardStatus.MISSED ||
        safeguard.status === SafeguardStatus.OVERDUE
      ) {
        missing.push(safeguard);
      }
    }

    return { required, completed, missing };
  }

  private computeScore(
    flags: ComplianceFlag[],
    safeguards: { required: Safeguard[]; completed: Safeguard[] }
  ): number {
    let score = 100;
    for (const flag of flags) {
      switch (flag.severity) {
        case 'EMERGENCY':
          score -= 25;
          break;
        case 'CRITICAL':
          score -= 20;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }
    if (safeguards.required.length > 0) {
      const safeguardScore = (safeguards.completed.length / safeguards.required.length) * 30;
      score = score * 0.7 + safeguardScore;
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private computeRiskLevel(
    flags: ComplianceFlag[],
    score: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const hasEmergency = flags.some((f) => f.severity === 'EMERGENCY');
    const criticalCount = flags.filter((f) => f.severity === 'CRITICAL').length;
    if (hasEmergency || criticalCount >= 2 || score < 25) return 'CRITICAL';
    if (criticalCount >= 1 || score < 50) return 'HIGH';
    if (score < 75) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    flags: ComplianceFlag[],
    safeguards: { missing: Safeguard[] },
    state: CaseState
  ): { immediate: string[]; legal: string[]; documentation: string[] } {
    const immediate: string[] = [];
    const legal: string[] = [];
    const documentation: string[] = [];

    for (const flag of flags) {
      if (flag.recommendedAction) {
        if (flag.severity === 'EMERGENCY' || flag.severity === 'CRITICAL') {
          immediate.push(flag.recommendedAction);
        } else {
          legal.push(flag.recommendedAction);
        }
      }
    }

    for (const safeguard of safeguards.missing) {
      documentation.push(`Document missing safeguard: ${safeguard.name} (${safeguard.citation})`);
    }

    if (!state.serviced) {
      immediate.push('File motion challenging defective service');
    }

    if (state.hearingsCancelled > 2) {
      legal.push(`Document pattern of ${state.hearingsCancelled} cancelled hearings`);
    }

    return {
      immediate: [...new Set(immediate)],
      legal: [...new Set(legal)],
      documentation: [...new Set(documentation)]
    };
  }
}

export function createSolver(): HearthstoneContinuum {
  return new HearthstoneContinuum();
}

export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
