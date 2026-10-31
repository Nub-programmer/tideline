import React, { useState } from 'react';
import { SimulationState } from '../engine/simulationEngine';
import { Cpu, ShieldAlert, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

interface InfrastructurePageProps {
  simState: SimulationState;
  onOpenExplain: (topic: string) => void;
}

export const InfrastructurePage: React.FC<InfrastructurePageProps> = ({
  simState,
  onOpenExplain
}) => {
  const [targetEdge, setTargetEdge] = useState('e3'); // Riverside Viaduct bridge

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Cascade Intelligence</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Infrastructure Dependency & Failure Analysis</h1>
        </div>
        <button
          onClick={() => onOpenExplain('cascade-graph')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
        >
          Explain Cascade calculation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: What Breaks Next Simulation */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#BF5C55]"></span>
            <h2 className="text-base font-semibold text-[#18221F]">What Breaks Next? (Failure Simulator)</h2>
          </div>
          <p className="text-xs text-[#68736E]">
            Simulate the severance of any critical bridge or trunk road to analyze secondary cascading disconnections across the urban grid.
          </p>

          <div className="space-y-3">
            {simState.edges.map(edge => (
              <div
                key={edge.id}
                onClick={() => setTargetEdge(edge.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  targetEdge === edge.id
                    ? 'bg-[#F0F2EF] border-[#326B58]'
                    : 'bg-[#F7F8F6] border-[#E4E8E3] hover:border-[#326B58]'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold text-[#18221F]">{edge.name}</div>
                  <div className="text-xs text-[#68736E]">Length: {edge.lengthKm}km • Bridge: {edge.isBridge ? 'Yes' : 'No'}</div>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded uppercase font-semibold ${
                  edge.status === 'closed' ? 'bg-red-50 text-[#BF5C55]' : 'bg-green-50 text-[#56836A]'
                }`}>
                  {edge.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Cascade Impact Assessment */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <h2 className="text-base font-semibold text-[#18221F]">Cascade Consequence Report</h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-2">
              <span className="text-xs text-[#68736E] uppercase font-mono">Primary Asset Targeted</span>
              <div className="text-lg font-bold text-[#18221F]">
                {simState.edges.find(e => e.id === targetEdge)?.name || 'Riverside Viaduct'}
              </div>
              <p className="text-xs text-[#68736E]">
                Critical arterial connecting central commerce to eastern residential sectors across the northern river basin.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Newly Isolated Districts</span>
                <div className="text-2xl font-bold text-[#BF5C55] mt-1">2 Districts</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Rerouting Cost</span>
                <div className="text-2xl font-bold text-[#18221F] mt-1">+4.8 km</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F0F2EF] border border-[#E4E8E3] space-y-2">
              <div className="text-xs font-semibold text-[#18221F]">Network Graph Algorithm Output</div>
              <p className="text-xs text-[#68736E] leading-relaxed">
                NetworkX betweenness centrality recalculation indicates severe bottlenecking on Southern Meridian Blvd. Recommending immediate activation of emergency ferry corridors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
