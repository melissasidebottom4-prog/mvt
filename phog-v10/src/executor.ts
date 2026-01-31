/**
 * PHOG V10 - Physics Law Executor
 * Executes parsed laws using Math.js and verifies constraints
 */

import * as math from 'mathjs';
import type { PhogLaw, PhogConstraint } from './parser.js';

export interface ConstraintResult {
  expr: string;
  operator: string;
  value: number;
  threshold: number;
  met: boolean;
  rawExpr: string;
}

export interface ExecutionResult {
  lawId: string;
  inputState: Record<string, number>;
  outputState: Record<string, number>;
  constraintsMet: boolean;
  constraintResults: ConstraintResult[];
  executionTime: number;
  error?: string;
}

/**
 * Execute a physics law with given input state
 */
export function executeLaw(law: PhogLaw, inputState: Record<string, number>): ExecutionResult {
  const startTime = performance.now();

  // Create scope with input state and constants
  const state: Record<string, number> = { ...inputState, ...law.constants };

  // Add common math constants if not already defined
  const mathConstants: Record<string, number> = {
    pi: Math.PI,
    e: Math.E,
    c: 299792458, // Speed of light
  };

  for (const [key, value] of Object.entries(mathConstants)) {
    if (!(key in state)) {
      state[key] = value;
    }
  }

  try {
    // Evaluate each equation in order
    for (const eq of law.equations) {
      const expression = preprocessExpression(eq.rhs);
      const value = math.evaluate(expression, state);
      state[eq.lhs] = typeof value === 'number' ? value : Number(value);
    }

    // Check constraints
    const constraintResults = law.constraints.map(c => checkConstraint(c, state));
    const constraintsMet = constraintResults.every(r => r.met);

    const endTime = performance.now();

    return {
      lawId: law.id,
      inputState,
      outputState: state,
      constraintsMet,
      constraintResults,
      executionTime: endTime - startTime
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      lawId: law.id,
      inputState,
      outputState: state,
      constraintsMet: false,
      constraintResults: [],
      executionTime: endTime - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Preprocess expression to handle common syntax variations
 */
function preprocessExpression(expr: string): string {
  return expr
    // Handle ^ for power (mathjs uses ^)
    .replace(/\^/g, '^')
    // Handle ln() -> log() for mathjs
    .replace(/\bln\(/g, 'log(')
    // Handle delta_x style -> deltaX for cleaner parsing
    // (keep as-is since we use underscore variable names)
    ;
}

/**
 * Check a single constraint against the current state
 */
function checkConstraint(constraint: PhogConstraint, state: Record<string, number>): ConstraintResult {
  try {
    // Preprocess the constraint expression
    const expr = preprocessExpression(constraint.expr);

    // Evaluate the expression
    const rawValue = math.evaluate(expr, state);
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);

    // Check based on operator
    let met = false;
    const threshold = constraint.threshold;

    switch (constraint.operator) {
      case '<':
        met = value < threshold;
        break;
      case '>':
        met = value > threshold;
        break;
      case '<=':
        met = value <= threshold;
        break;
      case '>=':
        met = value >= threshold;
        break;
      case '==':
        met = Math.abs(value - threshold) < 1e-10;
        break;
    }

    return {
      expr: constraint.expr,
      operator: constraint.operator,
      value,
      threshold,
      met,
      rawExpr: constraint.rawExpr
    };
  } catch (error) {
    // If we can't evaluate the constraint, try evaluating it as a boolean expression
    try {
      const boolExpr = preprocessExpression(constraint.rawExpr);
      const result = math.evaluate(boolExpr, state);
      return {
        expr: constraint.expr,
        operator: constraint.operator,
        value: result ? 1 : 0,
        threshold: constraint.threshold,
        met: Boolean(result),
        rawExpr: constraint.rawExpr
      };
    } catch {
      return {
        expr: constraint.expr,
        operator: constraint.operator,
        value: NaN,
        threshold: constraint.threshold,
        met: false,
        rawExpr: constraint.rawExpr
      };
    }
  }
}

/**
 * Execute multiple laws in sequence
 */
export function executeLaws(laws: PhogLaw[], inputStates: Record<string, number>[]): ExecutionResult[] {
  return laws.map((law, i) => {
    const state = inputStates[i] || {};
    return executeLaw(law, state);
  });
}

/**
 * Get the list of required input variables for a law
 */
export function getRequiredInputs(law: PhogLaw): string[] {
  const defined = new Set<string>(Object.keys(law.constants));
  const required = new Set<string>();

  // Add LHS of equations to defined set
  for (const eq of law.equations) {
    defined.add(eq.lhs);
  }

  // Find variables used in RHS that aren't defined
  for (const eq of law.equations) {
    const vars = extractVariables(eq.rhs);
    for (const v of vars) {
      if (!defined.has(v)) {
        required.add(v);
      }
    }
  }

  return Array.from(required);
}

/**
 * Extract variable names from an expression
 */
function extractVariables(expr: string): string[] {
  // Match word characters that look like variable names
  const matches = expr.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];

  // Filter out common functions and constants
  const reserved = new Set([
    'abs', 'sqrt', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'pow',
    'pi', 'e', 'PI', 'E'
  ]);

  return matches.filter(m => !reserved.has(m));
}
