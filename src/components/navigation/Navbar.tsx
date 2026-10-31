import React from 'react';
import { ViewMode, ScenarioId } from '../../types';
import { Layers, Activity, Map, Cpu, Navigation as NavIcon, Users, BookOpen, FileText, Play, Sliders, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  currentScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  onStartPresentation: () => void;
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  currentScenario,
  onSelectScenario,
  onStartPresentation,
  onOpenAssistant
}) => {
  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'landing', label: 'Home', icon: <Layers className="w-4 h-4" /> },
    { id: 'overview', label: 'Command Centre', icon: <Activity className="w-4 h-4" /> },
    { id: 'digital-twin', label: 'Digital Twin', icon: <Map className="w-4 h-4" /> },
    { id: 'simulations', label: 'Simulations', icon: <Sliders className="w-4 h-4" /> },
    { id: 'infrastructure', label: 'Cascade', icon: <Cpu className="w-4 h-4" /> },
    { id: 'evacuation', label: 'Pathfinder', icon: <NavIcon className="w-4 h-4" /> },
    { id: 'relief', label: 'ReliefNet', icon: <Users className="w-4 h-4" /> },
    { id: 'explainer', label: 'Intelligence Explainer', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'research', label: 'Research', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E4E8E3] px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onSelectView('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#326B58] flex items-center justify-center text-white font-bold shadow-sm group-hover:bg-[#285545] transition-colors">
            T
          </div>
          <div>
            <span className="font-semibold text-lg text-[#18221F] tracking-tight">TIDELINE</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 rounded bg-[#F0F2EF] text-[#68736E]">
              v2.4
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F7F8F6] p-1 rounded-xl border border-[#E4E8E3]">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-[#18221F] shadow-xs font-semibold'
                    : 'text-[#68736E] hover:text-[#18221F] hover:bg-white/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Scenario Selector */}
          <select
            value={currentScenario}
            onChange={(e) => onSelectScenario(e.target.value as ScenarioId)}
            className="hidden sm:block text-xs font-medium bg-[#F7F8F6] border border-[#E4E8E3] rounded-lg px-3 py-2 text-[#18221F] focus:outline-none focus:border-[#326B58]"
          >
            <option value="moderate-flood">Scenario: Moderate Flood</option>
            <option value="severe-overflow">Scenario: Severe River Overflow</option>
            <option value="infrastructure-disruption">Scenario: Bridge Collapse</option>
          </select>

          {/* Ask TIDELINE button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#326B58]" />
            <span className="hidden md:inline">Ask TIDELINE</span>
          </button>

          {/* Pitch Mode Button */}
          <button
            onClick={onStartPresentation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Pitch Presentation</span>
          </button>
        </div>
      </div>
    </header>
  );
};
