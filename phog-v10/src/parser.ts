/**
 * PHOG V10 - Physics Law Parser
 * Parses .phog law definitions into executable structures
 */

export interface PhogEquation {
  lhs: string;
  rhs: string;
}

export interface PhogConstraint {
  expr: string;
  operator: '<' | '>' | '<=' | '>=' | '==';
  threshold: number;
  rawExpr: string;
}

export interface PhogLaw {
  id: string;
  equations: PhogEquation[];
  constants: Record<string, number>;
  constraints: PhogConstraint[];
  rawText: string;
}

/**
 * Parse a single .phog law definition
 */
export function parseLaw(input: string): PhogLaw {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));

  // Extract law ID from first line
  const idMatch = lines[0]?.match(/law\s+(\w+)/);
  if (!idMatch) {
    throw new Error('Missing law identifier. Expected: law <name> { ... }');
  }
  const id = idMatch[1];

  const equations: PhogEquation[] = [];
  const constants: Record<string, number> = {};
  const constraints: PhogConstraint[] = [];

  for (const line of lines.slice(1)) {
    // Skip braces
    if (line === '{' || line === '}') continue;

    // Parse constants: constant: G = 6.674e-11
    if (line.startsWith('constant:')) {
      const match = line.match(/constant:\s*(\w+)\s*=\s*([\d.e+-]+)/i);
      if (match && match[1] && match[2]) {
        constants[match[1]] = parseFloat(match[2]);
      }
      continue;
    }

    // Parse constraints: constraint: abs(F - m * a) < 1e-6
    if (line.startsWith('constraint:')) {
      const constraint = parseConstraint(line);
      if (constraint) {
        constraints.push(constraint);
      }
      continue;
    }

    // Parse equations: F = m * a (but not constraints with comparison operators)
    if (line.includes('=') && !line.includes('<') && !line.includes('>') && !line.startsWith('constant')) {
      const eqParts = line.split('=');
      if (eqParts.length >= 2 && eqParts[0] && eqParts[1]) {
        const lhs = eqParts[0].trim();
        const rhs = eqParts.slice(1).join('=').trim();
        equations.push({ lhs, rhs });
      }
    }
  }

  return {
    id,
    equations,
    constants,
    constraints,
    rawText: input
  };
}

/**
 * Parse a constraint line into a structured constraint
 */
function parseConstraint(line: string): PhogConstraint | null {
  // Remove "constraint:" prefix
  const expr = line.replace(/^constraint:\s*/, '').trim();

  // Try different comparison operators
  const operators: Array<{ op: PhogConstraint['operator']; regex: RegExp }> = [
    { op: '<=', regex: /(.+?)\s*<=\s*([\d.e+-]+)/ },
    { op: '>=', regex: /(.+?)\s*>=\s*([\d.e+-]+)/ },
    { op: '<', regex: /(.+?)\s*<\s*([\d.e+-]+)/ },
    { op: '>', regex: /(.+?)\s*>\s*([\d.e+-]+)/ },
    { op: '==', regex: /(.+?)\s*==\s*([\d.e+-]+)/ },
  ];

  for (const { op, regex } of operators) {
    const match = expr.match(regex);
    if (match && match[1] && match[2]) {
      return {
        expr: match[1].trim(),
        operator: op,
        threshold: parseFloat(match[2]),
        rawExpr: expr
      };
    }
  }

  // Handle boolean-style constraints like: delta_x * delta_p >= h_bar / 2
  // These become: check if the expression evaluates truthy
  const boolMatch = expr.match(/(.+?)\s*(>=|<=|>|<)\s*(.+)/);
  if (boolMatch && boolMatch[1] && boolMatch[2] && boolMatch[3]) {
    return {
      expr: `${boolMatch[1].trim()} ${boolMatch[2]} ${boolMatch[3].trim()}`,
      operator: boolMatch[2] as PhogConstraint['operator'],
      threshold: 0,
      rawExpr: expr
    };
  }

  // Handle simple boolean constraints (no threshold)
  return {
    expr: expr,
    operator: '>',
    threshold: 0,
    rawExpr: expr
  };
}

/**
 * Parse multiple laws from a physics index file
 */
export function parseLaws(input: string): PhogLaw[] {
  const laws: PhogLaw[] = [];
  const lawBlocks = input.split(/(?=law\s+\w+\s*\{)/);

  for (const block of lawBlocks) {
    const trimmed = block.trim();
    if (trimmed.startsWith('law ')) {
      try {
        laws.push(parseLaw(trimmed));
      } catch (e) {
        // Skip malformed laws
        console.warn(`Warning: Could not parse law block: ${trimmed.substring(0, 50)}...`);
      }
    }
  }

  return laws;
}

/**
 * Validate a parsed law for completeness
 */
export function validateLaw(law: PhogLaw): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!law.id) {
    errors.push('Law must have an identifier');
  }

  if (law.equations.length === 0) {
    errors.push('Law must have at least one equation');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
