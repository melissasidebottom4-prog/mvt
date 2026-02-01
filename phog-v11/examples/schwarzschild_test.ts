import { SpacetimeRing4D } from '../src/rings/SpacetimeRing4D.js';

console.log('\n🌌 Schwarzschild Metric Test\n');

const M_sun = 1.989e30;
const G = 6.674e-11;
const c = 299792458;
const r_s = 2 * G * M_sun / (c * c);

console.log(`Schwarzschild radius: ${(r_s / 1000).toFixed(2)} km`);

const spacetime = new SpacetimeRing4D('schwarzschild');
spacetime.setSchwarzschildMetric(3 * r_s, M_sun);

const metric = spacetime.getMetric();
console.log(`\nAt r = 3r_s:`);
console.log(`  g_tt = ${metric.get(0, 0).toFixed(6)}`);
console.log(`  g_rr = ${metric.get(1, 1).toFixed(6)}`);

console.log('\n✅ Schwarzschild metric initialized\n');
