/**
 * SOLVER 11A: EM Equilibration Time Measurement
 *
 * Empirically measures when EM fields reach steady state.
 * NO theoretical estimates - ONLY energy flux stabilization.
 *
 * Convergence criterion: |dU/dt| < 1e-20 J/s for 100 consecutive steps
 */

import { EMRing } from '../src/rings/EMRing.js';
import { StateSpaceRing, SuccussionStrength } from '../src/rings/StateSpaceRing.js';
import { ConservationCore } from '../src/core/ConservationCore.js';

console.log('\n⚡ SOLVER 11A: EM Equilibration Time Measurement\n');
console.log('Method: Empirical energy flux stabilization');
console.log('Criterion: |dU/dt| < 1e-20 J/s for 100 consecutive steps\n');

const dnaSequence = "ATGGAGGAGCCGCAGTCAGA";

interface EMEquilibrationResult {
  steps: number;
  time_seconds: number;
  final_energy: number;
  energy_history: number[];
}

/**
 * Measure EM equilibration time
 */
function measureEMEquilibration(waterType: 'pure' | 'c30'): EMEquilibrationResult {
  console.log(`\nTesting: ${waterType.toUpperCase()} water`);

  // Create water ring
  const water = new StateSpaceRing(298.15, 101325);
  if (waterType === 'c30') {
    water.applySuccussion(SuccussionStrength.C30);
  }

  // Create EM ring
  const em = new EMRing(50, 1e-8);
  const emSolver = em.getState();
  emSolver.setDNACharges(dnaSequence);

  // Initialize with a Gaussian pulse in E field
  // This excites the EM system so we can measure equilibration
  const N = emSolver.grid.N;
  const center = Math.floor(N / 2);
  const width = N / 10;
  const amplitude = 1e-6;  // V/m (small initial excitation)

  for (let i = 0; i < N; i++) {
    const x = (i - center) / width;
    emSolver.Ez[i] = amplitude * Math.exp(-x * x);
  }

  // Set up ConservationCore with coupling
  const core = new ConservationCore();
  core.addRing(water);
  core.addRing(em);
  core.couple('state_space', 'electromagnetic');
  core.initialize();

  // CFL condition: dt < dx / c_medium
  // c_medium = c / sqrt(eps_r) ≈ 3e8 / sqrt(80) ≈ 3.35e7 m/s
  // dx = L/N = 1e-8 / 50 = 2e-10 m
  // dt_max ≈ 2e-10 / 3.35e7 ≈ 6e-18 s
  // Use 50% of CFL limit for stability
  const c = 3e8;
  const eps_r = 80;
  const dx = emSolver.grid.dx;
  const c_medium = c / Math.sqrt(eps_r);
  const dt_cfl = dx / c_medium;
  const dt = dt_cfl * 0.5;  // 50% CFL for safety

  console.log(`  CFL-safe timestep: dt = ${dt.toExponential(2)} s (CFL limit: ${dt_cfl.toExponential(2)} s)`);
  const max_steps = 10000;
  const convergence_window = 100;
  const energy_rate_threshold = 1e-20;  // J/s

  const energy_history: number[] = [];
  const energy_buffer: number[] = [];

  let converged = false;
  let convergence_count = 0;
  let equilibration_step = 0;

  console.log('  Evolving EM fields...');
  console.log('  Step     | Energy (J)       | dU/dt (J/s)');
  console.log('  ---------|------------------|------------------');

  for (let step = 0; step < max_steps; step++) {
    core.spin(dt);

    const U = em.getEnergy().total;
    energy_history.push(U);
    energy_buffer.push(U);

    // Keep only last convergence_window
    if (energy_buffer.length > convergence_window) {
      energy_buffer.shift();
    }

    // Calculate dU/dt once buffer has at least 2 values
    let dU_dt = 0;
    if (energy_buffer.length >= 2) {
      const U_recent = energy_buffer[energy_buffer.length - 1];
      const U_old = energy_buffer[0];
      const time_span = (energy_buffer.length - 1) * dt;
      dU_dt = Math.abs((U_recent - U_old) / time_span);

      // Check convergence
      if (dU_dt < energy_rate_threshold) {
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
    if (step % 100 === 0 || converged) {
      console.log(
        `  ${step.toString().padEnd(8)} | ` +
        `${U.toExponential(6)} | ` +
        `${dU_dt.toExponential(2)}`
      );
    }

    if (converged) break;
  }

  if (!converged) {
    console.log(`  WARNING: Did not converge within ${max_steps} steps`);
    equilibration_step = max_steps;
  }

  const final_energy = em.getEnergy().total;

  return {
    steps: equilibration_step,
    time_seconds: equilibration_step * dt,
    final_energy,
    energy_history
  };
}

// ================================================================
// MAIN: Measure both pure and C30
// ================================================================

const pure_result = measureEMEquilibration('pure');
const c30_result = measureEMEquilibration('c30');

console.log('\n' + '═'.repeat(70));
console.log('EM EQUILIBRATION RESULTS');
console.log('═'.repeat(70));

console.log('\nPure Water:');
console.log(`  Equilibration steps: ${pure_result.steps}`);
console.log(`  Equilibration time: ${pure_result.time_seconds.toExponential(2)} s`);
console.log(`  Final energy: ${pure_result.final_energy.toExponential(2)} J`);

console.log('\nC30 Water:');
console.log(`  Equilibration steps: ${c30_result.steps}`);
console.log(`  Equilibration time: ${c30_result.time_seconds.toExponential(2)} s`);
console.log(`  Final energy: ${c30_result.final_energy.toExponential(2)} J`);

// Determine conservative N_EM
const N_EM = Math.max(pure_result.steps, c30_result.steps);

console.log('\n' + '═'.repeat(70));
console.log(`RECOMMENDED N_EM = ${N_EM} steps`);
console.log(`(Conservative: maximum of pure and C30 equilibration times)`);
console.log('═'.repeat(70));

// Time-averaging buffer
const averaging_window = 100;
const averaging_start = N_EM - averaging_window;

console.log('\nTIME-AVERAGING BUFFER:');
console.log(`  Start averaging at step: ${averaging_start}`);
console.log(`  End averaging at step: ${N_EM}`);
console.log(`  Window size: ${averaging_window} steps`);
console.log(`  Purpose: Smooth field fluctuations before coupling to fluids`);

console.log('\n✅ EM equilibration measurement complete\n');
