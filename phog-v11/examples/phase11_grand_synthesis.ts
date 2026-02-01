import { ConservationCore } from '../src/core/ConservationCore.js';
import { StateSpaceRing, SuccussionStrength } from '../src/rings/StateSpaceRing.js';
import { SpatialRing1D } from '../src/rings/SpatialRing1D.js';
import { SpatialRing2D } from '../src/rings/SpatialRing2D.js';

console.log('\n' + '█'.repeat(70));
console.log('PHOG V11 - PHASE 11: THE GRAND SYNTHESIS');
console.log('█'.repeat(70));

function runWaterfall(waterType: 'pure' | 'c30') {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`WATERFALL: ${waterType.toUpperCase()} WATER`);
  console.log('═'.repeat(70));

  const water = new StateSpaceRing(298.15, 101325);
  if (waterType === 'c30') {
    water.applySuccussion(SuccussionStrength.C30);
    console.log(`Memory coherence: ${water.getMemoryCoherence().toExponential(2)} J`);
  }

  const dna = new SpatialRing1D('dna', 20, 2e-9, {});
  const fluid2d = new SpatialRing2D('fluid2d', 48, 48, 1e-3, 1e-3, 1e-6);

  const core = new ConservationCore();
  core.addRing(water);
  core.addRing(dna);
  core.addRing(fluid2d);
  core.couple('state_space', 'dna');
  core.couple('state_space', 'fluid2d');
  core.initialize();

  const E_initial = core.getTotalEnergy();
  console.log(`Initial energy: ${E_initial.toExponential(4)} J`);

  for (let step = 0; step < 10; step++) {
    core.spin(1e-6);
  }

  const E_final = core.getTotalEnergy();
  console.log(`Final energy: ${E_final.toExponential(4)} J`);
  console.log(`Conservation: ${Math.abs(E_final - E_initial) < 1e-20 ? '✓' : '✗'}`);

  return { E_initial, E_final };
}

const control = runWaterfall('pure');
const c30 = runWaterfall('c30');

console.log('\n' + '█'.repeat(70));
console.log('COMPARISON');
console.log('█'.repeat(70));
console.log(`Control: ${control.E_initial.toExponential(2)} J`);
console.log(`C30: ${c30.E_initial.toExponential(2)} J`);
console.log(`Difference: ${((c30.E_initial - control.E_initial) / control.E_initial * 100).toFixed(2)}%`);

console.log('\n✅ GRAND SYNTHESIS COMPLETE\n');
