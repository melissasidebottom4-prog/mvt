/**
 * SOLVER 11A: DNA Equilibration Time Measurement
 *
 * Empirically measures when DNA wavefunction reaches steady state.
 * NO theoretical estimates - ONLY convergence detection.
 *
 * Convergence criterion: var(|ψ|²) < 1e-8 for 100 consecutive steps
 */

import { SpatialRing1D } from '../src/rings/SpatialRing1D.js';
import { StateSpaceRing, SuccussionStrength } from '../src/rings/StateSpaceRing.js';
import { ConservationCore } from '../src/core/ConservationCore.js';
import { GenomeSolver1D } from '../src/rings/spatial/GenomeSolver1D.js';

console.log('\n🔬 SOLVER 11A: DNA Equilibration Time Measurement\n');
console.log('Method: Empirical convergence detection (variance threshold)');
console.log('Criterion: var(|ψ|²) < 1e-8 for 100 consecutive steps\n');

const dnaSequence = "ATGGAGGAGCCGCAGTCAGA";

/**
 * Convert DNA sequence to potential energy array
 * Based on ionization potentials: A=8.24eV, T=9.14eV, C=8.87eV, G=7.75eV
 */
function dnaSequenceToPotential(seq: string): Float64Array {
  const potentials: Record<string, number> = {
    'A': 8.24, 'T': 9.14, 'C': 8.87, 'G': 7.75
  };
  const eV_to_J = 1.6e-19;
  const V = new Float64Array(seq.length);
  for (let i = 0; i < seq.length; i++) {
    V[i] = (potentials[seq[i]] || 8.0) * eV_to_J;
  }
  return V;
}

const V_base = dnaSequenceToPotential(dnaSequence);

interface EquilibrationResult {
  steps: number;
  time_seconds: number;
  final_probability: number;
  variance_history: number[];
}

/**
 * Measure equilibration time for DNA wavefunction
 */
function measureEquilibration(waterType: 'pure' | 'c30'): EquilibrationResult {
  console.log(`\nTesting: ${waterType.toUpperCase()} water`);

  // Create water ring
  const water = new StateSpaceRing(298.15, 101325);
  if (waterType === 'c30') {
    water.applySuccussion(SuccussionStrength.C30);
  }

  // Create genome ring (SpatialRing1D in 'genome' mode)
  const dna = new SpatialRing1D('genome', dnaSequence.length, 2e-9, {});
  const solver = dna.getSolver() as GenomeSolver1D;

  // Set up ConservationCore with coupling
  const core = new ConservationCore();
  core.addRing(water);
  core.addRing(dna);
  core.couple('state_space', 'spatial_1d_genome');
  core.initialize();

  // Initialize wavefunction at left end (localized state)
  for (let i = 0; i < solver.psi.length; i++) {
    solver.psi[i] = { re: 0, im: 0 };
  }
  // Gaussian-like initial state at left edge
  solver.psi[0] = { re: 1, im: 0 };
  solver.psi[1] = { re: 0.5, im: 0 };

  // Normalize
  let norm = 0;
  for (let i = 0; i < solver.psi.length; i++) {
    norm += solver.psi[i].re ** 2 + solver.psi[i].im ** 2;
  }
  norm = Math.sqrt(norm * solver.grid.dx);
  for (let i = 0; i < solver.psi.length; i++) {
    solver.psi[i].re /= norm;
    solver.psi[i].im /= norm;
  }

  const dt = 1e-17;  // 10 attoseconds
  const max_steps = 100000;
  const convergence_window = 100;
  const variance_threshold = 1e-8;

  const variance_history: number[] = [];
  const prob_squared_buffer: number[] = [];

  let converged = false;
  let convergence_count = 0;
  let equilibration_step = 0;

  console.log('  Evolving wavefunction...');
  console.log('  Step     | P_total  | P_right  | Variance');
  console.log('  ---------|----------|----------|----------');

  for (let step = 0; step < max_steps; step++) {
    // Step with water coupling via ConservationCore
    core.spin(dt);

    // Also do a direct step to ensure potential is applied
    solver.step(dt, V_base, true);

    // Calculate |ψ|² at each point
    let P_total = 0;
    let P_right = 0;
    const mid = Math.floor(solver.grid.N / 2);

    const prob_squared: number[] = [];
    for (let i = 0; i < solver.grid.N; i++) {
      const p2 = solver.psi[i].re ** 2 + solver.psi[i].im ** 2;
      prob_squared.push(p2);
      P_total += p2 * solver.grid.dx;
      if (i >= mid) P_right += p2 * solver.grid.dx;
    }

    // Add to buffer for variance calculation
    prob_squared_buffer.push(...prob_squared);

    // Keep only last convergence_window worth of data
    const buffer_size = convergence_window * solver.grid.N;
    if (prob_squared_buffer.length > buffer_size) {
      prob_squared_buffer.splice(0, prob_squared_buffer.length - buffer_size);
    }

    // Calculate variance once buffer is full
    let variance = 0;
    if (prob_squared_buffer.length >= buffer_size) {
      const mean = prob_squared_buffer.reduce((a, b) => a + b, 0) / prob_squared_buffer.length;
      variance = prob_squared_buffer.reduce((sum, val) => sum + (val - mean) ** 2, 0) / prob_squared_buffer.length;
      variance_history.push(variance);

      // Check convergence
      if (variance < variance_threshold) {
        convergence_count++;
        if (convergence_count >= convergence_window && !converged) {
          converged = true;
          equilibration_step = step - convergence_window;
          console.log(`  >>> CONVERGED at step ${equilibration_step} <<<`);
        }
      } else {
        convergence_count = 0;
      }
    }

    // Print progress
    if (step % 1000 === 0 || converged) {
      console.log(
        `  ${step.toString().padEnd(8)} | ` +
        `${P_total.toFixed(6)} | ` +
        `${P_right.toFixed(6)} | ` +
        `${variance.toExponential(2)}`
      );
    }

    if (converged) break;
  }

  if (!converged) {
    console.log(`  WARNING: Did not converge within ${max_steps} steps`);
    equilibration_step = max_steps;
  }

  const final_prob = solver.getProbability();

  return {
    steps: equilibration_step,
    time_seconds: equilibration_step * dt,
    final_probability: final_prob,
    variance_history
  };
}

// ================================================================
// MAIN: Measure both pure and C30
// ================================================================

const pure_result = measureEquilibration('pure');
const c30_result = measureEquilibration('c30');

console.log('\n' + '═'.repeat(70));
console.log('DNA EQUILIBRATION RESULTS');
console.log('═'.repeat(70));

console.log('\nPure Water:');
console.log(`  Equilibration steps: ${pure_result.steps}`);
console.log(`  Equilibration time: ${pure_result.time_seconds.toExponential(2)} s`);
console.log(`  Final probability: ${pure_result.final_probability.toFixed(6)}`);

console.log('\nC30 Water:');
console.log(`  Equilibration steps: ${c30_result.steps}`);
console.log(`  Equilibration time: ${c30_result.time_seconds.toExponential(2)} s`);
console.log(`  Final probability: ${c30_result.final_probability.toFixed(6)}`);

// Determine conservative N_DNA (max of both)
const N_DNA = Math.max(pure_result.steps, c30_result.steps);

console.log('\n' + '═'.repeat(70));
console.log(`RECOMMENDED N_DNA = ${N_DNA} steps`);
console.log(`(Conservative: maximum of pure and C30 equilibration times)`);
console.log('═'.repeat(70));

// Time-averaging buffer recommendation
const averaging_window = 100;
const averaging_start = N_DNA - averaging_window;

console.log('\nTIME-AVERAGING BUFFER:');
console.log(`  Start averaging at step: ${averaging_start}`);
console.log(`  End averaging at step: ${N_DNA}`);
console.log(`  Window size: ${averaging_window} steps`);
console.log(`  Purpose: Smooth numerical noise before coupling to macro rings`);

console.log('\n✅ DNA equilibration measurement complete\n');
