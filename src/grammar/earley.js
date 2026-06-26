// Earley Parser, Lexer, and Autocomplete Predictor

/**
 * Tokenizer / Lexer
 */
export function tokenize(text, grammarRules = {}) {
  // Extract custom operators and keywords from the grammar to customize the lexer dynamically
  const keywords = new Set(['if', 'else', 'while', 'for', 'return', 'let', 'const', 'function']);
  const operators = new Set(['+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '+=', '-=']);
  const delimiters = new Set(['(', ')', '{', '}', '[', ']', ';', ',', '.']);

  // Extract from user grammar rules
  Object.values(grammarRules).forEach(productions => {
    productions.forEach(production => {
      production.forEach(symbol => {
        if (!grammarRules[symbol]) { // It's a terminal
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(symbol)) {
            keywords.add(symbol);
          } else if (symbol.length > 0 && !/^\d+$/.test(symbol)) {
            if (symbol.length === 1 && delimiters.has(symbol)) {
              // already in delimiters
            } else {
              operators.add(symbol);
            }
          }
        }
      });
    });
  });

  const tokens = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let val = '';
      const start = i;
      while (i < len && /\d/.test(text[i])) {
        val += text[i];
        i++;
      }
      // decimal
      if (i < len && text[i] === '.' && /\d/.test(text[i + 1])) {
        val += '.';
        i++;
        while (i < len && /\d/.test(text[i])) {
          val += text[i];
          i++;
        }
      }
      tokens.push({ type: 'NUMBER', value: val, start, end: i });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let val = '';
      const start = i;
      while (i < len && /[a-zA-Z0-9_]/.test(text[i])) {
        val += text[i];
        i++;
      }
      if (keywords.has(val)) {
        tokens.push({ type: val, value: val, start, end: i });
      } else {
        tokens.push({ type: 'ID', value: val, start, end: i });
      }
      continue;
    }

    // Multi-char operators (match longest first)
    let matchedOperator = false;
    for (const op of Array.from(operators).sort((a, b) => b.length - a.length)) {
      if (text.startsWith(op, i)) {
        tokens.push({ type: op, value: op, start: i, end: i + op.length });
        i += op.length;
        matchedOperator = true;
        break;
      }
    }
    if (matchedOperator) continue;

    // Delimiters / Single character operators
    if (delimiters.has(char) || operators.has(char)) {
      tokens.push({ type: char, value: char, start: i, end: i + 1 });
      i++;
      continue;
    }

    // Fallback/Unknown character
    tokens.push({ type: 'ERROR', value: char, start: i, end: i + 1 });
    i++;
  }

  return tokens;
}

/**
 * Earley Parser State Item
 */
export class State {
  constructor(ruleName, production, dot, start, end = start, completedChildren = []) {
    this.ruleName = ruleName;
    this.production = production; // Array of symbols
    this.dot = dot;               // Position of •
    this.start = start;           // Index in token stream where matching this rule started
    this.end = end;               // Index in token stream where current match ends
    this.completedChildren = completedChildren; // States/Leaves that matched symbols
  }

  isCompleted() {
    return this.dot >= this.production.length;
  }

  nextSymbol() {
    return this.isCompleted() ? null : this.production[this.dot];
  }

  key() {
    // Unique identifier for deduplication in a state set
    return `${this.ruleName}->${this.production.join(' ')}@${this.dot}:${this.start}`;
  }

  clone() {
    return new State(
      this.ruleName,
      this.production,
      this.dot,
      this.start,
      this.end,
      [...this.completedChildren]
    );
  }
}

/**
 * Earley Parser
 */
export class EarleyParser {
  constructor(grammar, startSymbol = 'S') {
    this.grammar = grammar;
    this.startSymbol = startSymbol;
  }

  parse(tokens) {
    const sets = Array.from({ length: tokens.length + 1 }, () => []);
    const addedKeys = Array.from({ length: tokens.length + 1 }, () => new Set());

    const addState = (setIndex, state) => {
      state.end = setIndex;
      const k = state.key();
      if (!addedKeys[setIndex].has(k)) {
        addedKeys[setIndex].add(k);
        sets[setIndex].push(state);
        return true;
      }
      return false;
    };

    // Initialize Set 0
    if (this.grammar[this.startSymbol]) {
      this.grammar[this.startSymbol].forEach(prod => {
        addState(0, new State(this.startSymbol, prod, 0, 0));
      });
    }

    // Process each set
    for (let j = 0; j <= tokens.length; j++) {
      const set = sets[j];
      let i = 0;

      // set can grow during iteration (new predictions/completions)
      while (i < set.length) {
        const state = set[i];

        if (!state.isCompleted()) {
          const next = state.nextSymbol();

          if (this.grammar[next]) {
            // Predict
            this.grammar[next].forEach(prod => {
              const newState = new State(next, prod, 0, j);
              addState(j, newState);

              // Handle epsilon productions right away
              if (prod.length === 0) {
                // If it is an empty production, it's immediately completed!
                const epsState = new State(next, prod, 0, j, j);
                addState(j, epsState);
              }
            });
          }
        } else {
          // Complete
          const parentSet = sets[state.start];
          parentSet.forEach(parent => {
            if (!parent.isCompleted() && parent.nextSymbol() === state.ruleName) {
              const advanced = parent.clone();
              advanced.dot++;
              advanced.completedChildren.push(state);
              addState(j, advanced);
            }
          });
        }
        i++;
      }

      // Scan: move tokens to next set
      if (j < tokens.length) {
        const token = tokens[j];
        set.forEach(state => {
          if (!state.isCompleted()) {
            const next = state.nextSymbol();
            // If next symbol matches token type (e.g. ID, NUMBER, or literal token like 'if', '+')
            if (next === token.type || next === token.value) {
              const advanced = state.clone();
              advanced.dot++;
              // Add terminal leaf node
              advanced.completedChildren.push({
                ruleName: next,
                isTerminal: true,
                value: token.value,
                start: token.start,
                end: token.end
              });
              addState(j + 1, advanced);
            }
          }
        });
      }
    }

    return sets;
  }

  /**
   * Retrieve predictions (expected terminals) at a specific token position
   */
  getPredictionsAt(sets, tokenIndex) {
    if (tokenIndex < 0 || tokenIndex >= sets.length) return [];
    
    const set = sets[tokenIndex];
    const expected = new Set();

    set.forEach(state => {
      if (!state.isCompleted()) {
        const next = state.nextSymbol();
        // If it's a terminal (not a rule in grammar)
        if (!this.grammar[next]) {
          expected.add(next);
        }
      }
    });

    return Array.from(expected);
  }

  /**
   * Builds a clean tree object from the completed start symbol state.
   * If parsing is incomplete or failed, it returns a tree from the largest partial match.
   */
  getParseTree(sets, tokens) {
    // 1. Check if we successfully parsed the entire input
    const lastSet = sets[sets.length - 1];
    let rootState = null;

    if (lastSet) {
      rootState = lastSet.find(state => 
        state.ruleName === this.startSymbol && 
        state.isCompleted() && 
        state.start === 0
      );
    }

    // 2. If no complete parse tree, find the "longest" successful sub-parse
    if (!rootState) {
      for (let j = sets.length - 1; j >= 0; j--) {
        const set = sets[j];
        // Look for any state starting at 0 that is completed and represents a statement
        const partialRoot = set.find(state => 
          state.isCompleted() && 
          state.start === 0 &&
          (state.ruleName === this.startSymbol || this.grammar[this.startSymbol].some(p => p.includes(state.ruleName)))
        );
        if (partialRoot) {
          rootState = partialRoot;
          break;
        }
      }
    }

    // 3. Fallback: just pick the first completed state from the last set possible
    if (!rootState) {
      for (let j = sets.length - 1; j >= 0; j--) {
        if (sets[j] && sets[j].length > 0) {
          const completed = sets[j].find(state => state.isCompleted());
          if (completed) {
            rootState = completed;
            break;
          }
        }
      }
    }

    if (!rootState) return null;

    // Convert parser states recursive tree to a D3/Render-friendly tree structure
    const formatNode = (node, idObj = { id: 0 }) => {
      const currentId = idObj.id++;
      
      if (node.isTerminal) {
        return {
          id: currentId,
          name: node.ruleName,
          value: node.value,
          isTerminal: true,
          start: node.start,
          end: node.end
        };
      }

      // Non-terminal state
      return {
        id: currentId,
        name: node.ruleName,
        isTerminal: false,
        start: node.start,
        end: node.end,
        children: node.completedChildren.map(child => formatNode(child, idObj))
      };
    };

    return formatNode(rootState);
  }
}
