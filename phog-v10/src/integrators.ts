/**
 * PHOG V10 - Integrators with Conservation Checking
 *
 * Numerical integration methods that verify conservation at each step
 */

import { checkConservation, type ConservationErrors } from './conservation.js';

export type StateVector = Record<string, number>;
export type DerivativeFunction = (state: StateVector) => StateVector;

export interface IntegrationResult {
  state: StateVector;
  conservation: {
    valid: boolean;
    errors: ConservationErrors;
    violations: string[];
  };
}

export interface Integrator {
  name: string;
  order: number;
  step(
    state: StateVector,
    derivatives: DerivativeFunction,
    dt: number
  ): IntegrationResult;
}

/**
 * Forward Euler method (1st order)
 * x(t+dt) = x(t) + dx/dt * dt
 */
export const euler: Integrator = {
  name: 'euler',
  order: 1,
  step(state, derivatives, dt) {
    const dstate = derivatives(state);
    const newState: StateVector = {};

    for (const key in state) {
      newState[key] = state[key]! + (dstate[key] ?? 0) * dt;
    }

    const conservation = checkConservation(state, newState);

    return { state: newState, conservation };
  }
};

/**
 * Midpoint method (2nd order)
 * k1 = f(x)
 * x(t+dt) = x(t) + f(x + k1*dt/2) * dt
 */
export const midpoint: Integrator = {
  name: 'midpoint',
  order: 2,
  step(state, derivatives, dt) {
    const k1 = derivatives(state);

    // Compute midpoint state
    const midState: StateVector = {};
    for (const key in state) {
      midState[key] = state[key]! + (k1[key] ?? 0) * dt / 2;
    }

    const k2 = derivatives(midState);

    // Final state
    const newState: StateVector = {};
    for (const key in state) {
      newState[key] = state[key]! + (k2[key] ?? 0) * dt;
    }

    const conservation = checkConservation(state, newState);

    return { state: newState, conservation };
  }
};

/**
 * Classical 4th-order Runge-Kutta (RK4)
 * Most common general-purpose integrator
 */
export const rk4: Integrator = {
  name: 'rk4',
  order: 4,
  step(state, derivatives, dt) {
    // k1 = f(x, t)
    const k1 = derivatives(state);

    // k2 = f(x + k1*dt/2, t + dt/2)
    const state2: StateVector = {};
    for (const key in state) {
      state2[key] = state[key]! + (k1[key] ?? 0) * dt / 2;
    }
    const k2 = derivatives(state2);

    // k3 = f(x + k2*dt/2, t + dt/2)
    const state3: StateVector = {};
    for (const key in state) {
      state3[key] = state[key]! + (k2[key] ?? 0) * dt / 2;
    }
    const k3 = derivatives(state3);

    // k4 = f(x + k3*dt, t + dt)
    const state4: StateVector = {};
    for (const key in state) {
      state4[key] = state[key]! + (k3[key] ?? 0) * dt;
    }
    const k4 = derivatives(state4);

    // x(t+dt) = x(t) + (k1 + 2*k2 + 2*k3 + k4) * dt/6
    const newState: StateVector = {};
    for (const key in state) {
      const dk = (k1[key] ?? 0) + 2 * (k2[key] ?? 0) + 2 * (k3[key] ?? 0) + (k4[key] ?? 0);
      newState[key] = state[key]! + dk * dt / 6;
    }

    const conservation = checkConservation(state, newState);

    return { state: newState, conservation };
  }
};

/**
 * Symplectic Euler (preserves phase space volume)
 * Better for Hamiltonian systems (energy conservation)
 *
 * For q (position) and p (momentum):
 * p(t+dt) = p(t) + F(q) * dt
 * q(t+dt) = q(t) + p(t+dt)/m * dt
 */
export const symplecticEuler: Integrator = {
  name: 'symplectic_euler',
  order: 1,
  step(state, derivatives, dt) {
    const dstate = derivatives(state);
    const newState: StateVector = { ...state };

    // First update velocity/momentum
    if ('v' in state && 'dv' in dstate) {
      newState.v = state.v! + (dstate.dv ?? 0) * dt;
    } else if ('v' in state) {
      // Use acceleration from derivatives
      const a = dstate.v ?? 0;
      newState.v = state.v! + a * dt;
    }

    // Then update position using NEW velocity
    if ('y' in state) {
      newState.y = state.y! + (newState.v ?? state.v ?? 0) * dt;
    }
    if ('x' in state) {
      newState.x = state.x! + (newState.vx ?? state.vx ?? 0) * dt;
    }

    const conservation = checkConservation(state, newState);

    return { state: newState, conservation };
  }
};

/**
 * Velocity Verlet (2nd order symplectic)
 * Excellent energy conservation for mechanical systems
 */
export const verlet: Integrator = {
  name: 'velocity_verlet',
  order: 2,
  step(state, derivatives, dt) {
    const a1 = derivatives(state);
    const newState: StateVector = { ...state };

    // Half-step velocity
    const v_half = (state.v ?? 0) + (a1.v ?? 0) * dt / 2;

    // Full-step position
    newState.y = (state.y ?? 0) + v_half * dt;

    // Get acceleration at new position
    const a2 = derivatives(newState);

    // Full-step velocity
    newState.v = v_half + (a2.v ?? 0) * dt / 2;

    const conservation = checkConservation(state, newState);

    return { state: newState, conservation };
  }
};

/**
 * Get integrator by name
 */
export function getIntegrator(name: string): Integrator {
  const integrators: Record<string, Integrator> = {
    euler,
    midpoint,
    rk4,
    symplectic_euler: symplecticEuler,
    velocity_verlet: verlet,
    verlet
  };

  const integrator = integrators[name.toLowerCase()];
  if (!integrator) {
    throw new Error(`Unknown integrator: ${name}. Available: ${Object.keys(integrators).join(', ')}`);
  }

  return integrator;
}

/**
 * List available integrators
 */
export function listIntegrators(): Array<{ name: string; order: number }> {
  return [
    { name: 'euler', order: 1 },
    { name: 'midpoint', order: 2 },
    { name: 'rk4', order: 4 },
    { name: 'symplectic_euler', order: 1 },
    { name: 'velocity_verlet', order: 2 }
  ];
}
