import { DimensionalValue } from '../src/core/infrastructure/DimensionalValue.js';
import { DIMENSIONS } from '../src/core/infrastructure/Dimensions.js';
import { PhysicsGuard } from '../src/core/infrastructure/PhysicsGuard.js';

console.log('\n🔬 Dimensional Analysis Test\n');

const mass = new DimensionalValue(5.0, DIMENSIONS.MASS, 'mass');
const accel = new DimensionalValue(10.0, DIMENSIONS.ACCELERATION, 'accel');
const force = mass.multiply(accel);

console.log(`F = m × a: ${force.value} N`);
force.assertDimensions(DIMENSIONS.FORCE);
console.log('✓ Dimensions correct');

PhysicsGuard.assertNoErrors();
console.log('\n✅ Test complete\n');
