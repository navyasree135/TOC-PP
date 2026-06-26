import React, { useMemo } from 'react';
import { GitFork, Maximize2, ZoomIn, Info } from 'lucide-react';

export default function ParseTree({ tree }) {
  // Compute the tree layout coordinates
  const layout = useMemo(() => {
    if (!tree) return null;

    let maxDepth = 0;
    const computeCoordinates = (node, depth = 0, nextX = { value: 30 }) => {
      if (!node) return null;
      if (depth > maxDepth) maxDepth = depth;

      const layoutNode = {
        id: node.id,
        name: node.name,
        value: node.value,
        isTerminal: node.isTerminal,
        start: node.start,
        end: node.end,
        depth,
        children: []
      };

      if (!node.children || node.children.length === 0) {
        // Leaf nodes are placed sequentially
        layoutNode.x = nextX.value;
        nextX.value += 90; // horizontal spacing between leaf nodes
        layoutNode.y = depth * 90 + 30; // vertical spacing
        return layoutNode;
      }

      // Layout children first (depth-first)
      layoutNode.children = node.children.map(child => 
        computeCoordinates(child, depth + 1, nextX)
      );

      // Centered above children
      const firstChildX = layoutNode.children[0].x;
      const lastChildX = layoutNode.children[layoutNode.children.length - 1].x;
      layoutNode.x = (firstChildX + lastChildX) / 2;
      layoutNode.y = depth * 90 + 30;

      return layoutNode;
    };

    const nextX = { value: 40 };
    const root = computeCoordinates(tree, 0, nextX);
    const width = nextX.value + 40;
    const height = (maxDepth + 1) * 90 + 60;

    return { root, width, height };
  }, [tree]);

  // Recursively collect paths/connectors to render
  const renderLinks = (node, links = []) => {
    if (!node || !node.children) return links;
    
    node.children.forEach(child => {
      // Beautiful curved cubic bezier paths
      const x1 = node.x;
      const y1 = node.y + 15; // start from bottom edge of node
      const x2 = child.x;
      const y2 = child.y - 15; // end at top edge of child
      const midY = (y1 + y2) / 2;
      
      const pathData = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      
      links.push(
        <path
          key={`link-${node.id}-${child.id}`}
          d={pathData}
          fill="none"
          stroke={child.isTerminal ? "url(#neon-cyan-grad)" : "url(#neon-purple-grad)"}
          strokeWidth="2"
          className="opacity-40 hover:opacity-100 transition-opacity duration-300"
        />
      );
      renderLinks(child, links);
    });
    
    return links;
  };

  // Recursively collect nodes to render
  const renderNodes = (node, elements = []) => {
    if (!node) return elements;

    const isTerm = node.isTerminal;
    const displayName = node.name;
    const displayVal = node.value !== undefined ? `"${node.value}"` : '';

    elements.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${node.x}, ${node.y})`}
        className="group cursor-help"
      >
        {/* Node backdrop for neon glow */}
        <rect
          x="-35"
          y="-15"
          width="70"
          height="30"
          rx="6"
          fill={isTerm ? "rgba(6, 182, 212, 0.05)" : "rgba(168, 85, 247, 0.05)"}
          stroke={isTerm ? "#06b6d4" : "#a855f7"}
          strokeWidth="1.5"
          className={`transition-all duration-300 group-hover:scale-110 ${
            isTerm 
              ? "group-hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] group-hover:stroke-brand-cyan" 
              : "group-hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] group-hover:stroke-brand-purple"
          }`}
          style={{
            filter: `drop-shadow(0 0 4px ${isTerm ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)'})`
          }}
        />
        {/* Label Text */}
        <text
          y={displayVal ? -2 : 4}
          textAnchor="middle"
          fill={isTerm ? "#e2e8f0" : "#ffffff"}
          className={`text-[11px] font-semibold tracking-wide select-none ${
            !isTerm && "text-brand-purple glow-text-purple"
          }`}
        >
          {displayName}
        </text>
        {/* Sub-value for Terminals */}
        {displayVal && (
          <text
            y="9"
            textAnchor="middle"
            fill="#06b6d4"
            className="text-[9px] font-mono tracking-tight glow-text-cyan select-none"
          >
            {displayVal}
          </text>
        )}
        
        {/* Hidden Tooltip on Hover */}
        <title>
          {isTerm 
            ? `Terminal Token\nSymbol: ${displayName}\nLexeme: ${node.value || 'None'}\nSpan: ${node.start}-${node.end}`
            : `Non-Terminal Rule\nName: ${displayName}\nChildren count: ${node.children ? node.children.length : 0}`
          }
        </title>
      </g>
    );

    if (node.children) {
      node.children.forEach(child => renderNodes(child, elements));
    }

    return elements;
  };

  const links = useMemo(() => (layout ? renderLinks(layout.root) : []), [layout]);
  const nodes = useMemo(() => (layout ? renderNodes(layout.root) : []), [layout]);

  return (
    <div className="flex flex-col h-full rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center space-x-2">
          <GitFork className="w-5 h-5 text-brand-cyan" />
          <span className="font-semibold text-sm tracking-wide text-gray-200">Parse Tree Visualizer</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Info className="w-3.5 h-3.5 text-brand-purple" />
          <span>Hover nodes to see grammar details</span>
        </div>
      </div>
      
      <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
        {layout ? (
          <div className="w-full h-full flex justify-center items-center">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="max-h-[380px] w-auto transition-transform duration-300"
            >
              <defs>
                {/* Gradients for connecting path colors */}
                <linearGradient id="neon-cyan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="neon-purple-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <g>{links}</g>
              <g>{nodes}</g>
            </svg>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm">
            <div className="p-4 rounded-full border border-dashed border-white/10 bg-white/5">
              <GitFork className="w-10 h-10 text-gray-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-300">No Parse Tree Generated</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                As you type valid statements in the editor, the Earley parser builds a syntax tree and displays it dynamically here.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-t border-white/10 text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border border-brand-purple bg-brand-purple/10"></span>
          <span>Non-Terminal (Rules)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm border border-brand-cyan bg-brand-cyan/10"></span>
          <span>Terminal (Tokens)</span>
        </div>
      </div>
    </div>
  );
}
