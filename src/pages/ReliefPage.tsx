import React from 'react';
import { SimulationState } from '../engine/simulationEngine';
import { Users, ShieldAlert, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface ReliefPageProps {
  simState: SimulationState;
  onOpenExplain: (topic: string) => void;
}

export const ReliefPage: React.FC<ReliefPageProps> = ({
  simState,
  onOpenExplain
}) => {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">ReliefNet Optimization</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Emergency Resource & Shelter Allocation</h1>
        </div>
        <button
          onClick={() => onOpenExplain('reliefnet-allocation')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
        >
          Explain Min-Cost Flow Algorithm
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Shelter Allocation Breakdown */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <h2 className="text-base font-semibold text-[#18221F]">Shelter Capacity & Assigned Demand</h2>

          <div className="space-y-4">
            {simState.shelters.map(shelter => {
              const pct = Math.round((shelter.assignedLoad / shelter.capacity) * 100);
              return (
                <div key={shelter.id} className="p-5 rounded-2xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#18221F]">{shelter.name}</h3>
                      <span className="text-xs text-[#68736E]">Grid Coordinates: X:{shelter.x} Y:{shelter.y}</span>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded bg-white border border-[#E4E8E3] font-semibold text-[#326B58]">
                      {shelter.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="w-full bg-[#E4E8E3] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pct > 90 ? 'bg-[#BF5C55]' : pct > 75 ? 'bg-[#D49A4B]' : 'bg-[#326B58]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#68736E]">
                    <span>Assigned Evacuees: <strong>{shelter.assignedLoad.toLocaleString()}</strong></span>
                    <span>Capacity: <strong>{shelter.capacity.toLocaleString()}</strong> ({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Optimization Metrics */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-[#18221F]">Optimization Metrics</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Total Shelters Active</span>
                <span className="text-sm font-bold font-mono text-[#18221F]">{simState.shelters.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Unserved Evacuee Demand</span>
                <span className="text-sm font-bold font-mono text-[#326B58]">0 (100% Routed)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Average Transit Distance</span>
                <span className="text-sm font-bold font-mono text-[#18221F]">3.4 km</span>
              </div>
            </div>
          </div>

          <div className="bg-[#18221F] text-white p-6 rounded-2xl space-y-3">
            <h3 className="text-sm font-semibold">ReliefNet Dispatch Protocol</h3>
            <p className="text-xs text-[#A0AAA5] leading-relaxed">
              Min-cost flow optimization running continuously to ensure shelters do not exceed threshold capacities while minimizing travel exposure across flooded sectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
