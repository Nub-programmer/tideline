import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Play, BookOpen, Mic } from 'lucide-react';

interface PresentationModeProps {
  onClose: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({ onClose }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showNotes, setShowNotes] = useState(true);

  const chapters = [
    {
      title: "01 — The Problem",
      subtitle: "A disaster doesn't disrupt one road. It disrupts an entire city.",
      notes: "When a major flood strikes, conventional emergency tools show scattered warning pins. But cities fail systemically: water submerges approach bridges, isolates residential districts, and breaks supply chains simultaneously.",
      technical: "Network vulnerability propagation and cascade failure dynamics."
    },
    {
      title: "02 — The TIDELINE Idea",
      subtitle: "When a city floods, intelligence must flow faster.",
      notes: "TIDELINE is an urban disaster intelligence platform that models cascading flood scenarios, identifies isolated neighbourhoods, calculates alternative evacuation routes, and optimises emergency resource allocation.",
      technical: "Graph theory, A* pathfinding, and min-cost flow optimization."
    },
    {
      title: "03 — The Digital Twin",
      subtitle: "Metropolitan 3D & Geospatial Inundation Mapping",
      notes: "Here we inspect the virtual city model. Buildings, rivers, bridges, and critical infrastructure layers are rendered in precise architectural detail.",
      technical: "Three.js procedural geometry and vector GIS layer rendering."
    },
    {
      title: "04 — The Disaster Scenario",
      subtitle: "Moderate Urban Cloudburst & River Surge",
      notes: "Triggering a simulated cloudburst. Water levels rise, road segments submerge, and low-lying commercial districts transition to risk states.",
      technical: "Hydrological threshold calculation over municipal elevation matrices."
    },
    {
      title: "05 — The Cascade Effect",
      subtitle: "What Breaks Next?",
      notes: "When the Riverside Viaduct bridge is severed, connected-component analysis instantly identifies newly isolated residential zones and recalculates municipal bottlenecking.",
      technical: "NetworkX connected components and betweenness centrality."
    },
    {
      title: "06 — Intelligent Evacuation",
      subtitle: "Pathfinder A* Route Optimization",
      notes: "Evacuation convoys can no longer use standard routes. Pathfinder calculates alternative paths that avoid flooded segments with minimal risk cost.",
      technical: "Heuristic-guided A* graph traversal with dynamic flood weight penalties."
    },
    {
      title: "07 — Relief Optimisation",
      subtitle: "ReliefNet Resource Allocation",
      notes: "Matching affected population demand to available shelter capacities without exceeding thresholds or routing through submerged infrastructure.",
      technical: "Min-cost flow optimization algorithm."
    },
    {
      title: "08 — The Technology",
      subtitle: "Pure Software Architecture & Reproducibility",
      notes: "Designed for high-stakes competition and emergency command centers. Fully self-contained with offline demo data and zero fragile external hardware dependencies.",
      technical: "React, TypeScript, Three.js, Express, and deterministic graph engines."
    },
  ];

  const chapter = chapters[currentChapter];

  return (
    <div className="fixed inset-0 z-50 bg-[#18221F] text-white flex flex-col justify-between p-8 sm:p-16 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#326B58] flex items-center justify-center font-bold text-sm">
            T
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-[#A0AAA5]">Guided Presentation Mode</span>
            <div className="text-sm font-semibold">{chapter.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showNotes ? 'bg-[#326B58] text-white' : 'bg-white/10 text-[#A0AAA5]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Speaker Notes</span>
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="max-w-4xl mx-auto space-y-6 text-center my-auto">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight">
          {chapter.subtitle}
        </h1>

        {showNotes && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left max-w-2xl mx-auto space-y-4 backdrop-blur-md">
            <div>
              <span className="text-xs font-mono uppercase text-[#56836A]">Speaker Script</span>
              <p className="text-sm text-[#E4E8E3] mt-1 leading-relaxed">{chapter.notes}</p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-mono uppercase text-[#A0AAA5]">Technical Talking Points</span>
              <p className="text-xs text-[#A0AAA5] mt-1">{chapter.technical}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-6 border-t border-white/10">
        <button
          onClick={() => setCurrentChapter(Math.max(0, currentChapter - 1))}
          disabled={currentChapter === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Chapter</span>
        </button>

        <span className="text-xs font-mono text-[#A0AAA5]">
          Chapter {currentChapter + 1} of {chapters.length}
        </span>

        <button
          onClick={() => {
            if (currentChapter < chapters.length - 1) {
              setCurrentChapter(currentChapter + 1);
            } else {
              onClose();
            }
          }}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-semibold bg-[#326B58] hover:bg-[#285545] transition-all"
        >
          <span>{currentChapter === chapters.length - 1 ? 'Finish Presentation' : 'Next Chapter'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
