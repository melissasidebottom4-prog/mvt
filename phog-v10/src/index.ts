/**
 * PHOG V10 - Physics-Governed Receipt Engine
 *
 * Execute and verify physics laws with cryptographic receipts
 */

// Phase 1: Core engine
export * from './parser.js';
export * from './executor.js';
export * from './receipt.js';
export { PHYSICS_INDEX, getAllLaws, getLawById, getLawsByCategory } from './physics-index.js';

// Phase 2: Time-stepping with conservation
export * from './conservation.js';
export * from './integrators.js';
export * from './simulator.js';

// Phase 3: Multi-physics coupling
export * from './types.js';
export * from './entropyTracker.js';
export * from './solvers/index.js';
export * from './coupling/index.js';
