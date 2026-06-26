import React, { useState, useCallback } from 'react';
import Editor from './editor/Editor';
import Suggestions from './editor/Suggestions';
import ParseTree from './visualizer/ParseTree';
import GrammarEditor from './components/GrammarEditor';
import AcademicGuide from './components/AcademicGuide';
import { DEFAULT_GRAMMAR_STRING, parseGrammarString } from './grammar/rules';
import { 
  Terminal, 
  Sliders, 
  BookOpen, 
  GitFork, 
  FileCode2, 
  Cpu, 
  Play, 
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SAMPLES = [
  {
    name: "Simple Condition",
    code: `if ( x = 5 ) {\n  y = 10 ;\n}`
  },
  {
    name: "While Loop & Sum",
    code: `while ( count = 10 ) {\n  sum = sum + count ;\n  count = count - 1 ;\n}`
  },
  {
    name: "Nested If Blocks",
    code: `if ( x = y ) {\n  if ( count = 1 ) {\n    my_func ( val ) ;\n  }\n}`
  },
  {
    name: "Arithmetic & Calls",
    code: `total = 5 * ( base + offset ) ;\ncalculate ( total , multiplier ) ;`
  }
];

export default function App() {
  const [grammarString, setGrammarString] = useState(DEFAULT_GRAMMAR_STRING);
  const [grammar, setGrammar] = useState(() => parseGrammarString(DEFAULT_GRAMMAR_STRING));
  
  const [code, setCode] = useState(SAMPLES[0].code);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'grammar' | 'guide'

  const [parseResult, setParseResult] = useState({
    tokens: [],
    sets: [],
    parseTree: null,
    success: false,
    error: null
  });

  const handleParseUpdate = useCallback((result) => {
    setParseResult(result);
  }, []);

  const handleGrammarUpdate = useCallback((newGrammar, newString) => {
    setGrammar(newGrammar);
    setGrammarString(newString);
  }, []);

  // Tap-to-insert autocompletion suggestion
  const handleInsertSuggestion = useCallback((suggestionText) => {
    setCode((prev) => {
      const trimmed = prev.trimEnd();
      
      // Delimiters (brackets, semi, comma) don't need spaces before them
      const isDelimiter = /^[\(\)\{\}\[\];,]$/.test(suggestionText);
      const endsWithOpOrDelim = /^[+\-*/=<>!&|\(\{\[,;]$/.test(trimmed.slice(-1));
      
      const needsLeadingSpace = trimmed.length > 0 && !isDelimiter && !endsWithOpOrDelim;
      const leadingSpace = needsLeadingSpace ? " " : "";
      
      // Auto-insert trailing space for keywords/operators to keep typing flow
      const isWord = /^[a-zA-Z0-9_]+$/.test(suggestionText);
      const isOperator = /^[+\-*/=<>!&|]+$/.test(suggestionText);
      const trailingSpace = (isWord || isOperator) ? " " : "";
      
      return trimmed + leadingSpace + suggestionText + trailingSpace;
    });
  }, []);

  const handleLoadSample = (sampleCode) => {
    setCode(sampleCode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06070a] text-slate-100 selection:bg-brand-purple/30 selection:text-white">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-[120px] pointer-events-none translate-y-1/2"></div>

      {/* Header Banner */}
      <header className="relative border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-brand-purple to-brand-cyan rounded-xl shadow-lg glow-purple">
              <Cpu className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-cyan bg-clip-text text-transparent flex items-center gap-2">
                CFG Autocomplete Engine
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 text-brand-purple animate-pulse">
                  Earley O(n³)
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Predictive code completion engine built on formal Context-Free Grammar derivation
              </p>
            </div>
          </div>
          
          {/* Validation Badge */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400">Syntax Status:</span>
            {parseResult.success ? (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Parser Success</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incomplete / Invalid</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* LEFT SECTION (Editor + Token Prediction Dashboard) - Col Span 7 */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Quick Sample Snippet Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2 md:space-y-0">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-brand-cyan" />
              Load Grammar Test Case:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLES.map((sample, idx) => (
                <button
                  key={`sample-${idx}`}
                  onClick={() => handleLoadSample(sample.code)}
                  className="px-2.5 py-1 text-xs rounded border border-white/5 bg-[#0d1117] text-slate-400 hover:text-white hover:bg-brand-purple/20 hover:border-brand-purple/30 transition-all cursor-pointer"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          {/* CodeMirror CFG Editor */}
          <div className="flex-1 min-h-[400px]">
            <Editor 
              value={code} 
              onChange={setCode} 
              grammar={grammar} 
              onParseUpdate={handleParseUpdate}
            />
          </div>

          {/* CFG Predictions and Suggestions panel */}
          <div className="h-fit">
            <Suggestions
              tokens={parseResult.tokens}
              sets={parseResult.sets}
              grammar={grammar}
              onInsert={handleInsertSuggestion}
              parseError={parseResult.error}
            />
          </div>
        </section>

        {/* RIGHT SECTION (Visualizer, Grammar Editor, CS Guide) - Col Span 5 */}
        <section className="lg:col-span-5 flex flex-col h-full space-y-4">
          
          {/* Section Tab bar */}
          <div className="flex p-1 bg-black/40 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tree'
                  ? 'bg-brand-cyan/15 border border-brand-cyan/25 text-brand-cyan font-bold shadow-inner'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Parse Tree</span>
            </button>
            <button
              onClick={() => setActiveTab('grammar')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'grammar'
                  ? 'bg-brand-purple/15 border border-brand-purple/25 text-brand-purple font-bold shadow-inner'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CFG Rules</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-brand-cyan/15 border border-brand-cyan/25 text-brand-cyan font-bold shadow-inner'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Theory Guide</span>
            </button>
          </div>

          {/* Dynamic Panel Content Container */}
          <div className="flex-1 min-h-[450px]">
            {activeTab === 'tree' && (
              <ParseTree tree={parseResult.parseTree} />
            )}
            {activeTab === 'grammar' && (
              <GrammarEditor 
                grammarString={grammarString} 
                onGrammarUpdate={handleGrammarUpdate} 
              />
            )}
            {activeTab === 'guide' && (
              <AcademicGuide />
            )}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#090a0f] py-4 text-center text-xs text-slate-500 relative z-10">
        <p className="max-w-7xl mx-auto px-6">
          Theory of Computation Project — Context-Free Grammar autocompletion using Earley Chart Parsing. Supported on standard React 18+ and CodeMirror 6.
        </p>
      </footer>
    </div>
  );
}
