/**
 * PHOG V10 - Tier 1 Infrastructure: Dimensional Analysis Tests
 *
 * Comprehensive test suite for the dimensional analysis system
 */

import { DimensionalValue } from '../src/core/infrastructure/DimensionalValue.js';
import { DIMENSIONS, DimensionVector } from '../src/core/infrastructure/Dimensions.js';
import { PhysicsGuard } from '../src/core/infrastructure/PhysicsGuard.js';

console.log('\n' + '═'.repeat(70));
console.log('PHOG V10 - DIMENSIONAL ANALYSIS SYSTEM TEST');
console.log('═'.repeat(70));

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => boolean): void {
  try {
    if (fn()) {
      console.log(`  ✓ ${name}`);
      testsPassed++;
    } else {
      console.log(`  ✗ ${name}`);
      testsFailed++;
    }
  } catch (e) {
    console.log(`  ✗ ${name}: ${(e as Error).message}`);
    testsFailed++;
  }
}

// ================================================================
// Test 1: Basic dimensional arithmetic
// ================================================================

console.log('\n1. BASIC DIMENSIONAL ARITHMETIC');
console.log('─'.repeat(70));

const mass = new DimensionalValue(5.0, DIMENSIONS.MASS, 'mass');
const acceleration = new DimensionalValue(10.0, DIMENSIONS.ACCELERATION, 'acceleration');
const force = mass.multiply(acceleration);

console.log(`\n  ${mass}`);
console.log(`  ${acceleration}`);
console.log(`  F = m × a:`);
console.log(`    ${force}`);

test('F = ma has correct dimensions', () => {
  return force.dimension.equals(DIMENSIONS.FORCE);
});

test('F = ma has correct value', () => {
  return Math.abs(force.value - 50.0) < 1e-10;
});

// Test energy = force × distance
const distance = new DimensionalValue(2.0, DIMENSIONS.LENGTH, 'distance');
const work = force.multiply(distance);

test('Work = F × d has energy dimensions', () => {
  return work.dimension.equals(DIMENSIONS.ENERGY);
});

// Test power = energy / time
const time = new DimensionalValue(0.5, DIMENSIONS.TIME, 'time');
const power = work.divide(time);

test('Power = E / t has power dimensions', () => {
  return power.dimension.equals(DIMENSIONS.POWER);
});

// ================================================================
// Test 2: Dimensional mismatch detection
// ================================================================

console.log('\n2. DIMENSIONAL MISMATCH DETECTION');
console.log('─'.repeat(70));

const energy = new DimensionalValue(100, DIMENSIONS.ENERGY, 'energy');
const momentum = new DimensionalValue(50, DIMENSIONS.MOMENTUM, 'momentum');

test('Adding energy + momentum throws error', () => {
  try {
    const invalid = energy.add(momentum);
    return false; // Should have thrown
  } catch (e) {
    return (e as Error).message.includes('Dimension mismatch');
  }
});

test('Subtracting momentum - energy throws error', () => {
  try {
    const invalid = momentum.subtract(energy);
    return false;
  } catch (e) {
    return (e as Error).message.includes('Dimension mismatch');
  }
});

// ================================================================
// Test 3: Derivative verification
// ================================================================

console.log('\n3. DERIVATIVE VERIFICATION');
console.log('─'.repeat(70));

// Velocity is derivative of position with respect to time
const position = new DimensionalValue(10.0, DIMENSIONS.LENGTH, 'position');
const velocity = new DimensionalValue(5.0, DIMENSIONS.VELOCITY, 'velocity');

test('d(position)/dt has velocity dimensions', () => {
  return PhysicsGuard.verifyDerivative(position, velocity, 'time', 'v = dx/dt');
});

// Acceleration is derivative of velocity with respect to time
const accel = new DimensionalValue(2.0, DIMENSIONS.ACCELERATION, 'acceleration');

test('d(velocity)/dt has acceleration dimensions', () => {
  return PhysicsGuard.verifyDerivative(velocity, accel, 'time', 'a = dv/dt');
});

// Wavefunction time derivative (Schrödinger equation)
const wavefunction = new DimensionalValue(1.0, DIMENSIONS.WAVEFUNCTION_1D, 'ψ');
const psi_dot = new DimensionalValue(
  1e17,
  DIMENSIONS.WAVEFUNCTION_1D.divide(DIMENSIONS.TIME),
  '∂ψ/∂t'
);

test('∂ψ/∂t has correct dimensions for Schrödinger equation', () => {
  return PhysicsGuard.verifyDerivative(wavefunction, psi_dot, 'time', 'Schrödinger');
});

// ================================================================
// Test 4: Integral verification
// ================================================================

console.log('\n4. INTEGRAL VERIFICATION');
console.log('─'.repeat(70));

// ∫F dt = momentum (impulse)
const impulse = new DimensionalValue(25.0, DIMENSIONS.MOMENTUM, 'impulse');

test('∫F dt has momentum dimensions', () => {
  return PhysicsGuard.verifyIntegral(force, impulse, 'time', 'Impulse');
});

// ∫P dt = energy
test('∫P dt has energy dimensions', () => {
  const totalEnergy = new DimensionalValue(200, DIMENSIONS.ENERGY, 'total energy');
  return PhysicsGuard.verifyIntegral(power, totalEnergy, 'time', 'Work-energy');
});

// ================================================================
// Test 5: Power operations
// ================================================================

console.log('\n5. POWER OPERATIONS');
console.log('─'.repeat(70));

// Area = Length²
const length = new DimensionalValue(3.0, DIMENSIONS.LENGTH, 'length');
const area = length.pow(2);

test('Length² has area dimensions', () => {
  return area.dimension.equals(DIMENSIONS.AREA);
});

test('Length² has correct value', () => {
  return Math.abs(area.value - 9.0) < 1e-10;
});

// Volume = Length³
const volume = length.pow(3);

test('Length³ has volume dimensions', () => {
  return volume.dimension.equals(DIMENSIONS.VOLUME);
});

// √(Area) = Length
const sqrtArea = area.sqrt();

test('√(Area) has length dimensions', () => {
  return sqrtArea.dimension.equals(DIMENSIONS.LENGTH);
});

test('√(Area) has correct value', () => {
  return Math.abs(sqrtArea.value - 3.0) < 1e-10;
});

// ================================================================
// Test 6: Physics equations
// ================================================================

console.log('\n6. PHYSICS EQUATION VERIFICATION');
console.log('─'.repeat(70));

// Kinetic energy: E = ½mv²
const m = new DimensionalValue(2.0, DIMENSIONS.MASS, 'm');
const v = new DimensionalValue(10.0, DIMENSIONS.VELOCITY, 'v');
const KE = m.multiply(v.pow(2)).scale(0.5);

test('KE = ½mv² has energy dimensions', () => {
  return KE.dimension.equals(DIMENSIONS.ENERGY);
});

test('KE = ½mv² has correct value', () => {
  // ½ × 2 × 10² = 100 J
  return Math.abs(KE.value - 100.0) < 1e-10;
});

// Einstein E = mc²
const c = new DimensionalValue(3e8, DIMENSIONS.VELOCITY, 'c');
const restEnergy = m.multiply(c.pow(2));

test('E = mc² has energy dimensions', () => {
  return restEnergy.dimension.equals(DIMENSIONS.ENERGY);
});

// PhysicsGuard equation verification
const computedForce = m.multiply(accel);

test('PhysicsGuard.verifyEquation for F = ma', () => {
  PhysicsGuard.clearErrors();
  return PhysicsGuard.verifyEquation(
    new DimensionalValue(4.0, DIMENSIONS.FORCE, 'F'),
    computedForce,
    'Newton\'s second law'
  );
});

// ================================================================
// Test 7: Fluid dynamics dimensions
// ================================================================

console.log('\n7. FLUID DYNAMICS DIMENSIONS');
console.log('─'.repeat(70));

const rho = new DimensionalValue(1000, DIMENSIONS.DENSITY, 'ρ');
const nu = new DimensionalValue(1e-6, DIMENSIONS.VISCOSITY_KINEMATIC, 'ν');
const mu = rho.multiply(nu);

test('μ = ρν has dynamic viscosity dimensions', () => {
  return mu.dimension.equals(DIMENSIONS.VISCOSITY_DYNAMIC);
});

// Reynolds number: Re = ρvL/μ = vL/ν (dimensionless)
const L = new DimensionalValue(0.1, DIMENSIONS.LENGTH, 'L');
const U = new DimensionalValue(1.0, DIMENSIONS.VELOCITY, 'U');
const Re = U.multiply(L).divide(nu);

test('Re = UL/ν is dimensionless', () => {
  return Re.isDimensionless();
});

console.log(`    Reynolds number: Re = ${Re.value.toExponential(2)}`);

// ================================================================
// Test 8: Electromagnetic dimensions
// ================================================================

console.log('\n8. ELECTROMAGNETIC DIMENSIONS');
console.log('─'.repeat(70));

const charge = new DimensionalValue(1.6e-19, DIMENSIONS.CHARGE, 'q');
const voltage = new DimensionalValue(1.0, DIMENSIONS.VOLTAGE, 'V');
const electricEnergy = charge.multiply(voltage);

test('E = qV has energy dimensions', () => {
  return electricEnergy.dimension.equals(DIMENSIONS.ENERGY);
});

console.log(`    Energy of 1eV: ${electricEnergy.value.toExponential(4)} J`);

// ================================================================
// Test 9: Conservation law verification
// ================================================================

console.log('\n9. CONSERVATION LAW VERIFICATION');
console.log('─'.repeat(70));

const E1 = new DimensionalValue(100, DIMENSIONS.ENERGY, 'E_kinetic');
const E2 = new DimensionalValue(50, DIMENSIONS.ENERGY, 'E_potential');
const E3 = new DimensionalValue(150, DIMENSIONS.ENERGY, 'E_total');

test('Conservation terms have consistent dimensions', () => {
  PhysicsGuard.clearErrors();
  return PhysicsGuard.verifyConservation([E1, E2, E3], 'Energy conservation');
});

// Mixing energy and momentum should fail
const p = new DimensionalValue(10, DIMENSIONS.MOMENTUM, 'p');

test('Mixing E and p in conservation fails', () => {
  PhysicsGuard.clearErrors();
  const result = PhysicsGuard.verifyConservation([E1, p], 'Invalid conservation');
  return !result; // Should fail
});

PhysicsGuard.clearErrors();

// ================================================================
// Test 10: DimensionVector operations
// ================================================================

console.log('\n10. DIMENSION VECTOR OPERATIONS');
console.log('─'.repeat(70));

test('Velocity = Length / Time', () => {
  const vel = DIMENSIONS.LENGTH.divide(DIMENSIONS.TIME);
  return vel.equals(DIMENSIONS.VELOCITY);
});

test('Force = Mass × Acceleration', () => {
  const f = DIMENSIONS.MASS.multiply(DIMENSIONS.ACCELERATION);
  return f.equals(DIMENSIONS.FORCE);
});

test('Energy = Force × Length', () => {
  const e = DIMENSIONS.FORCE.multiply(DIMENSIONS.LENGTH);
  return e.equals(DIMENSIONS.ENERGY);
});

test('Power = Energy / Time', () => {
  const p = DIMENSIONS.ENERGY.divide(DIMENSIONS.TIME);
  return p.equals(DIMENSIONS.POWER);
});

test('Pressure = Force / Area', () => {
  const p = DIMENSIONS.FORCE.divide(DIMENSIONS.AREA);
  return p.equals(DIMENSIONS.PRESSURE);
});

// ================================================================
// Test 11: String representations
// ================================================================

console.log('\n11. STRING REPRESENTATIONS');
console.log('─'.repeat(70));

console.log(`  Force:       ${DIMENSIONS.FORCE}`);
console.log(`  Energy:      ${DIMENSIONS.ENERGY}`);
console.log(`  Power:       ${DIMENSIONS.POWER}`);
console.log(`  Pressure:    ${DIMENSIONS.PRESSURE}`);
console.log(`  Viscosity ν: ${DIMENSIONS.VISCOSITY_KINEMATIC}`);
console.log(`  Viscosity μ: ${DIMENSIONS.VISCOSITY_DYNAMIC}`);
console.log(`  Wavefunction: ${DIMENSIONS.WAVEFUNCTION_1D}`);

test('Dimensionless has correct string', () => {
  return DIMENSIONS.DIMENSIONLESS.toString() === '[dimensionless]';
});

// ================================================================
// FINAL SUMMARY
// ================================================================

console.log('\n' + '═'.repeat(70));
console.log('DIMENSIONAL ANALYSIS TEST SUMMARY');
console.log('═'.repeat(70));

const total = testsPassed + testsFailed;
console.log(`
  Tests Passed: ${testsPassed}/${total}
  Tests Failed: ${testsFailed}/${total}

  Overall Status: ${testsFailed === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}
`);

PhysicsGuard.assertNoErrors();

if (testsFailed === 0) {
  console.log('═'.repeat(70));
  console.log('✅ Dimensional Analysis System Operational');
  console.log('═'.repeat(70));
} else {
  console.log('═'.repeat(70));
  console.log('❌ Some tests failed - review output above');
  console.log('═'.repeat(70));
  process.exit(1);
}
