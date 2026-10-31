export type ViewMode = 'landing' | 'overview' | 'digital-twin' | 'simulations' | 'infrastructure' | 'evacuation' | 'relief' | 'explainer' | 'research';

export type ScenarioId = 'moderate-flood' | 'severe-overflow' | 'infrastructure-disruption';

export interface CityNode {
  id: string;
  name: string;
  type: 'intersection' | 'hospital' | 'shelter' | 'power' | 'bridge' | 'residential' | 'commercial';
  x: number; // grid coordinate 0-100
  y: number;
  elevation: number; // meters above river level
  population?: number;
  capacity?: number;
  currentDemand?: number;
  status: 'normal' | 'at-risk' | 'flooded' | 'isolated' | 'critical';
}

export interface CityEdge {
  id: string;
  source: string;
  target: string;
  name: string;
  lengthKm: number;
  isBridge: boolean;
  status: 'open' | 'congested' | 'flooded' | 'closed';
  floodDepthMeters: number;
  capacity: number;
}

export interface ShelterData {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  assignedLoad: number;
  status: 'optimal' | 'nearing-capacity' | 'full' | 'inaccessible';
}

export interface FloodScenario {
  id: ScenarioId;
  name: string;
  description: string;
  rainfallMmHr: number;
  riverLevelMeters: number;
  durationHours: number;
  affectedAreaSqKm: number;
  affectedPopulation: number;
  isolatedNeighbourhoodsCount: number;
  activeRoadClosures: number;
  criticalFacilitiesAtRisk: number;
}

export interface TimelineStep {
  hour: number;
  title: string;
  description: string;
  waterLevel: number;
  activeClosures: number;
  isolatedZones: number;
}

export interface ExplainContent {
  title: string;
  tagline: string;
  problem: string;
  howItWorks: string;
  dataUsed: string;
  algorithm: string;
  whyItMatters: string;
  example: string;
  technicalDetails: string;
}
