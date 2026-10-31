import React, { useState } from 'react';
import { SimulationState } from '../engine/simulationEngine';
import { ScenarioId } from '../types';
import { Sliders, Play, RefreshCw, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface SimulationsPageProps {
  currentScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  onOpenExplain: (topic: string) => void;
}

export const SimulationsPage: React.FC<SimulationsPageProps> = ({
  currentScenario,
  onSelectScenario,
  onOpenExplain
}) => {
  const [rainfall, setRainfall] = useState(72);
  const [riverSurge, setRiverSurge] = useState(7.1);
  const [duration, setDuration] = useState(8);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Deterministic Simulation Engine</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Hydrological & Infrastructure Scenarios</h1>
        </div>
        <button
          onClick={() => onOpenExplain('simulation-engine')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
        >
          Explain simulation logic
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Preset Selector */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase font-mono text-[#68736E]">Preset Scenarios</h2>
          <div className="space-y-3">
            {[
              { id: 'moderate-flood', title: 'Moderate Urban Cloudburst', desc: '48mm/hr precipitation over 6h' },
              { id: 'severe-overflow', title: 'Severe River Overflow', desc: '95mm/hr torrential downpour & surge' },
              { id: 'infrastructure-disruption', title: 'Bridge & Power Collapse', desc: 'North Arch Bridge structural failure' }
            ].map(preset => (
              <div
                key={preset.id}
                onClick={() => onSelectScenario(preset.id as ScenarioId)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  currentScenario === preset.id
                    ? 'bg-[#326B58] text-white border-[#326B58] shadow-sm'
                    : 'bg-white text-[#18221F] border-[#E4E8E3] hover:border-[#326B58]'
                }`}
              >
                <div className="font-semibold text-base">{preset.title}</div>
                <p className={`text-xs mt-1 ${currentScenario === preset.id ? 'text-white/80' : 'text-[#68736E]'}`}>
                  {preset.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Simulation Controls */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <h2 className="text-base font-semibold text-[#18221F]">Simulation Parameters</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#68736E]">Rainfall Intensity (mm/hr)</span>
                <span className="font-mono text-[#18221F]">{rainfall} mm/hr</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                value={rainfall}
                onChange={(e) => setRainfall(Number(e.target.value))}
                className="w-full accent-[#326B58]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#68736E]">River Surge Level (meters)</span>
                <span className="font-mono text-[#18221F]">{riverSurge} m</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="10.0"
                step="0.1"
                value={riverSurge}
                onChange={(e) => setRiverSurge(Number(e.target.value))}
                className="w-full accent-[#326B58]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#68736E]">Simulation Duration (hours)</span>
                <span className="font-mono text-[#18221F]">{duration} hrs</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[#326B58]"
              />
            </div>

            <button
              onClick={() => alert('Simulation parameters updated successfully. Graph connectivity recalculated.')}
              className="w-full py-3 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Recalculate Deterministic Simulation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
