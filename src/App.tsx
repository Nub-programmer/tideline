import React, { useState, useMemo } from 'react';
import { ViewMode, ScenarioId } from './types';
import { createInitialSimulationState } from './engine/simulationEngine';
import { Navbar } from './components/navigation/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { OverviewPage } from './pages/OverviewPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { SimulationsPage } from './pages/SimulationsPage';
import { InfrastructurePage } from './pages/InfrastructurePage';
import { EvacuationPage } from './pages/EvacuationPage';
import { ReliefPage } from './pages/ReliefPage';
import { ExplainerPage } from './pages/ExplainerPage';
import { ResearchPage } from './pages/ResearchPage';
import { PresentationMode } from './components/presentation/PresentationMode';
import { ExplainDrawer } from './components/explainer/ExplainDrawer';
import { AskTidelineModal } from './components/assistant/AskTidelineModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [currentScenario, setCurrentScenario] = useState<ScenarioId>('moderate-flood');
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [explainTopic, setExplainTopic] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const simState = useMemo(() => {
    return createInitialSimulationState(currentScenario);
  }, [currentScenario]);

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#18221F] font-sans selection:bg-[#326B58] selection:text-white">
      {currentView !== 'landing' && !isPresentationMode && (
        <Navbar
          currentView={currentView}
          onSelectView={setCurrentView}
          currentScenario={currentScenario}
          onSelectScenario={setCurrentScenario}
          onStartPresentation={() => setIsPresentationMode(true)}
          onOpenAssistant={() => setIsAssistantOpen(true)}
        />
      )}

      <main>
        {currentView === 'landing' && (
          <LandingPage
            onSelectView={setCurrentView}
            onStartPresentation={() => setIsPresentationMode(true)}
            onSelectScenario={setCurrentScenario}
          />
        )}
        {currentView === 'overview' && (
          <OverviewPage
            simState={simState}
            onSelectView={setCurrentView}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'digital-twin' && (
          <DigitalTwinPage
            simState={simState}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'simulations' && (
          <SimulationsPage
            currentScenario={currentScenario}
            onSelectScenario={setCurrentScenario}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'infrastructure' && (
          <InfrastructurePage
            simState={simState}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'evacuation' && (
          <EvacuationPage
            simState={simState}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'relief' && (
          <ReliefPage
            simState={simState}
            onOpenExplain={setExplainTopic}
          />
        )}
        {currentView === 'explainer' && (
          <ExplainerPage
            onOpenAssistant={() => setIsAssistantOpen(true)}
          />
        )}
        {currentView === 'research' && (
          <ResearchPage />
        )}
      </main>

      {isPresentationMode && (
        <PresentationMode onClose={() => setIsPresentationMode(false)} />
      )}

      <ExplainDrawer
        topic={explainTopic}
        onClose={() => setExplainTopic(null)}
      />

      <AskTidelineModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
