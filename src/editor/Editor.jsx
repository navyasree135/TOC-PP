import React, { useMemo, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { tokenize, EarleyParser } from '../grammar/earley';
import { Sparkles, Terminal, Code } from 'lucide-react';

export default function Editor({ 
  value, 
  onChange, 
  grammar, 
  startSymbol = 'S',
  onParseUpdate 
}) {

  // Instantiate parser based on the grammar
  const parser = useMemo(() => new EarleyParser(grammar, startSymbol), [grammar, startSymbol]);

  // Run parser on the entire text and propagate results to parent
  useEffect(() => {
    try {
      const tokens = tokenize(value, grammar);
      const sets = parser.parse(tokens);
      
      // Check if S -> stmt* was completed successfully
      const lastSet = sets[sets.length - 1];
      const isSuccess = lastSet && lastSet.some(state => 
        state.ruleName === startSymbol && 
        state.isCompleted() && 
        state.start === 0
      );

      const parseTree = parser.getParseTree(sets, tokens);

      onParseUpdate({
        tokens,
        sets,
        parseTree,
        success: isSuccess,
        error: isSuccess ? null : 'Parsing incomplete or contains syntax errors.'
      });
    } catch (e) {
      console.error(e);
      onParseUpdate({
        tokens: [],
        sets: [],
        parseTree: null,
        success: false,
        error: e.message
      });
    }
  }, [value, parser, grammar, startSymbol, onParseUpdate]);

  // The custom autocomplete extension for CodeMirror
  const autocompleteExtension = useMemo(() => {
    return autocompletion({
      override: [
        (context) => {
          const docText = context.state.doc.toString();
          const pos = context.pos;

          // 1. Tokenize entire text
          const allTokens = tokenize(docText, grammar);

          // 2. Find variables currently defined in the file (e.g. ID = expr)
          const vars = new Set(['x', 'y', 'count', 'data']); // fallback/default vars
          for (let i = 0; i < allTokens.length - 1; i++) {
            if (allTokens[i].type === 'ID' && allTokens[i + 1].type === '=') {
              vars.add(allTokens[i].value);
            }
          }
          const variablesInScope = Array.from(vars);

          // 3. Find if the cursor is within or at the end of an alphanumeric token
          let tokenIndex = allTokens.findIndex(t => t.start <= pos && pos <= t.end);
          let prefix = '';
          let parserTokens = [];

          if (tokenIndex !== -1) {
            const activeToken = allTokens[tokenIndex];
            const isWord = /^[a-zA-Z0-9_]+$/.test(activeToken.value);
            
            if (isWord && pos > activeToken.start) {
              prefix = docText.slice(activeToken.start, pos);
              parserTokens = allTokens.slice(0, tokenIndex);
            } else {
              prefix = '';
              parserTokens = allTokens.slice(0, tokenIndex);
            }
          } else {
            // Cursor is at whitespace or end of file
            prefix = '';
            parserTokens = allTokens;
          }

          // 4. Run Earley parser on prefix tokens
          let expectedTerminals = [];
          try {
            const sets = parser.parse(parserTokens);
            // Predictions are available in the set at parserTokens.length (the state set just before the cursor)
            expectedTerminals = parser.getPredictionsAt(sets, parserTokens.length);
          } catch (err) {
            console.error('Autocomplete parse error:', err);
            return null;
          }

          // If no predictions, return empty list
          if (expectedTerminals.length === 0) return null;

          // 5. Expand terminal predictions into completions
          const options = [];
          
          expectedTerminals.forEach(term => {
            if (term === 'ID') {
              // Suggest variables
              variablesInScope.forEach(v => {
                options.push({
                  label: v,
                  type: 'variable',
                  detail: 'Variable (ID)',
                  boost: 2
                });
              });
            } else if (term === 'NUMBER') {
              // Suggest some mock numbers
              ['0', '1', '10'].forEach(num => {
                options.push({
                  label: num,
                  type: 'constant',
                  detail: 'Constant (NUMBER)',
                  boost: 1
                });
              });
            } else {
              // Suggest literals (keywords, symbols like '+', '=', 'if', etc.)
              const isOperator = /^[+\-*/=<>!&|]+$/.test(term);
              const isDelimiter = /^[\(\)\{\}\[\];,]+$/.test(term);
              
              options.push({
                label: term,
                type: isOperator ? 'operator' : isDelimiter ? 'punctuation' : 'keyword',
                detail: isOperator ? 'Operator' : isDelimiter ? 'Symbol' : 'Keyword',
                boost: isOperator || isDelimiter ? -1 : 3
              });
            }
          });

          // 6. Filter options by prefix
          const filteredOptions = options.filter(opt => 
            opt.label.toLowerCase().startsWith(prefix.toLowerCase())
          );

          if (filteredOptions.length === 0) return null;

          return {
            from: pos - prefix.length,
            options: filteredOptions
          };
        }
      ]
    });
  }, [grammar, parser]);

  // CodeMirror theme styling
  const customTheme = EditorView.theme({
    "&": {
      height: "400px",
      fontSize: "14px",
      borderRadius: "8px",
      overflow: "hidden"
    },
    ".cm-scroller": {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      backgroundColor: "#0d1117"
    },
    ".cm-content": {
      color: "#c9d1d9",
      padding: "16px 0"
    },
    ".cm-gutters": {
      backgroundColor: "#0d1117",
      color: "#8b949e",
      borderRight: "1px solid #21262d",
      padding: "16px 0"
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(110, 118, 129, 0.08)"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(110, 118, 129, 0.08)",
      color: "#f0f6fc"
    },
    ".cm-cursor": {
      borderLeftColor: "#58a6ff",
      borderLeftWidth: "2px"
    },
    // Autocomplete list style
    ".cm-tooltip-autocomplete": {
      backgroundColor: "#161b22",
      border: "1px solid #30363d",
      borderRadius: "6px",
      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
      overflow: "hidden"
    },
    ".cm-tooltip-autocomplete ul li": {
      padding: "6px 12px",
      color: "#c9d1d9"
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#1f6feb",
      color: "#ffffff"
    }
  });

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-2">
          <Code className="w-5 h-5 text-brand-purple" />
          <span className="font-semibold text-sm tracking-wide text-gray-200">Editor Panel</span>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-brand-purple/10 border-brand-purple/20 text-brand-purple">
          <Sparkles className="w-3.5 h-3.5 mr-0.5 animate-pulse" />
          CFG Predictive Autocomplete Active
        </div>
      </div>
      <div className="relative flex-1">
        <CodeMirror
          value={value}
          height="100%"
          extensions={[autocompleteExtension, customTheme]}
          onChange={onChange}
          theme="dark"
        />
      </div>
      <div className="flex items-center space-x-2 px-4 py-2 bg-white/5 border-t border-white/10 text-xs text-gray-400">
        <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
        <span>Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-200 text-[10px]">Ctrl + Space</kbd> to force open suggestions</span>
      </div>
    </div>
  );
}
