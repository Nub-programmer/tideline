import React, { useState } from 'react';
import { SimulationState } from '../engine/simulationEngine';
import { CityNode, CityEdge } from '../types';
import { Map, Layers, ShieldAlert, Navigation, Search, Eye, Filter, Info, RefreshCw } from 'lucide-react';

interface DigitalTwinPageProps {
  simState: SimulationState;
  onOpenExplain: (topic: string) => void;
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({
  simState,
  onOpenExplain
}) => {
  const [selectedNode, setSelectedNode] = useState<CityNode | null>(simState.nodes[0]);
  const [selectedEdge, setSelectedEdge] = useState<CityEdge | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'floods' | 'infrastructure' | 'shelters'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = simState.nodes.filter(n => 
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Geospatial Digital Twin</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Metropolitan Grid & Inundation Map</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenExplain('digital-twin-map')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F0F2EF] text-[#18221F] hover:bg-[#E4E8E3] transition-colors"
          >
            Explain this view
          </button>
          <div className="flex items-center gap-1 bg-[#F7F8F6] p-1 rounded-xl border border-[#E4E8E3]">
            {(['all', 'floods', 'infrastructure', 'shelters'] as const).map(layer => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  activeLayer === layer ? 'bg-white text-[#18221F] shadow-xs font-semibold' : 'text-[#68736E] hover:text-[#18221F]'
                }`}
              >
                {layer}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map Canvas */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E4E8E3] p-6 shadow-xs relative min-h-[520px] flex flex-col justify-between overflow-hidden">
          {/* Map Top Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2 bg-[#F7F8F6] px-3 py-1.5 rounded-xl border border-[#E4E8E3] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#326B58]"></span>
              <span>RIVER SECTOR A-4 • SCALE 1:10,000</span>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-[#68736E] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search nodes or districts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#F7F8F6] border border-[#E4E8E3] rounded-xl text-xs text-[#18221F] focus:outline-none focus:border-[#326B58]"
              />
            </div>
          </div>

          {/* SVG Vector Map Rendering */}
          <div className="absolute inset-0 pt-16 px-6 pb-6 flex items-center justify-center">
            <svg className="w-full h-full max-w-[600px] max-h-[420px]" viewBox="0 0 100 100">
              {/* River Stream */}
              <path
                d="M 0 30 Q 30 45, 50 40 T 100 65"
                fill="none"
                stroke="#6CA6C7"
                strokeWidth="12"
                strokeOpacity="0.4"
              />
              <path
                d="M 0 30 Q 30 45, 50 40 T 100 65"
                fill="none"
                stroke="#3578A5"
                strokeWidth="6"
                strokeOpacity="0.7"
              />

              {/* Flood Inundation Zone Overlay */}
              {(activeLayer === 'all' || activeLayer === 'floods') && (
                <path
                  d="M 40 10 Q 70 30, 90 40 L 95 80 L 50 95 Z"
                  fill="#547FA5"
                  fillOpacity="0.2"
                  stroke="#547FA5"
                  strokeDasharray="2,2"
                />
              )}

              {/* Edges / Roads */}
              {simState.edges.map(edge => {
                const sourceNode = simState.nodes.find(n => n.id === edge.source);
                const targetNode = simState.nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isClosed = edge.status === 'closed';
                const isFlooded = edge.status === 'flooded';
                const strokeColor = isClosed ? '#BF5C55' : isFlooded ? '#D49A4B' : '#326B58';

                return (
                  <g key={edge.id} onClick={() => setSelectedEdge(edge)} className="cursor-pointer group">
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={strokeColor}
                      strokeWidth={isClosed ? '2' : '1.5'}
                      strokeDasharray={isClosed ? '3,3' : undefined}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isFlooded = node.status === 'flooded';
                const isIsolated = node.status === 'isolated';
                const fillColor = isFlooded ? '#BF5C55' : isIsolated ? '#D49A4B' : '#326B58';

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? '4' : '3'}
                      fill={fillColor}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x={node.x}
                      y={node.y - 4}
                      fontSize="3.5"
                      fontFamily="Inter, sans-serif"
                      fill="#18221F"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Map Legend Footer */}
          <div className="flex items-center justify-between text-xs font-mono text-[#68736E] z-10 pt-4 border-t border-[#E4E8E3]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#326B58]"></span> Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D49A4B]"></span> At-Risk</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#BF5C55]"></span> Flooded / Closed</span>
            </div>
            <span>Click any node or road to inspect</span>
          </div>
        </div>

        {/* Right Inspector Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E4E8E3] pb-4">
            <h2 className="text-base font-semibold text-[#18221F]">Inspector</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F0F2EF] text-[#68736E]">
              {selectedNode ? 'NODE' : selectedEdge ? 'ROAD SEGMENT' : 'SELECT TARGET'}
            </span>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-xs text-[#68736E] uppercase font-mono">Location Name</span>
                <h3 className="text-lg font-bold text-[#18221F] mt-0.5">{selectedNode.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                  <span className="text-xs text-[#68736E]">Type</span>
                  <div className="text-sm font-semibold capitalize text-[#18221F] mt-0.5">{selectedNode.type}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                  <span className="text-xs text-[#68736E]">Elevation</span>
                  <div className="text-sm font-semibold text-[#18221F] mt-0.5">{selectedNode.elevation}m</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-1">
                <span className="text-xs text-[#68736E]">Simulated Status</span>
                <div className="text-sm font-semibold uppercase text-[#326B58]">{selectedNode.status}</div>
                <p className="text-xs text-[#68736E] mt-1">
                  Population density: {selectedNode.population?.toLocaleString() || 'N/A'} residents within sector.
                </p>
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="space-y-4">
              <div>
                <span className="text-xs text-[#68736E] uppercase font-mono">Road Segment</span>
                <h3 className="text-lg font-bold text-[#18221F] mt-0.5">{selectedEdge.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                  <span className="text-xs text-[#68736E]">Length</span>
                  <div className="text-sm font-semibold text-[#18221F] mt-0.5">{selectedEdge.lengthKm} km</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                  <span className="text-xs text-[#68736E]">Flood Depth</span>
                  <div className="text-sm font-semibold text-[#18221F] mt-0.5">{selectedEdge.floodDepthMeters}m</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3]">
                <span className="text-xs text-[#68736E]">Accessibility Status</span>
                <div className="text-sm font-semibold uppercase text-[#BF5C55] mt-0.5">{selectedEdge.status}</div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#68736E] text-sm">
              Click any node or road segment on the map to view detailed telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
