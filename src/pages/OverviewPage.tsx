import React from 'react';
import { SimulationState } from '../engine/simulationEngine';
import { ViewMode } from '../types';
import { Activity, ShieldAlert, Users, Navigation, ArrowUpRight, Cpu, Layers, CheckCircle2 } from 'lucide-react';

interface OverviewPageProps {
  simState: SimulationState;
  onSelectView: (view: ViewMode) => void;
  onOpenExplain: (topic: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  simState,
  onSelectView,
  onOpenExplain
}) => {
  const { metrics, nodes, edges, shelters } = simState;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BF5C55]"></span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Command Centre Active</span>
          </div>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Urban Flood Intelligence Overview</h1>
          <p className="text-sm text-[#68736E] mt-1">
            Scenario: <span className="font-semibold text-[#18221F]">{simState.scenarioId.toUpperCase()}</span> | River Level: {simState.riverLevel}m
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenExplain('overview-command')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
          >
            Explain this screen
          </button>
          <button
            onClick={() => onSelectView('digital-twin')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] transition-colors"
          >
            <span>Open Digital Twin</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#68736E]">
            <span className="text-xs font-mono uppercase">Affected Population</span>
            <Users className="w-4 h-4 text-[#BF5C55]" />
          </div>
          <div className="text-3xl font-bold text-[#18221F]">
            {metrics.affectedPopulation.toLocaleString()}
          </div>
          <p className="text-xs text-[#68736E]">Estimated within inundation zones</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#68736E]">
            <span className="text-xs font-mono uppercase">Road Closures</span>
            <ShieldAlert className="w-4 h-4 text-[#D49A4B]" />
          </div>
          <div className="text-3xl font-bold text-[#18221F]">
            {metrics.activeRoadClosures} <span className="text-xs font-normal text-[#68736E]">segments</span>
          </div>
          <p className="text-xs text-[#68736E]">Bridges & arterials blocked</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#68736E]">
            <span className="text-xs font-mono uppercase">Isolated Zones</span>
            <Navigation className="w-4 h-4 text-[#BF5C55]" />
          </div>
          <div className="text-3xl font-bold text-[#18221F]">
            {metrics.isolatedNeighbourhoods} <span className="text-xs font-normal text-[#68736E]">districts</span>
          </div>
          <p className="text-xs text-[#68736E]">Severed from primary grid</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#68736E]">
            <span className="text-xs font-mono uppercase">Hospital Access</span>
            <Activity className="w-4 h-4 text-[#326B58]" />
          </div>
          <div className="text-3xl font-bold text-[#18221F]">
            {metrics.hospitalAccessibility}%
          </div>
          <p className="text-xs text-[#68736E]">Operational medical corridors</p>
        </div>
      </div>

      {/* Two Column Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Critical Infrastructure Status */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#18221F]">Critical Infrastructure Status</h2>
            <button 
              onClick={() => onSelectView('infrastructure')}
              className="text-xs font-medium text-[#326B58] hover:underline"
            >
              View Cascade Graph →
            </button>
          </div>

          <div className="space-y-3">
            {nodes.slice(0, 5).map(node => (
              <div key={node.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    node.status === 'flooded' ? 'bg-[#BF5C55]' : node.status === 'at-risk' ? 'bg-[#D49A4B]' : 'bg-[#56836A]'
                  }`} />
                  <div>
                    <div className="text-sm font-semibold text-[#18221F]">{node.name}</div>
                    <div className="text-xs text-[#68736E] capitalize">{node.type} • Elevation: {node.elevation}m</div>
                  </div>
                </div>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-md uppercase font-semibold ${
                  node.status === 'flooded' ? 'bg-red-50 text-[#BF5C55]' : node.status === 'at-risk' ? 'bg-amber-50 text-[#D49A4B]' : 'bg-green-50 text-[#56836A]'
                }`}>
                  {node.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Shelter Status & ReliefNet */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#18221F]">Evacuation Shelters</h2>
            <button 
              onClick={() => onSelectView('relief')}
              className="text-xs font-medium text-[#326B58] hover:underline"
            >
              ReliefNet →
            </button>
          </div>

          <div className="space-y-4">
            {shelters.map(shelter => {
              const pct = Math.round((shelter.assignedLoad / shelter.capacity) * 100);
              return (
                <div key={shelter.id} className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#18221F]">{shelter.name}</span>
                    <span className="text-xs font-mono text-[#68736E]">{shelter.assignedLoad} / {shelter.capacity} assigned</span>
                  </div>
                  <div className="w-full bg-[#E4E8E3] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pct > 90 ? 'bg-[#BF5C55]' : pct > 75 ? 'bg-[#D49A4B]' : 'bg-[#326B58]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#68736E]">
                    <span>Utilization: {pct}%</span>
                    <span className="capitalize text-[#326B58] font-medium">{shelter.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
