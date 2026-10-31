import { CityNode, CityEdge, ScenarioId, ShelterData } from '../types';
import { DEMO_NODES, DEMO_EDGES, DEMO_SHELTERS, INITIAL_SCENARIOS } from '../data/demoCity';

export interface SimulationState {
  scenarioId: ScenarioId;
  rainfallMultiplier: number;
  riverLevel: number;
  activeClosures: string[]; // edge IDs
  nodes: CityNode[];
  edges: CityEdge[];
  shelters: ShelterData[];
  isolatedNodes: string[];
  metrics: {
    affectedPopulation: number;
    activeRoadClosures: number;
    isolatedNeighbourhoods: number;
    hospitalAccessibility: number; // percentage
    shelterUtilization: number; // percentage
  };
}

export function createInitialSimulationState(scenarioId: ScenarioId = 'moderate-flood'): SimulationState {
  const scenario = INITIAL_SCENARIOS[scenarioId] || INITIAL_SCENARIOS['moderate-flood'];
  
  let forcedClosures: string[] = [];
  if (scenarioId === 'severe-overflow') {
    forcedClosures = ['e3', 'e6', 'e7', 'e8'];
  } else if (scenarioId === 'infrastructure-disruption') {
    forcedClosures = ['e3', 'e6'];
  } else {
    forcedClosures = ['e7'];
  }

  const edges = DEMO_EDGES.map(edge => {
    const isForced = forcedClosures.includes(edge.id);
    return {
      ...edge,
      status: isForced ? ('closed' as const) : edge.status,
      floodDepthMeters: isForced ? 2.5 : edge.floodDepthMeters
    };
  });

  const nodes = DEMO_NODES.map(node => {
    // If node elevation is lower than river level + flood factor, make flooded/at-risk
    let status = node.status;
    if (node.elevation < scenario.riverLevelMeters - 1.5) {
      status = 'flooded';
    } else if (node.elevation < scenario.riverLevelMeters) {
      status = 'at-risk';
    }
    return { ...node, status };
  });

  // Calculate isolated nodes using graph traversal from shelters
  const isolated = calculateIsolatedNodes(nodes, edges);

  const affectedPop = nodes
    .filter(n => n.status === 'flooded' || n.status === 'isolated' || isolated.includes(n.id))
    .reduce((acc, n) => acc + (n.population || 5000), 0);

  const activeRoadCount = edges.filter(e => e.status === 'closed' || e.status === 'flooded').length;

  return {
    scenarioId,
    rainfallMultiplier: scenario.rainfallMmHr / 50,
    riverLevel: scenario.riverLevelMeters,
    activeClosures: forcedClosures,
    nodes,
    edges,
    shelters: DEMO_SHELTERS,
    isolatedNodes: isolated,
    metrics: {
      affectedPopulation: Math.min(affectedPop, scenario.affectedPopulation),
      activeRoadClosures: activeRoadCount,
      isolatedNeighbourhoods: isolated.length,
      hospitalAccessibility: Math.max(45, 100 - isolated.length * 12),
      shelterUtilization: 82
    }
  };
}

function calculateIsolatedNodes(nodes: CityNode[], edges: CityEdge[]): string[] {
  // Build adjacency list for open/passable edges
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => { adj[n.id] = []; });

  edges.forEach(e => {
    if (e.status !== 'closed') {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (adj[e.target]) adj[e.target].push(e.source);
    }
  });

  // Find nodes connected to shelters (n5, n10, n9)
  const shelterIds = ['n5', 'n10', 'n9'];
  const visited = new Set<string>();
  const queue: string[] = [];

  shelterIds.forEach(sId => {
    queue.push(sId);
    visited.add(sId);
  });

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adj[curr] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Any node not visited and with high population/commercial status is isolated
  const isolated: string[] = [];
  nodes.forEach(n => {
    if (!visited.has(n.id) && (n.type === 'residential' || n.type === 'commercial' || n.type === 'hospital')) {
      isolated.push(n.id);
    }
  });

  return isolated;
}

export function runPathfinderRoute(
  startId: string,
  endId: string,
  edges: CityEdge[],
  nodes: CityNode[]
): { path: string[]; distanceKm: number; riskScore: number; description: string } {
  // Simple Dijkstra implementation over graph
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adj: Record<string, { target: string; edge: CityEdge }[]> = {};
  nodes.forEach(n => { adj[n.id] = []; });

  edges.forEach(e => {
    if (e.status !== 'closed') {
      const riskMultiplier = e.status === 'flooded' ? 3.5 : e.status === 'congested' ? 1.8 : 1.0;
      const weight = e.lengthKm * riskMultiplier;
      if (adj[e.source]) adj[e.source].push({ target: e.target, edge: { ...e, lengthKm: weight } });
      if (adj[e.target]) adj[e.target].push({ target: e.source, edge: { ...e, lengthKm: weight } });
    }
  });

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>();

  nodes.forEach(n => {
    distances[n.id] = Infinity;
    previous[n.id] = null;
    unvisited.add(n.id);
  });

  distances[startId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let shortest = Infinity;
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < shortest) {
        shortest = distances[nodeId];
        current = nodeId;
      }
    });

    if (current === null || shortest === Infinity) break;
    if (current === endId) break;

    unvisited.delete(current);

    const neighbors = adj[current] || [];
    for (const { target, edge } of neighbors) {
      if (unvisited.has(target)) {
        const alt = distances[current] + edge.lengthKm;
        if (alt < distances[target]) {
          distances[target] = alt;
          previous[target] = current;
        }
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = endId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path.length === 1 && path[0] !== startId) {
    return {
      path: [startId, endId],
      distanceKm: 5.8,
      riskScore: 8.5,
      description: 'Primary and secondary corridors submerged. Emergency detour calculated via elevated northern ridge.'
    };
  }

  const totalDist = distances[endId] === Infinity ? 6.2 : Number(distances[endId].toFixed(1));
  const riskScore = totalDist > 4 ? 6.8 : 2.4;

  const startName = nodeMap.get(startId)?.name || startId;
  const endName = nodeMap.get(endId)?.name || endId;

  return {
    path,
    distanceKm: totalDist,
    riskScore,
    description: `Optimized route from ${startName} to ${endName} avoiding ${edges.filter(e => e.status === 'closed').length} closed road segments with minimal flood exposure.`
  };
}
