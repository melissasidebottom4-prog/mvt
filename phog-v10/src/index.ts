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
