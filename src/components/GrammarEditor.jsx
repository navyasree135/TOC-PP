import React, { useState, useEffect } from 'react';
import { parseGrammarString, validateGrammar, DEFAULT_GRAMMAR_STRING } from '../grammar/rules';
import { Sliders, RotateCcw, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export default function GrammarEditor({ grammarString, onGrammarUpdate }) {
  const [localText, setLocalText] = useState(grammarString);
  const [error, setError] = useState(null);

  // Sync with prop if it resets or changes from outside
  useEffect(() => {
    setLocalText(grammarString);
  }, [grammarString]);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalText(text);

    try {
      const parsed = parseGrammarString(text);
      const validationError = validateGrammar(parsed);
      
      if (validationError) {
        setError(validationError);
      } else {
        setError(null);
        onGrammarUpdate(parsed, text);
      }
    } catch (err) {
      setError(`Grammar parsing failed: ${err.message}`);
    }
  };

  const handleReset = () => {
    setError(null);
    onGrammarUpdate(parseGrammarString(DEFAULT_GRAMMAR_STRING), DEFAULT_GRAMMAR_STRING);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-brand-purple" />
          <span className="font-semibold text-sm tracking-wide text-gray-200">CFG Rules Configurator</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Editor & Instructions Grid */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Validation Status Indicator */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-xs transition-all ${
          error 
            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {error ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 animate-bounce" />
              <div className="leading-snug">
                <span className="font-semibold">Invalid Grammar:</span> {error}
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="leading-snug">
                <span className="font-semibold">Grammar Active & Live:</span> The parser is compiles successfully with these CFG rules.
              </div>
            </>
          )}
        </div>

        {/* Text Area Input */}
        <div className="flex-1 relative flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border-t border-x border-white/10 rounded-t-lg text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            <span className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-brand-cyan" />
              <span>production_rules.cfg</span>
            </span>
            <span>UTF-8</span>
          </div>
          <textarea
            value={localText}
            onChange={handleChange}
            spellCheck="false"
            className="flex-1 w-full p-4 bg-[#0d1117]/80 text-[#c9d1d9] border border-white/10 rounded-b-lg font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-brand-purple/40 transition-colors placeholder-gray-600"
            style={{ minHeight: '260px' }}
          />
        </div>

        {/* Simple Grammar Helper Panel */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] text-gray-400 space-y-1.5">
          <p className="font-semibold text-gray-300">Quick Grammar Writing Guide:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Write LHS and RHS separated by <code className="text-brand-cyan px-0.5 bg-black/30 rounded font-mono">-&gt;</code>.</li>
            <li>Use <code className="text-brand-cyan px-0.5 bg-black/30 rounded font-mono">|</code> to specify alternative productions.</li>
            <li>Terminals are literal values (<code className="text-brand-purple">if</code>, <code className="text-brand-purple">=</code>, <code className="text-brand-purple">+</code>) or token names (<code className="text-brand-purple">ID</code>, <code className="text-brand-purple">NUMBER</code>).</li>
            <li>Non-terminals are defined on the left side of productions (like <code className="text-brand-purple">expr</code>, <code className="text-brand-purple">stmt</code>).</li>
            <li>An empty choice (like right of the last pipe or a blank production) represents epsilon <code className="text-brand-cyan">ε</code>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
