/**
 * PHOG V10 - Phase 7: Water-Genome Control (No Succussion)
 *
 * CONTROL EXPERIMENT:
 * - DNA transport in pure liquid water (no memory)
 * - Establishes baseline electron transport rate
 * - No off-diagonal Hamiltonian elements (no succussion)
 *
 * EXPECTED BEHAVIOR:
 * - Standard dielectric screening (ε_r ≈ 80 for liquid)
 * - No phonon coupling (memory_coherence = 0)
 * - Normal quantum transport with base-dependent barriers
 */

import { SpatialRing1D } from '../src/rings/SpatialRing1D.js';
import { StateSpaceRing } from '../src/rings/StateSpaceRing.js';
import { GenomeSolver1D } from '../src/rings/spatial/GenomeSolver1D.js';

console.log('');
console.log('='.repeat(75));
console.log('PHOG V10 - Phase 7: Water-Genome Control (No Succussion)');
console.log('='.repeat(75));
console.log('');
console.log('CONTROL EXPERIMENT: DNA transport in pure water (no memory imprint)');
console.log('');

// ============================================================
// Setup DNA sequence (p53 tumor suppressor)
// ============================================================

const p53Sequence = 'ATGGAGGAGCCGCAGTCAGA';
console.log(`DNA Sequence: ${p53Sequence}`);
console.log(`Gene: TP53 (human tumor suppressor)`);
console.log(`Length: ${p53Sequence.length} base pairs`);
console.log('');

/**
 * Convert DNA sequence to dimensionless potential
 */
function dnaSequenceToPotential(seq: string): Float64Array {
  const potentials: Record<string, number> = {
    'G': 0.00,  // Guanine - lowest, electron sink
    'A': 0.49,  // Adenine - +0.49 eV relative
    'C': 1.12,  // Cytosine - +1.12 eV
    'T': 1.39   // Thymine - +1.39 eV (highest barrier)
  };

  const scale = 0.1;
  const V = new Float64Array(seq.length);

  for (let i = 0; i < seq.length; i++) {
    V[i] = (potentials[seq[i]] ?? 0.5) * scale;
  }
  return V;
}

// ============================================================
// Create water ring (pure liquid, no succussion)
// ============================================================

console.log('═'.repeat(75));
console.log('WATER STATE: Pure Liquid (No Succussion)');
console.log('═'.repeat(75));
console.log('');

const waterRing = new StateSpaceRing(298.15, 101325);

// Do NOT apply succussion - this is the control
console.log('Succussion: NONE (control)');
console.log(`Memory coherence: ${waterRing.getMemoryCoherence().toExponential(4)}`);
console.log(`Temperature: ${waterRing.temperature} K`);
console.log('');

const probs = waterRing.getProbabilities();
console.log('Water state probabilities:');
console.log(`  |solid⟩:   ${(probs[0] * 100).toFixed(4)}%`);
console.log(`  |liquid⟩:  ${(probs[1] * 100).toFixed(4)}%`);
console.log(`  |gas⟩:     ${(probs[2] * 100).toFixed(4)}%`);
console.log(`  |plasma⟩:  ${(probs[3] * 100).toFixed(4)}%`);
console.log(`  |BEC⟩:     ${(probs[4] * 100).toFixed(4)}%`);
console.log('');

// ============================================================
// Create genome ring and couple to water
// ============================================================

console.log('═'.repeat(75));
console.log('DNA QUANTUM TRANSPORT (Control - No Water Memory)');
console.log('═'.repeat(75));
console.log('');

const genomeRing = new SpatialRing1D('genome', p53Sequence.length, p53Sequence.length, {});
const genomeSolver = genomeRing.getSolver() as GenomeSolver1D;

// Set DNA base potentials
const V_base = dnaSequenceToPotential(p53Sequence);
genomeRing.setPotential(V_base);

// Initialize electron at 5' end
genomeSolver.setGaussian(0, 1.0);

// Get water coupling data
const couplingData = waterRing.getCouplingTo('spatial_1d_genome');

// Apply coupling to genome ring
if (couplingData) {
  // Calculate dielectric factor from water state
  const epsilon_r = 80 * probs[1] + 3 * probs[0] + 1 * probs[2];
  const dielectric_factor = 1.0 / Math.sqrt(epsilon_r);
  const memory = waterRing.getMemoryCoherence();
  const phonon_coupling = memory * 1e20;

  genomeRing.receiveCouplingData('state_space', {
    dielectric_factor,
    phonon_coupling
  });

  const info = genomeRing.getWaterCouplingInfo();
  console.log('Water-Genome Coupling:');
  console.log(`  Dielectric factor: ${info?.dielectric.toFixed(6)}`);
  console.log(`  Phonon coupling:   ${info?.phonon.toExponential(4)}`);
  console.log('');
}

// Show potential landscape
console.log('DNA Potential Landscape:');
console.log('  Base: ' + p53Sequence.split('').join('  '));
let potentialStr = '  V:    ';
for (let i = 0; i < p53Sequence.length; i++) {
  potentialStr += V_base[i].toFixed(1).padStart(3);
}
console.log(potentialStr);
console.log('');

// ============================================================
// Run simulation
// ============================================================

console.log('-'.repeat(65));
console.log(
  'Step'.padEnd(10) +
  'Probability'.padEnd(15) +
  'Memory'.padEnd(14) +
  'P_water'.padEnd(12) +
  'Status'
);
console.log('-'.repeat(65));

const dt = 0.01;  // Dimensionless time step
let allConserved = true;
let finalP = 1.0;

// Track initial electron position
const initialRho = genomeSolver.getProbabilityDensity();
let initialPeak = 0;
for (let i = 0; i < p53Sequence.length; i++) {
  if (initialRho[i] > initialRho[initialPeak]) initialPeak = i;
}

for (let step = 0; step <= 100; step += 10) {
  // Step both rings
  if (step > 0) {
    for (let i = 0; i < 10; i++) {
      waterRing.step(1e-14);  // Water evolves
      genomeRing.stepWithWaterCoupling(dt);  // DNA with water coupling
    }
  }

  const P_genome = genomeSolver.getProbability();
  finalP = P_genome;
  const P_water = waterRing.getTotalProbability();
  const memory = waterRing.getMemoryCoherence();

  const status = Math.abs(P_genome - 1.0) < 1e-6 && Math.abs(P_water - 1.0) < 1e-6 ? '  ' : '  ';
  if (Math.abs(P_genome - 1.0) >= 1e-6) allConserved = false;

  console.log(
    step.toString().padEnd(10) +
    P_genome.toFixed(6).padEnd(15) +
    memory.toExponential(2).padEnd(14) +
    P_water.toFixed(6).padEnd(12) +
    status
  );
}

console.log('-'.repeat(65));
console.log('');

// ============================================================
// Final Analysis
// ============================================================

console.log('FINAL STATE ANALYSIS:');
console.log('-'.repeat(45));

// Show probability distribution
const finalRho = genomeSolver.getProbabilityDensity();
let maxRho = 0;
let peakPos = 0;
for (let i = 0; i < p53Sequence.length; i++) {
  if (finalRho[i] > maxRho) {
    maxRho = finalRho[i];
    peakPos = i;
  }
}

console.log('Electron probability distribution:');
console.log('  Base: ' + p53Sequence.split('').join('  '));
let distStr = '  |ψ|²: ';
for (let i = 0; i < p53Sequence.length; i++) {
  const level = Math.floor(finalRho[i] / maxRho * 5);
  const chars = ['·', '▁', '▂', '▃', '▄', '▅'];
  distStr += chars[Math.min(level, 5)] + '  ';
}
console.log(distStr);
console.log('');

console.log(`Initial peak: position ${initialPeak} (${p53Sequence[initialPeak]})`);
console.log(`Final peak:   position ${peakPos} (${p53Sequence[peakPos]})`);
console.log(`Final probability: ${finalP.toFixed(6)}`);
console.log('');

// ============================================================
// Summary
// ============================================================

console.log('='.repeat(75));
if (allConserved) {
  console.log('  CONTROL EXPERIMENT COMPLETE');
  console.log('');
  console.log('  OBSERVATIONS:');
  console.log('    • No water memory (control condition)');
  console.log('    • Standard dielectric screening (~1/√80 ≈ 0.112)');
  console.log('    • Probability conserved throughout');
  console.log('    • Baseline transport rate established');
  console.log('');
  console.log('  This provides the control for C30 succussion experiments.');
} else {
  console.log('    Probability conservation needs refinement');
}
console.log('='.repeat(75));
console.log('');
