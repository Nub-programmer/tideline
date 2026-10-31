import React, { useState } from 'react';
import { SimulationState, runPathfinderRoute } from '../engine/simulationEngine';
import { Navigation, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EvacuationPageProps {
  simState: SimulationState;
  onOpenExplain: (topic: string) => void;
}

export const EvacuationPage: React.FC<EvacuationPageProps> = ({
  simState,
  onOpenExplain
}) => {
  const [startId, setStartId] = useState('n4'); // Eastside Residential
  const [endId, setEndId] = useState('n5'); // Southport Civic Shelter

  const routeResult = runPathfinderRoute(startId, endId, simState.edges, simState.nodes);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Pathfinder Algorithm</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Adaptive Evacuation & Route Optimization</h1>
        </div>
        <button
          onClick={() => onOpenExplain('pathfinder-routing')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
        >
          Explain A* / Dijkstra Router
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Origin & Destination Selectors */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <h2 className="text-base font-semibold text-[#18221F]">Route Parameters</h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#68736E]">Origin District / Zone</label>
              <select
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] text-xs font-medium text-[#18221F]"
              >
                {simState.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#68736E]">Destination Shelter / Hospital</label>
              <select
                value={endId}
                onChange={(e) => setEndId(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] text-xs font-medium text-[#18221F]"
              >
                {simState.nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F2EF] border border-[#E4E8E3] space-y-2">
              <div className="text-xs font-semibold text-[#18221F]">Avoidance Parameters</div>
              <p className="text-xs text-[#68736E]">
                Router automatically avoids closed bridges, flooded road segments (&gt;0.5m depth), and high-congestion corridors.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Calculated Route Results */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <h2 className="text-base font-semibold text-[#18221F]">Optimized Route Output</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
              <span className="text-xs text-[#68736E]">Total Distance</span>
              <div className="text-2xl font-bold text-[#18221F] mt-1">{routeResult.distanceKm} km</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
              <span className="text-xs text-[#68736E]">Risk Cost Score</span>
              <div className="text-2xl font-bold text-[#326B58] mt-1">{routeResult.riskScore} / 10</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-2">
            <span className="text-xs text-[#68736E] uppercase font-mono">Algorithm Summary</span>
            <p className="text-xs text-[#18221F] leading-relaxed font-medium">
              {routeResult.description}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-[#68736E] uppercase font-mono">Waypoint Sequence</span>
            <div className="flex flex-wrap items-center gap-2">
              {routeResult.path.map((nodeId, idx) => {
                const node = simState.nodes.find(n => n.id === nodeId);
                return (
                  <React.Fragment key={nodeId}>
                    <span className="px-3 py-1.5 rounded-lg bg-[#F0F2EF] border border-[#E4E8E3] text-xs font-medium text-[#18221F]">
                      {node?.name || nodeId}
                    </span>
                    {idx < routeResult.path.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-[#68736E]" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
