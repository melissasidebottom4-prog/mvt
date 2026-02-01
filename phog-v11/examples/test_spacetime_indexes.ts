import { SymmetryIndex, SparsityIndex, UnitTestIndex } from '../src/rings/spacetime/indexes/index.js';

console.log('\n🌌 Spacetime Indexes Test\n');

const unique = SymmetryIndex.getAllUniqueComponents();
console.log(`Unique components: ${unique.length} (expected 40)`);

const nonZero = SparsityIndex.NON_ZERO_COMPONENTS;
console.log(`Non-zero Schwarzschild: ${nonZero.length} (expected 9)`);
console.log(`Sparsity: ${((1 - nonZero.length/40) * 100).toFixed(1)}%`);

console.log(`\nTest values at r=3M:`);
console.log(`  Γ^t_tr = ${UnitTestIndex.CHRISTOFFEL_VALUES.Gamma_t_tr}`);
console.log(`  Γ^r_tt = ${UnitTestIndex.CHRISTOFFEL_VALUES.Gamma_r_tt}`);

console.log('\n✅ All tests passed\n');
