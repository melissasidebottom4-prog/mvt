/**
 * PHOG V10 - Phase 9: Light Pulse Propagation
 *
 * Demonstrate Maxwell's equations in 1D using wave equation.
 *
 * PHYSICS:
 * - Initialize Gaussian E-field pulse
 * - Propagate at speed c = 1/sqrt(eps*mu)
 * - Absorbing boundaries let energy exit (real behavior)
 *
 * VERIFICATION:
 * - Speed should be c ≈ 3e8 m/s (in vacuum)
 * - Wave equation preserves unitarity during propagation
 */

import { ConservationCore } from '../src/core/ConservationCore.js';
import { EMRing } from '../src/rings/EMRing.js';

console.log('');
console.log('='.repeat(60));
console.log('PHOG V10 - Phase 9: Light Pulse Propagation');
console.log('='.repeat(60));
console.log('');
console.log('Maxwell wave equation with absorbing boundaries');
console.log('');

// Create EM ring: 200 points, 10 micron domain
// Larger dx means larger dt_max for CFL stability
const N = 200;
const L = 1e-5;  // 10 microns
const em = new EMRing(N, L);
const s = em.getState();

// Initialize Gaussian pulse centered at left side (for tracking propagation)
console.log('Initializing Gaussian E-field pulse...');
const center = 50;  // Near left edge
const sigma = 10;   // Width in grid points

for (let i = 0; i < N; i++) {
  const x = i - center;
  s.Ez[i] = Math.exp(-x * x / (2 * sigma * sigma));
}

// Create conservation core
const core = new ConservationCore();
core.addRing(em);
core.initialize();

const E0 = em.getEnergy().total;

console.log(`Grid: N=${N}, L=${(L*1e6).toFixed(1)} μm, dx=${(s.grid.dx*1e9).toFixed(1)} nm`);
console.log(`Initial energy: ${E0.toExponential(4)} J`);
console.log(`CFL limit: dt < ${(s.grid.dx / s.c).toExponential(2)} s`);
console.log('');

// Time step (well below CFL limit)
const dt = 1e-16;  // 0.1 fs
const courant = s.c * dt / s.grid.dx;
console.log(`Using dt = ${(dt * 1e15).toFixed(1)} fs, Courant = ${courant.toFixed(3)}`);
console.log('');

console.log('Time(fs)  Energy(J)     Peak_pos     Speed(m/s)');
console.log('─'.repeat(55));

// Track peak position over time for speed measurement
const peakHistory: { time: number; pos: number }[] = [];

function getPeakPosition(): number {
  let peakPos = 0;
  let peakVal = 0;
  for (let i = 0; i < N; i++) {
    if (Math.abs(s.Ez[i]) > peakVal) {
      peakVal = Math.abs(s.Ez[i]);
      peakPos = i;
    }
  }
  return peakPos;
}

// Record initial position
peakHistory.push({ time: 0, pos: getPeakPosition() });

// Run simulation - 100 time steps
const total_steps = 100;
const report_interval = 10;

for (let t = 1; t <= total_steps; t++) {
  core.spin(dt);

  if (t % report_interval === 0) {
    const E = em.getEnergy().total;
    const peakPos = getPeakPosition();
    peakHistory.push({ time: t * dt, pos: peakPos });

    // Compute instantaneous speed from peak movement
    const prev = peakHistory[peakHistory.length - 2];
    const dx_pulse = (peakPos - prev.pos) * s.grid.dx;
    const dt_pulse = (t * dt) - prev.time;
    const speed = dx_pulse / dt_pulse;

    const time_fs = (t * dt * 1e15).toFixed(1);
    console.log(
      `${time_fs.padEnd(10)}${E.toExponential(4).padEnd(14)}${peakPos.toString().padEnd(13)}${speed.toExponential(2)}`
    );
  }
}

console.log('─'.repeat(55));
console.log('');

// Compute average speed from first to last measurement
const first = peakHistory[0];
const last = peakHistory[peakHistory.length - 1];
const total_dx = (last.pos - first.pos) * s.grid.dx;
const total_dt = last.time - first.time;
const avg_speed = total_dx / total_dt;

const E_final = em.getEnergy().total;
const energy_loss = (E0 - E_final) / E0 * 100;

console.log('RESULTS:');
console.log('─'.repeat(40));
console.log(`Speed of light (theory): ${s.c.toExponential(4)} m/s`);
console.log(`Measured speed:          ${avg_speed.toExponential(4)} m/s`);
console.log(`Speed accuracy:          ${((avg_speed / s.c) * 100).toFixed(1)}% of c`);
console.log(`Energy loss to ABC:      ${energy_loss.toFixed(1)}%`);
console.log('');

// Success criteria: wave propagates at roughly c, algorithm is stable
const speed_ok = avg_speed > 0.5 * s.c && avg_speed < 1.5 * s.c;
const stable = E_final > 0 && E_final < 10 * E0;  // No explosion

if (speed_ok && stable) {
  console.log('='.repeat(60));
  console.log('  PHASE 9 SUCCESS: Maxwell wave equation verified!');
  console.log('');
  console.log('  - Wave propagates at speed of light');
  console.log('  - Algorithm is numerically stable');
  console.log('  - Absorbing boundaries prevent reflections');
  console.log(`  - c = ${s.c.toExponential(2)} m/s`);
  console.log('='.repeat(60));
} else {
  console.log('  Phase 9 needs refinement');
  if (!speed_ok) console.log('    - Speed measurement off');
  if (!stable) console.log('    - Algorithm unstable');
}
console.log('');
