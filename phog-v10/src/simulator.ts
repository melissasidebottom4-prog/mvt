/**
 * PHOG V10 - Time-Stepping Simulator with Conservation
 *
 * Runs physics simulations with built-in conservation monitoring
 */

import { type Integrator, type StateVector, type DerivativeFunction, getIntegrator, rk4 } from './integrators.js';
import { computeEnergy, computeMomentum, computeEntropy, type ConservationErrors } from './conservation.js';
import { generateReceipt, type PhogReceipt } from './receipt.js';
import type { PhogLaw } from './parser.js';

export interface SimulationConfig {
  dt: number;                    // Time step
  duration: number;              // Total simulation time
  integrator?: string;           // Integrator name (default: rk4)
  outputInterval?: number;       // Steps between outputs (default: 1)
  conservationTolerance?: number; // Tolerance for conservation checks
}

export interface SimulationStep {
  t: number;
  state: StateVector;
  energy: number;
  momentum: number;
  entropy: number;
  conservation: {
    valid: boolean;
    errors: ConservationErrors;
    violations: string[];
  };
}

export interface SimulationResult {
  config: SimulationConfig;
  initialState: StateVector;
  finalState: StateVector;
  steps: SimulationStep[];
  totalSteps: number;
  conservationViolations: number;
  receipts: PhogReceipt[];
  success: boolean;
}

/**
 * Run a time-stepping simulation
 */
export function simulate(
  initialState: StateVector,
  derivatives: DerivativeFunction,
  config: SimulationConfig,
  law?: PhogLaw
): SimulationResult {
  const integrator = getIntegrator(config.integrator ?? 'rk4');
  const outputInterval = config.outputInterval ?? 1;

  let state = { ...initialState };
  let t = 0;
  const steps: SimulationStep[] = [];
  const receipts: PhogReceipt[] = [];
  let conservationViolations = 0;
  let stepCount = 0;

  const numSteps = Math.ceil(config.duration / config.dt);

  // Record initial state
  const initialStep: SimulationStep = {
    t: 0,
    state: { ...state },
    energy: computeEnergy(state),
    momentum: computeMomentum(state),
    entropy: computeEntropy(state),
    conservation: {
      valid: true,
      errors: { energy: 0, momentum: 0, mass: 0, entropy_change: 0 },
      violations: []
    }
  };
  steps.push(initialStep);

  // Generate initial receipt
  const initialReceipt = generateReceipt({
    lawId: law?.id ?? 'simulation',
    inputState: initialState,
    outputState: state,
    constraintsMet: true,
    constraintResults: [],
    executionTime: 0
  });
  receipts.push(initialReceipt);

  // Time-stepping loop
  for (let i = 0; i < numSteps; i++) {
    const result = integrator.step(state, derivatives, config.dt);

    // Check conservation
    if (!result.conservation.valid) {
      conservationViolations++;
    }

    state = result.state;
    t += config.dt;
    stepCount++;

    // Record step at output intervals
    if (stepCount % outputInterval === 0 || i === numSteps - 1) {
      const step: SimulationStep = {
        t,
        state: { ...state },
        energy: computeEnergy(state),
        momentum: computeMomentum(state),
        entropy: computeEntropy(state),
        conservation: result.conservation
      };
      steps.push(step);

      // Generate receipt for this step
      const receipt = generateReceipt(
        {
          lawId: law?.id ?? 'simulation',
          inputState: initialState,
          outputState: state,
          constraintsMet: result.conservation.valid,
          constraintResults: [],
          executionTime: t
        },
        receipts[receipts.length - 1]?.hash
      );
      receipts.push(receipt);
    }
  }

  return {
    config,
    initialState,
    finalState: state,
    steps,
    totalSteps: stepCount,
    conservationViolations,
    receipts,
    success: conservationViolations === 0
  };
}

/**
 * Format simulation output for display
 */
export function formatSimulation(result: SimulationResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('PHOG V10 - Time-Stepping Simulation');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Integrator: ${result.config.integrator ?? 'rk4'}`);
  lines.push(`Time step:  ${result.config.dt}s`);
  lines.push(`Duration:   ${result.config.duration}s`);
  lines.push(`Steps:      ${result.totalSteps}`);
  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('TIME EVOLUTION:');
  lines.push('-'.repeat(80));
  lines.push('');

  // Header
  lines.push(
    't(s)'.padStart(8) +
    'y(m)'.padStart(12) +
    'v(m/s)'.padStart(12) +
    'E(J)'.padStart(14) +
    'dE'.padStart(12) +
    'dS'.padStart(12) +
    'Status'.padStart(8)
  );
  lines.push('-'.repeat(80));

  const E0 = result.steps[0]?.energy ?? 0;

  for (const step of result.steps) {
    const y = step.state.y ?? step.state.height ?? 0;
    const v = step.state.v ?? step.state.velocity ?? 0;
    const dE = step.energy - E0;
    const status = step.conservation.valid ? '\u2713' : '\u2717';

    lines.push(
      step.t.toFixed(2).padStart(8) +
      y.toFixed(4).padStart(12) +
      v.toFixed(4).padStart(12) +
      step.energy.toFixed(4).padStart(14) +
      dE.toExponential(2).padStart(12) +
      step.conservation.errors.entropy_change.toExponential(2).padStart(12) +
      status.padStart(8)
    );
  }

  lines.push('');
  lines.push('-'.repeat(80));
  lines.push('SUMMARY:');
  lines.push('-'.repeat(80));
  lines.push(`Initial energy: ${result.steps[0]?.energy.toFixed(6)} J`);
  lines.push(`Final energy:   ${result.steps[result.steps.length - 1]?.energy.toFixed(6)} J`);

  const totalDrift = Math.abs(
    (result.steps[result.steps.length - 1]?.energy ?? 0) - (result.steps[0]?.energy ?? 0)
  );
  lines.push(`Energy drift:   ${totalDrift.toExponential(4)} J`);
  lines.push(`Conservation violations: ${result.conservationViolations}`);
  lines.push(`Receipts generated: ${result.receipts.length}`);
  lines.push('');

  if (result.success) {
    lines.push('\u2705 SIMULATION SUCCESSFUL - Conservation maintained');
  } else {
    lines.push(`\u26A0 SIMULATION COMPLETED WITH ${result.conservationViolations} CONSERVATION VIOLATIONS`);
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Create derivative function for falling object
 */
export function createFallingObjectDerivatives(g: number = 9.8): DerivativeFunction {
  return (state: StateVector): StateVector => {
    return {
      y: state.v ?? 0,  // dy/dt = v
      v: -g             // dv/dt = -g (acceleration due to gravity)
    };
  };
}

/**
 * Create derivative function for simple harmonic oscillator
 */
export function createHarmonicOscillatorDerivatives(omega: number): DerivativeFunction {
  return (state: StateVector): StateVector => {
    return {
      x: state.v ?? 0,                    // dx/dt = v
      v: -omega * omega * (state.x ?? 0)  // dv/dt = -omega^2 * x
    };
  };
}

/**
 * Create derivative function for damped oscillator
 */
export function createDampedOscillatorDerivatives(omega: number, gamma: number): DerivativeFunction {
  return (state: StateVector): StateVector => {
    return {
      x: state.v ?? 0,
      v: -omega * omega * (state.x ?? 0) - gamma * (state.v ?? 0)
    };
  };
}
