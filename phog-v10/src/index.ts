/**
 * PHOG V10 - Physics-Governed Receipt Engine
 *
 * Execute and verify physics laws with cryptographic receipts
 */

export * from './parser.js';
export * from './executor.js';
export * from './receipt.js';
export { PHYSICS_INDEX, getAllLaws, getLawById, getLawsByCategory } from './physics-index.js';
