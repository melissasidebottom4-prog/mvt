/**
 * PHOG V10 - Receipt Generator
 * Creates cryptographically-signed receipts for physics law executions
 */

import crypto from 'crypto';
import type { ExecutionResult, ConstraintResult } from './executor.js';
import type { ConservationErrors } from './conservation.js';

export interface PhogReceipt {
  phog_version: string;
  law_id: string;
  timestamp: string;
  input_state: Record<string, number>;
  output_state: Record<string, number>;
  constraints_met: boolean;
  constraint_results: ConstraintResult[];
  execution_time_ms: number;
  error?: string;
  hash: string;
  prev_hash?: string;
  // Phase 2: Conservation tracking
  conservation_errors?: ConservationErrors;
  conservation_violations?: string[];
}

export interface ReceiptChain {
  receipts: PhogReceipt[];
  chain_hash: string;
}

/**
 * Generate a receipt from an execution result
 */
export function generateReceipt(
  result: ExecutionResult,
  prevHash?: string
): PhogReceipt {
  // Create receipt without hash
  const receiptData = {
    phog_version: '10.0.0',
    law_id: result.lawId,
    timestamp: new Date().toISOString(),
    input_state: result.inputState,
    output_state: result.outputState,
    constraints_met: result.constraintsMet,
    constraint_results: result.constraintResults,
    execution_time_ms: result.executionTime,
    error: result.error,
    prev_hash: prevHash
  };

  // Compute hash of the receipt data
  const hash = computeHash(receiptData);

  return {
    ...receiptData,
    hash
  };
}

/**
 * Compute SHA-256 hash of data
 */
export function computeHash(data: unknown): string {
  const json = JSON.stringify(data, (key, value) => {
    // Ensure consistent serialization of numbers
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return 'NaN';
      if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
    }
    return value;
  });

  return crypto.createHash('sha256').update(json).digest('hex');
}

/**
 * Verify a receipt's integrity
 */
export function verifyReceipt(receipt: PhogReceipt): { valid: boolean; reason?: string } {
  // Extract hash and compute expected hash
  const { hash, ...dataWithoutHash } = receipt;

  const expectedHash = computeHash(dataWithoutHash);

  if (hash !== expectedHash) {
    return {
      valid: false,
      reason: `Hash mismatch: expected ${expectedHash}, got ${hash}`
    };
  }

  return { valid: true };
}

/**
 * Generate a chain of receipts from multiple executions
 */
export function generateReceiptChain(results: ExecutionResult[]): ReceiptChain {
  const receipts: PhogReceipt[] = [];
  let prevHash: string | undefined;

  for (const result of results) {
    const receipt = generateReceipt(result, prevHash);
    receipts.push(receipt);
    prevHash = receipt.hash;
  }

  // Compute chain hash (hash of all receipt hashes)
  const chainHash = computeHash(receipts.map(r => r.hash));

  return {
    receipts,
    chain_hash: chainHash
  };
}

/**
 * Verify an entire receipt chain
 */
export function verifyReceiptChain(chain: ReceiptChain): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Verify each receipt
  for (let i = 0; i < chain.receipts.length; i++) {
    const receipt = chain.receipts[i];
    if (!receipt) continue;

    const verification = verifyReceipt(receipt);
    if (!verification.valid) {
      errors.push(`Receipt ${i} (${receipt.law_id}): ${verification.reason}`);
    }

    // Verify chain linkage
    if (i > 0) {
      const prevReceipt = chain.receipts[i - 1];
      if (prevReceipt && receipt.prev_hash !== prevReceipt.hash) {
        errors.push(`Receipt ${i}: prev_hash doesn't match previous receipt hash`);
      }
    }
  }

  // Verify chain hash
  const expectedChainHash = computeHash(chain.receipts.map(r => r.hash));
  if (chain.chain_hash !== expectedChainHash) {
    errors.push(`Chain hash mismatch: expected ${expectedChainHash}, got ${chain.chain_hash}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format a receipt for display
 */
export function formatReceipt(receipt: PhogReceipt): string {
  const lines = [
    '='.repeat(60),
    `PHOG RECEIPT v${receipt.phog_version}`,
    '='.repeat(60),
    `Law ID:      ${receipt.law_id}`,
    `Timestamp:   ${receipt.timestamp}`,
    `Verified:    ${receipt.constraints_met ? 'YES' : 'NO'}`,
    '-'.repeat(60),
    'INPUT STATE:',
    ...Object.entries(receipt.input_state).map(([k, v]) => `  ${k} = ${v}`),
    '-'.repeat(60),
    'OUTPUT STATE:',
    ...Object.entries(receipt.output_state).map(([k, v]) => `  ${k} = ${v}`),
    '-'.repeat(60),
    'CONSTRAINTS:',
    ...receipt.constraint_results.map(c =>
      `  ${c.met ? 'PASS' : 'FAIL'}: ${c.rawExpr} (value: ${c.value})`
    ),
    '-'.repeat(60),
    `Execution:   ${receipt.execution_time_ms.toFixed(3)} ms`,
    `Hash:        ${receipt.hash.substring(0, 32)}...`,
    receipt.prev_hash ? `Prev Hash:   ${receipt.prev_hash.substring(0, 32)}...` : '',
    '='.repeat(60),
  ].filter(Boolean);

  return lines.join('\n');
}
