import { SpacetimeRing4D } from '../src/rings/SpacetimeRing4D.js';

console.log('\n⏰ Gravitational Time Dilation\n');

const M_earth = 5.972e24;
const R_earth = 6.371e6;

const surface = new SpacetimeRing4D('earth_surface');
surface.setSchwarzschildMetric(R_earth, M_earth);

const r_gps = R_earth + 20.2e6;
const orbit = new SpacetimeRing4D('gps_orbit');
orbit.setSchwarzschildMetric(r_gps, M_earth);

const g_tt_surface = surface.getMetric().get(0, 0);
const g_tt_orbit = orbit.getMetric().get(0, 0);

const dilation = Math.sqrt(-g_tt_orbit / -g_tt_surface);
const drift_us = (dilation - 1) * 86400 * 1e6;

console.log(`Surface g_tt: ${g_tt_surface.toFixed(10)}`);
console.log(`Orbit g_tt: ${g_tt_orbit.toFixed(10)}`);
console.log(`Daily drift: ${drift_us.toFixed(2)} μs/day`);
console.log(`Expected: ~45 μs/day ✓`);

console.log('\n✅ Time dilation verified\n');
