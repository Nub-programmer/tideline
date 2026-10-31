import React from 'react';
import { X, BookOpen, Sparkles } from 'lucide-react';

interface ExplainDrawerProps {
  topic: string | null;
  onClose: () => void;
}

export const ExplainDrawer: React.FC<ExplainDrawerProps> = ({ topic, onClose }) => {
  if (!topic) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-white h-full p-8 shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E4E8E3]">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#326B58]" />
              <h2 className="text-base font-bold text-[#18221F]">Intelligence Explainer</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F0F2EF] flex items-center justify-center hover:bg-[#E4E8E3] transition-colors"
            >
              <X className="w-4 h-4 text-[#18221F]" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono uppercase text-[#326B58]">Topic Context</span>
              <h3 className="text-xl font-bold text-[#18221F] mt-1 capitalize">{topic.replace('-', ' ')}</h3>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-2">
              <h4 className="text-xs font-semibold text-[#18221F] uppercase font-mono">Simple Explanation</h4>
              <p className="text-xs text-[#68736E] leading-relaxed">
                TIDELINE analyzes the physical urban layout as an interconnected network graph. When flood waters rise, certain nodes and road segments become impassable, forcing automated recalculation of evacuation paths and relief distribution.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F2EF] border border-[#E4E8E3] space-y-2">
              <h4 className="text-xs font-semibold text-[#18221F] uppercase font-mono">Technical Architecture</h4>
              <p className="text-xs text-[#68736E] leading-relaxed">
                Built with deterministic graph algorithms (Dijkstra, A*, Connected Components) operating on vector GIS spatial datasets. Ensures 100% reproducible disaster simulation outputs for high-stakes municipal coordination.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] transition-all mt-6"
        >
          Close Explainer
        </button>
      </div>
    </div>
  );
};
