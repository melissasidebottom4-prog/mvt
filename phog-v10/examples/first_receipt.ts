/**
 * PHOG V10 - First Receipt Example
 * Demonstrates basic parsing, execution, and receipt generation
 */

import { parseLaw } from '../src/parser.js';
import { executeLaw } from '../src/executor.js';
import { generateReceipt, formatReceipt } from '../src/receipt.js';

console.log('='.repeat(60));
console.log('PHOG V10 - Physics-Governed Receipt Engine');
console.log('='.repeat(60));
console.log();

// =============================================================================
// TEST 1: Newton's Second Law (F = ma)
// =============================================================================

console.log('TEST 1: Newton\'s Second Law');
console.log('-'.repeat(60));

const newtonLaw = parseLaw(`
law newton_second {
  F = m * a
  constraint: abs(F - m * a) < 1e-6
}
`);

console.log(`Parsed law: ${newtonLaw.id}`);
console.log(`Equations: ${newtonLaw.equations.length}`);
console.log(`Constraints: ${newtonLaw.constraints.length}`);

const newtonInput = { m: 1, a: 9.8 };
const newtonResult = executeLaw(newtonLaw, newtonInput);
const newtonReceipt = generateReceipt(newtonResult);

console.log();
console.log(formatReceipt(newtonReceipt));
console.log();

// =============================================================================
// TEST 2: Universal Gravitation
// =============================================================================

console.log('TEST 2: Universal Gravitation');
console.log('-'.repeat(60));

const gravityLaw = parseLaw(`
law universal_gravitation {
  F = G * m1 * m2 / r^2
  constant: G = 6.67430e-11
  constraint: abs(F - G * m1 * m2 / r^2) < 1e-9
}
`);

const gravityInput = { m1: 1000, m2: 2000, r: 10 };
const gravityResult = executeLaw(gravityLaw, gravityInput);
const gravityReceipt = generateReceipt(gravityResult, newtonReceipt.hash);

console.log(formatReceipt(gravityReceipt));
console.log();

// =============================================================================
// TEST 3: Photon Energy (Quantum)
// =============================================================================

console.log('TEST 3: Photon Energy (Quantum Mechanics)');
console.log('-'.repeat(60));

const photonLaw = parseLaw(`
law photon_energy {
  E = h * nu
  constant: h = 6.62607015e-34
  constraint: abs(E - h * nu) < 1e-40
}
`);

const photonInput = { nu: 5e14 }; // Visible light frequency
const photonResult = executeLaw(photonLaw, photonInput);
const photonReceipt = generateReceipt(photonResult, gravityReceipt.hash);

console.log(formatReceipt(photonReceipt));
console.log();

// =============================================================================
// TEST 4: Mass-Energy Equivalence (Relativity)
// =============================================================================

console.log('TEST 4: Mass-Energy Equivalence (Relativity)');
console.log('-'.repeat(60));

const emc2Law = parseLaw(`
law mass_energy {
  E = m * c^2
  constant: c = 299792458
  constraint: abs(E - m * c^2) < 1e-6
}
`);

const emc2Input = { m: 1 }; // 1 kg
const emc2Result = executeLaw(emc2Law, emc2Input);
const emc2Receipt = generateReceipt(emc2Result, photonReceipt.hash);

console.log(formatReceipt(emc2Receipt));
console.log();

// =============================================================================
// TEST 5: Ideal Gas Law (Thermodynamics)
// =============================================================================

console.log('TEST 5: Ideal Gas Law (Thermodynamics)');
console.log('-'.repeat(60));

const gasLaw = parseLaw(`
law ideal_gas_state {
  pV = n * R * T
  constant: R = 8.314462618
  constraint: abs(p * V - n * R * T) < 1e-3
}
`);

const gasInput = { p: 101325, V: 0.0224, n: 1, T: 273 };
const gasResult = executeLaw(gasLaw, gasInput);
const gasReceipt = generateReceipt(gasResult, emc2Receipt.hash);

console.log(formatReceipt(gasReceipt));
console.log();

// =============================================================================
// SUMMARY
// =============================================================================

console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log();
console.log('Tests completed: 5');
console.log(`All constraints met: ${[newtonResult, gravityResult, photonResult, emc2Result, gasResult].every(r => r.constraintsMet)}`);
console.log();
console.log('Receipt chain:');
console.log(`  1. ${newtonReceipt.law_id} -> ${newtonReceipt.hash.substring(0, 16)}...`);
console.log(`  2. ${gravityReceipt.law_id} -> ${gravityReceipt.hash.substring(0, 16)}...`);
console.log(`  3. ${photonReceipt.law_id} -> ${photonReceipt.hash.substring(0, 16)}...`);
console.log(`  4. ${emc2Receipt.law_id} -> ${emc2Receipt.hash.substring(0, 16)}...`);
console.log(`  5. ${gasReceipt.law_id} -> ${gasReceipt.hash.substring(0, 16)}...`);
console.log();
console.log('PHOG V10 IS ALIVE!');
console.log('='.repeat(60));
