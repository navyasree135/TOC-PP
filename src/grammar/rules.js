// Default Grammar Rules and Grammar Parsing Helpers

export const DEFAULT_GRAMMAR_STRING = `# Context-Free Grammar for Mini-Python/Pseudocode
# Capitalized names like 'ID' and 'NUMBER' are lexical classes.
# Literal matches are written directly, like 'if', '=', '+', ';'.
# Empty production (epsilon) is represented by writing nothing on the RHS of '|'.

S -> stmt | stmt S

stmt -> if_stmt | while_stmt | assign_stmt | func_call

if_stmt -> if ( expr ) { S } | if ( expr ) { S } else { S }

while_stmt -> while ( expr ) { S }

assign_stmt -> ID = expr ;

func_call -> ID ( args ) ;

args -> | expr_list

expr_list -> expr | expr , expr_list

expr -> term | expr + term | expr - term

term -> factor | term * factor | term / factor

factor -> ID | NUMBER | ( expr )
`;

/**
 * Parses a string of production rules into a JS Object grammar representation.
 * Format:
 * LHS -> RHS1 | RHS2 | RHS3
 */
export function parseGrammarString(str) {
  const grammar = {};
  const lines = str.split('\n');
  
  for (let line of lines) {
    // Strip comments
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    
    line = line.trim();
    if (!line) continue;
    
    const parts = line.split(/->|::=/);
    if (parts.length < 2) continue;
    
    const lhs = parts[0].trim();
    const rhsStr = parts[1].trim();
    
    if (!grammar[lhs]) {
      grammar[lhs] = [];
    }
    
    const productions = rhsStr.split('|');
    productions.forEach(prod => {
      const symbols = prod.trim().split(/\s+/).filter(s => s !== '' && s !== 'ε' && s !== 'epsilon');
      // If symbols is empty, it represents an epsilon (empty) production
      grammar[lhs].push(symbols);
    });
  }
  
  return grammar;
}

/**
 * Formats a grammar object back to string form
 */
export function formatGrammar(grammar) {
  return Object.entries(grammar)
    .map(([lhs, productions]) => {
      const prodStrings = productions.map(prod => prod.length === 0 ? 'ε' : prod.join(' '));
      return `${lhs} -> ${prodStrings.join(' | ')}`;
    })
    .join('\n');
}

/**
 * Validates whether a parsed grammar has a valid structure:
 * - Has a start symbol
 * - No infinite recursion on empty productions (simple check)
 * - All symbols on RHS that are uppercase or match literal syntax are handled.
 */
export function validateGrammar(grammar, startSymbol = 'S') {
  if (!grammar[startSymbol]) {
    return `Missing start symbol '${startSymbol}' in grammar rules.`;
  }
  
  const definedNonTerminals = new Set(Object.keys(grammar));
  
  for (const [lhs, productions] of Object.entries(grammar)) {
    if (productions.length === 0) {
      return `Rule '${lhs}' has no production rules defined.`;
    }
    for (const prod of productions) {
      for (const symbol of prod) {
        // If symbol is neither defined non-terminal nor looks like a valid terminal
        if (symbol === lhs && prod.length === 1) {
          return `Infinite recursion loop detected: ${lhs} -> ${symbol}`;
        }
      }
    }
  }
  
  return null; // Valid
}
