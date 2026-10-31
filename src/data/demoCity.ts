import { CityNode, CityEdge, ShelterData, FloodScenario, TimelineStep } from '../types';

export const INITIAL_SCENARIOS: Record<string, FloodScenario> = {
  'moderate-flood': {
    id: 'moderate-flood',
    name: 'Moderate Urban Cloudburst',
    description: 'Continuous 48mm/hr rainfall over 6 hours causing localized street flooding and minor stormwater backup in low-lying eastern districts.',
    rainfallMmHr: 48,
    riverLevelMeters: 4.2,
    durationHours: 6,
    affectedAreaSqKm: 18.5,
    affectedPopulation: 24500,
    isolatedNeighbourhoodsCount: 2,
    activeRoadClosures: 4,
    criticalFacilitiesAtRisk: 1
  },
  'severe-overflow': {
    id: 'severe-overflow',
    name: 'Severe River Overflow & Storm Surge',
    description: 'Upstream reservoir spill combined with 95mm/hr torrential downpour causing major river breach and widespread inundation across central bridges.',
    rainfallMmHr: 95,
    riverLevelMeters: 8.7,
    durationHours: 12,
    affectedAreaSqKm: 52.0,
    affectedPopulation: 89000,
    isolatedNeighbourhoodsCount: 6,
    activeRoadClosures: 14,
    criticalFacilitiesAtRisk: 4
  },
  'infrastructure-disruption': {
    id: 'infrastructure-disruption',
    name: 'Critical Bridge & Power Grid Failure',
    description: 'Sudden structural collapse of the North Arch Bridge during peak river surge isolating the northern medical sector and severing primary trunk routes.',
    rainfallMmHr: 72,
    riverLevelMeters: 7.1,
    durationHours: 8,
    affectedAreaSqKm: 34.0,
    affectedPopulation: 58000,
    isolatedNeighbourhoodsCount: 5,
    activeRoadClosures: 9,
    criticalFacilitiesAtRisk: 3
  }
};

export const DEMO_NODES: CityNode[] = [
  { id: 'n1', name: 'Metro Central Station', type: 'commercial', x: 50, y: 50, elevation: 6.5, population: 15000, status: 'normal' },
  { id: 'n2', name: 'St. Jude General Hospital', type: 'hospital', x: 30, y: 40, elevation: 8.0, population: 4500, status: 'normal' },
  { id: 'n3', name: 'North Arch Bridge Node', type: 'bridge', x: 50, y: 25, elevation: 4.0, population: 8200, status: 'at-risk' },
  { id: 'n4', name: 'Eastside Residential District', type: 'residential', x: 75, y: 45, elevation: 3.2, population: 18000, status: 'at-risk' },
  { id: 'n5', name: 'Southport Civic Shelter', type: 'shelter', x: 45, y: 80, elevation: 9.5, population: 12000, capacity: 5000, status: 'normal' },
  { id: 'n6', name: 'West End Substation', type: 'power', x: 20, y: 70, elevation: 5.0, population: 6000, status: 'normal' },
  { id: 'n7', name: 'Riverside Industrial Zone', type: 'commercial', x: 65, y: 30, elevation: 2.8, population: 11000, status: 'flooded' },
  { id: 'n8', name: 'Harbor View Apartments', type: 'residential', x: 80, y: 20, elevation: 3.0, population: 9500, status: 'flooded' },
  { id: 'n9', name: 'University Science Park', type: 'commercial', x: 35, y: 20, elevation: 7.2, population: 14000, status: 'normal' },
  { id: 'n10', name: 'Pine Hill Community Shelter', type: 'shelter', x: 25, y: 90, elevation: 11.0, population: 8000, capacity: 4000, status: 'normal' }
];

export const DEMO_EDGES: CityEdge[] = [
  { id: 'e1', source: 'n1', target: 'n3', name: 'Grand Avenue North', lengthKm: 2.4, isBridge: true, status: 'congested', floodDepthMeters: 0.2, capacity: 4000 },
  { id: 'e2', source: 'n1', target: 'n2', name: 'Hospital Expressway', lengthKm: 1.8, isBridge: false, status: 'open', floodDepthMeters: 0.0, capacity: 6000 },
  { id: 'e3', source: 'n3', target: 'n4', name: 'Riverside Viaduct', lengthKm: 3.1, isBridge: true, status: 'flooded', floodDepthMeters: 1.4, capacity: 2500 },
  { id: 'e4', source: 'n1', target: 'n5', name: 'Southern Meridian Blvd', lengthKm: 3.5, isBridge: false, status: 'open', floodDepthMeters: 0.0, capacity: 8000 },
  { id: 'e5', source: 'n2', target: 'n6', name: 'West Link Road', lengthKm: 2.2, isBridge: false, status: 'open', floodDepthMeters: 0.1, capacity: 3500 },
  { id: 'e6', source: 'n3', target: 'n7', name: 'Industrial Pier Way', lengthKm: 1.9, isBridge: false, status: 'closed', floodDepthMeters: 2.1, capacity: 2000 },
  { id: 'e7', source: 'n7', target: 'n8', name: 'Harbor Parkway', lengthKm: 2.0, isBridge: false, status: 'closed', floodDepthMeters: 2.6, capacity: 2000 },
  { id: 'e8', source: 'n1', target: 'n7', name: 'Central Wharf Road', lengthKm: 2.8, isBridge: false, status: 'flooded', floodDepthMeters: 0.9, capacity: 4500 },
  { id: 'e9', source: 'n9', target: 'n3', name: 'University Bridge Link', lengthKm: 1.5, isBridge: true, status: 'congested', floodDepthMeters: 0.4, capacity: 3000 },
  { id: 'e10', source: 'n5', target: 'n10', name: 'Pine Hill Connector', lengthKm: 4.2, isBridge: false, status: 'open', floodDepthMeters: 0.0, capacity: 5000 }
];

export const DEMO_SHELTERS: ShelterData[] = [
  { id: 's1', name: 'Southport Civic Shelter', x: 45, y: 80, capacity: 5000, assignedLoad: 3800, status: 'optimal' },
  { id: 's2', name: 'Pine Hill Community Shelter', x: 25, y: 90, capacity: 4000, assignedLoad: 3950, status: 'nearing-capacity' },
  { id: 's3', name: 'University Arena Evacuation Hub', x: 35, y: 20, capacity: 7500, assignedLoad: 6800, status: 'nearing-capacity' }
];

export const DEMO_TIMELINE: TimelineStep[] = [
  { hour: 0, title: 'Cloudburst Commences', description: 'Intense precipitation recorded across northern river basin. Weather radar registers 50mm/hr sustained cell.', waterLevel: 3.1, activeClosures: 0, isolatedZones: 0 },
  { hour: 2, title: 'Stormwater Drainage Saturation', description: 'Low-lying eastern commercial districts experience drainage surcharging. Road flood depths reach 0.4m.', waterLevel: 4.8, activeClosures: 2, isolatedZones: 1 },
  { hour: 4, title: 'River Level Exceeds Warning Threshold', description: 'North Arch Bridge approach submerged. Traffic police initiate preemptive diversion protocols.', waterLevel: 6.5, activeClosures: 5, isolatedZones: 2 },
  { hour: 6, title: 'Critical Inundation & Bridge Disruption', description: 'Industrial pier road closed due to 2.1m flood surge. Harbor View apartments isolated from emergency services.', waterLevel: 7.9, activeClosures: 9, isolatedZones: 4 },
  { hour: 8, title: 'Peak Flood Crest & Relief Deployment', description: 'ReliefNet optimization routine executed. Emergency convoys rerouted via Southern Meridian and Pine Hill corridors.', waterLevel: 8.7, activeClosures: 11, isolatedZones: 6 }
];
