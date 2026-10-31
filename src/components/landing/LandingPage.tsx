import React from 'react';
import { ViewMode, ScenarioId } from '../../types';
import { ImmersiveScrollExperience } from './ImmersiveScrollExperience';

interface LandingPageProps {
  onSelectView: (view: ViewMode) => void;
  onStartPresentation: () => void;
  onSelectScenario: (scenario: ScenarioId) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectView,
  onStartPresentation,
  onSelectScenario
}) => {
  return (
    <ImmersiveScrollExperience
      onSelectView={onSelectView}
      onStartPresentation={onStartPresentation}
      onSelectScenario={onSelectScenario}
    />
  );
};
