import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, ChevronRight } from 'lucide-react';

interface ExplainerPageProps {
  onOpenAssistant: () => void;
}

export const ExplainerPage: React.FC<ExplainerPageProps> = ({ onOpenAssistant }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const glossaryItems = [
    { title: 'Digital Twin', category: 'Architecture', desc: 'A virtual representation of physical urban infrastructure synchronized with real-time hydrological simulation data.' },
    { title: 'Connected Components', category: 'Graph Theory', desc: 'Algorithms used in Cascade analysis to identify isolated urban sectors cut off from primary municipal supply routes.' },
    { title: 'Betweenness Centrality', category: 'Network Analysis', desc: 'Measures the frequency with which a road segment or bridge appears on shortest paths between urban nodes.' },
    { title: 'A* Shortest Path', category: 'Pathfinding', desc: 'Heuristic-guided graph traversal algorithm that calculates optimal evacuation routes avoiding flood depths.' },
    { title: 'Minimum-Cost Flow', category: 'Resource Optimization', desc: 'ReliefNet mathematical optimization matching population demand to shelter capacities at minimum transit cost.' },
  ];

  const filteredGlossary = glossaryItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Intelligence Explainer</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Technology, Algorithms & Methodology</h1>
        </div>
        <button
          onClick={onOpenAssistant}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask TIDELINE Assistant</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#68736E] absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search methodology, algorithms, and technical terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-[#E4E8E3] rounded-2xl text-sm text-[#18221F] focus:outline-none focus:border-[#326B58] shadow-xs"
        />
      </div>

      {/* Glossary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGlossary.map((item, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#18221F]">{item.title}</h3>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#F0F2EF] text-[#326B58] font-semibold">
                {item.category}
              </span>
            </div>
            <p className="text-xs text-[#68736E] leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
