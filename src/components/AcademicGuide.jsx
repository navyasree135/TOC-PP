import React from 'react';
import { BookOpen, HelpCircle, Zap, Cpu, Award } from 'lucide-react';

export default function AcademicGuide() {
  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="flex items-center space-x-2 px-4 py-3 border-b border-white/10 bg-white/5">
        <BookOpen className="w-5 h-5 text-brand-cyan" />
        <span className="font-semibold text-sm tracking-wide text-gray-200">Academic & Compiler Theory Guide</span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm leading-relaxed text-gray-300">
        
        {/* Core Question 1 */}
        <section className="space-y-2">
          <h3 className="flex items-center space-x-2 font-bold text-gray-100 text-base">
            <HelpCircle className="w-4 h-4 text-brand-cyan" />
            <span>1. Why CFG over Regular Expressions (Regex)?</span>
          </h3>
          <p>
            Regular Expressions are matched by <strong>Finite State Automata (FSA)</strong>, which have a fixed, finite amount of memory (represented by state counts). According to the <em>Pumping Lemma for Regular Languages</em>, regex is incapable of matching nested structures of arbitrary depth.
          </p>
          <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/15 rounded-lg font-mono text-xs text-gray-400 space-y-1">
            <span className="text-gray-300 font-semibold block mb-1">Theoretical Limit Case: Balanced Brackets</span>
            <span>Regex: Cannot match rules like S → ( S ) or S → { S }</span>
            <span>Reason: Matching requires a stack to "remember" how many opening brackets were opened.</span>
          </div>
          <p>
            <strong>Context-Free Grammars (CFGs)</strong> use <strong>Pushdown Automata (PDA)</strong> which incorporate a stack. This allows infinite recursion and nesting, mapping perfectly to nested arithmetic operations, blocks, function arguments, and structured statements.
          </p>
        </section>

        <hr className="border-white/10" />

        {/* Core Question 2 */}
        <section className="space-y-2">
          <h3 className="flex items-center space-x-2 font-bold text-gray-100 text-base">
            <Zap className="w-4 h-4 text-brand-purple" />
            <span>2. The Earley Parser & Complexity</span>
          </h3>
          <p>
            The **Earley Parser** is a chart parser invented by Jay Earley in 1968. It works top-down and uses dynamic programming to parse inputs from left to right.
          </p>
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-center">
              <span className="text-brand-purple font-mono font-bold text-base block">O(N³)</span>
              <span className="text-[10px] text-gray-400">Worst Case (Ambiguous Grammars)</span>
            </div>
            <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-center">
              <span className="text-brand-purple font-mono font-bold text-base block">O(N²)</span>
              <span className="text-[10px] text-gray-400">Unambiguous Grammars</span>
            </div>
            <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-center">
              <span className="text-brand-cyan font-mono font-bold text-base block">O(N)</span>
              <span className="text-[10px] text-gray-400">Linear (Most PL Grammars)</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            *Where N is the number of tokens in the input text. Unlike LL/LR parsers, Earley handles all CFGs without modifications (handles left-recursion and ambiguous paths automatically).
          </p>
        </section>

        <hr className="border-white/10" />

        {/* Core Question 3 */}
        <section className="space-y-2">
          <h3 className="flex items-center space-x-2 font-bold text-gray-100 text-base">
            <Cpu className="w-4 h-4 text-brand-cyan" />
            <span>3. How Earley's "Predict" Step Enables Autocomplete</span>
          </h3>
          <p>
            Traditional parsers (like LR) are shift-reduce and shift/reduce states based on past complete structures and limited lookaheads.
            Earley parser states maintain a <strong>dot (•)</strong> representing the progress:
          </p>
          <div className="p-3 bg-[#0d1117] rounded-lg font-mono text-xs space-y-1.5 text-gray-400 border border-white/5">
            <div><span className="text-brand-purple">Active State:</span> stmt → if ( • expr ) {'{'} S {'}'}</div>
            <div><span className="text-brand-cyan">Prediction Step:</span> Dot is before <span className="text-gray-200">expr</span>. Parser reads productions of <span className="text-gray-200">expr</span> and adds them to current state set:</div>
            <div className="pl-4">expr → • ID</div>
            <div className="pl-4">expr → • NUMBER</div>
            <div>Since dot is before terminals <span className="text-brand-cyan">ID</span> & <span className="text-brand-cyan">NUMBER</span>, these are the legally expected tokens!</div>
          </div>
          <p>
            Because we parse from left to right, when the parser stops at the cursor, the state set represents the exact parsing frontier. Any token expected immediately after the dot (•) is a correct next token.
          </p>
        </section>

        <hr className="border-white/10" />

        {/* Core Question 4 */}
        <section className="space-y-3">
          <h3 className="flex items-center space-x-2 font-bold text-gray-100 text-base">
            <Award className="w-4 h-4 text-brand-purple" />
            <span>4. Parser Comparison Chart</span>
          </h3>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-white/5 border-b border-white/10 font-semibold text-gray-200">
                <tr>
                  <th className="p-2 border-r border-white/10">Metric</th>
                  <th className="p-2 border-r border-white/10">Earley (This Engine)</th>
                  <th className="p-2 border-r border-white/10">LL(k) Parsers</th>
                  <th className="p-2">LR(k) / LALR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                <tr>
                  <td className="p-2 font-semibold border-r border-white/10 text-gray-200">Grammar Class</td>
                  <td className="p-2 border-r border-white/10 text-brand-cyan">Any CFG (Even ambiguous)</td>
                  <td className="p-2 border-r border-white/10">Strict subsets (No left recursion)</td>
                  <td className="p-2">Large subset (No ambiguity)</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold border-r border-white/10 text-gray-200">Parsing Direction</td>
                  <td className="p-2 border-r border-white/10">Left-to-Right, Top-down</td>
                  <td className="p-2 border-r border-white/10">Left-to-Right, Top-down</td>
                  <td className="p-2">Left-to-Right, Bottom-up</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold border-r border-white/10 text-gray-200">Autocomplete Fit</td>
                  <td className="p-2 border-r border-white/10 text-emerald-400">Excellent (works on partial inputs)</td>
                  <td className="p-2 border-r border-white/10">Difficult (stops on first mismatch)</td>
                  <td className="p-2 text-gray-400">Poor (strict shift-reduce tables)</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold border-r border-white/10 text-gray-200">Worst Complexity</td>
                  <td className="p-2 border-r border-white/10 font-mono text-brand-purple">O(N³)</td>
                  <td className="p-2 border-r border-white/10 font-mono">O(N)</td>
                  <td className="p-2 font-mono">O(N)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
