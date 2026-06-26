import React from 'react';
import { Eye, HelpCircle, Terminal, Plus, FileCode } from 'lucide-react';

export default function Suggestions({ 
  tokens, 
  sets, 
  grammar, 
  onInsert,
  parseError
}) {
  
  // Extract predictions and their source rules from the current parse state
  const predictionsInfo = React.useMemo(() => {
    if (!sets || sets.length === 0) return [];
    
    // The current parsing frontier is at sets.length - 1
    const lastSet = sets[sets.length - 1];
    if (!lastSet) return [];

    const map = new Map(); // terminal -> Array of triggering states/rules

    lastSet.forEach(state => {
      if (!state.isCompleted()) {
        const next = state.nextSymbol();
        // If it's a terminal
        if (!grammar[next]) {
          if (!map.has(next)) {
            map.set(next, []);
          }
          // Store the rule definition triggering this expectation
          const prodStr = [
            ...state.production.slice(0, state.dot),
            '•',
            ...state.production.slice(state.dot)
          ].join(' ');
          map.get(next).push(`${state.ruleName} -> ${prodStr}`);
        }
      }
    });

    return Array.from(map.entries()).map(([terminal, sources]) => ({
      terminal,
      sources: Array.from(new Set(sources)) // deduplicate
    }));
  }, [sets, grammar]);

  // Extract declared variables to recommend for ID completions
  const variables = React.useMemo(() => {
    if (!tokens) return [];
    const vars = new Set();
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'ID' && tokens[i + 1].type === '=') {
        vars.add(tokens[i].value);
      }
    }
    return Array.from(vars);
  }, [tokens]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-brand-purple" />
          <span className="font-semibold text-sm tracking-wide text-gray-200">Active CFG Predictions</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Token Stream Tracker */}
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Parsed Token Stream</span>
          <div className="flex flex-wrap gap-1 p-2.5 bg-black/30 border border-white/5 rounded-lg min-h-[42px] items-center">
            {tokens && tokens.length > 0 ? (
              tokens.map((tok, idx) => (
                <span 
                  key={`tok-${idx}`} 
                  className={`px-2 py-0.5 rounded font-mono text-xs select-none transition-colors border ${
                    tok.type === 'ERROR'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : /^[a-zA-Z_]/.test(tok.type) && !grammar[tok.type]
                      ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                      : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'
                  }`}
                  title={`Lexeme: "${tok.value}"\nType: ${tok.type}\nSpan: ${tok.start}-${tok.end}`}
                >
                  {tok.value}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">Token stream is empty. Start typing...</span>
            )}
          </div>
        </div>

        {/* Prediction Options */}
        <div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Expected Next Symbols</span>
          {predictionsInfo.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {predictionsInfo.map(({ terminal, sources }) => {
                const isSpecial = terminal === 'ID' || terminal === 'NUMBER';
                return (
                  <div 
                    key={`pred-${terminal}`}
                    className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      {/* Suggestion pill */}
                      <span className={`px-2.5 py-1 rounded font-mono text-xs font-bold border shadow-inner ${
                        isSpecial
                          ? 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'
                          : 'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                      }`}>
                        {terminal}
                      </span>
                      
                      {/* Click-to-insert actions */}
                      <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {terminal === 'ID' ? (
                          variables.length > 0 ? (
                            variables.map(v => (
                              <button
                                key={`ins-${v}`}
                                onClick={() => onInsert(v)}
                                className="flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] bg-brand-cyan/20 hover:bg-brand-cyan/35 text-brand-cyan font-mono border border-brand-cyan/20 transition-all cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>{v}</span>
                              </button>
                            ))
                          ) : (
                            ['x', 'y', 'val'].map(v => (
                              <button
                                key={`ins-def-${v}`}
                                onClick={() => onInsert(v)}
                                className="flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-mono border border-brand-cyan/10 transition-all cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>{v}</span>
                              </button>
                            ))
                          )
                        ) : terminal === 'NUMBER' ? (
                          ['5', '10', '0'].map(num => (
                            <button
                              key={`ins-num-${num}`}
                              onClick={() => onInsert(num)}
                              className="flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] bg-brand-cyan/15 hover:bg-brand-cyan/25 text-brand-cyan font-mono border border-brand-cyan/15 transition-all cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{num}</span>
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => onInsert(terminal)}
                            className="flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] bg-brand-purple/20 hover:bg-brand-purple/35 text-brand-purple border border-brand-purple/20 font-medium transition-all cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Insert</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Source trace explanation */}
                    <div className="text-[10px] text-gray-500 font-mono pl-1 space-y-0.5 border-l border-white/5">
                      {sources.map((src, sIdx) => (
                        <div key={`src-${sIdx}`} className="truncate" title={src}>
                          • {src}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-white/5 border border-dashed border-white/5 rounded-lg text-center">
              <span className="text-xs text-gray-500 italic">
                {parseError ? "Waiting for valid syntax prefix..." : "No next symbols expected (parsing finished)."}
              </span>
            </div>
          )}
        </div>

        {/* Local Scope variables list */}
        {variables.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-1.5">Identifiers in Scope</span>
            <div className="flex flex-wrap gap-1.5">
              {variables.map(v => (
                <span 
                  key={`scope-var-${v}`}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-brand-cyan/5 border border-brand-cyan/15 text-brand-cyan font-mono text-xs"
                >
                  <FileCode className="w-3 h-3 text-brand-cyan" />
                  <span>{v}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
