import React, { useEffect, useRef, useState } from 'react';
import { ViewMode, ScenarioId } from '../../types';
import { createCityScene, CitySceneAssets } from '../hero/CinematicCityScene';
import { interpolateCinematicCamera } from '../hero/CinematicCameraRig';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, RefreshCw, Layers, ShieldAlert, Cpu, Navigation, Users, ChevronDown, ChevronUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ImmersiveScrollExperienceProps {
  onSelectView: (view: ViewMode) => void;
  onStartPresentation: () => void;
  onSelectScenario: (scenario: ScenarioId) => void;
}

export const ImmersiveScrollExperience: React.FC<ImmersiveScrollExperienceProps> = ({
  onSelectView,
  onStartPresentation,
  onSelectScenario
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneAssetsRef = useRef<CitySceneAssets | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Smooth interpolated scroll state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [manualOrbit, setManualOrbit] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'city' | 'flood' | 'cascade' | 'route'>('city');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  // Initialize Three.js scene once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const assets = createCityScene(canvasMountRef.current);
    sceneAssetsRef.current = assets;

    // Orbit controls for free 3D inspection mode
    const controls = new OrbitControls(assets.camera, assets.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 8;
    controls.maxDistance = 150;
    controls.enabled = false;
    controlsRef.current = controls;

    // Raycaster for interactive building inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      if (!canvasMountRef.current) return;
      const rect = canvasMountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, assets.camera);
      const meshes = assets.buildings.map(b => b.primaryMesh);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const bData = assets.buildings.find(b => b.primaryMesh === hit);
        if (bData) {
          setSelectedBuilding(bData.name);
        }
      }
    };

    const dom = canvasMountRef.current;
    dom.addEventListener('pointerdown', handlePointerDown);

    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      assets.dispose();
    };
  }, []);

  // GSAP ScrollTrigger Continuous Scrubbing Setup
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const scrollEl = scrollContainerRef.current;

    const handleProgressUpdate = (progress: number) => {
      const p = Math.max(0, Math.min(1, progress));
      setScrollProgress(p);

      const assets = sceneAssetsRef.current;
      if (!assets) return;

      // 1. Continuous Catmull-Rom Spline Camera Interpolation
      if (!manualOrbit) {
        const lookTarget = new THREE.Vector3();
        interpolateCinematicCamera(assets.camera, p, lookTarget);
        if (controlsRef.current) {
          controlsRef.current.target.copy(lookTarget);
        }
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      // 2. Continuous Scene Transformations
      // Water level rise (Scene 3: 0.28 to 0.46)
      if (p < 0.28) {
        assets.updateFlood(0);
      } else if (p <= 0.46) {
        const t = (p - 0.28) / 0.18;
        assets.updateFlood(t);
      } else {
        assets.updateFlood(1.0);
      }

      // North Arch Bridge Failure & Roadblocks (Scene 4: severed after 0.46)
      const isSevered = p >= 0.46;
      assets.setBridgeState(isSevered);

      // Network Graph Overlay (Scene 5: 0.60 to 0.76)
      const showNetwork = p >= 0.60;
      assets.setNetworkVisibility(showNetwork);

      // Pathfinder Route Drawing (Scene 6: 0.74 to 0.90)
      if (p < 0.74) {
        assets.setRouteProgress(0);
      } else if (p <= 0.90) {
        const routeT = (p - 0.74) / 0.16;
        assets.setRouteProgress(routeT);
      } else {
        assets.setRouteProgress(1.0);
      }
    };

    const st = ScrollTrigger.create({
      trigger: scrollEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        handleProgressUpdate(self.progress);
      }
    });

    // Initial evaluation
    handleProgressUpdate(0);
    ScrollTrigger.refresh();

    return () => {
      st.kill();
    };
  }, [manualOrbit]);

  // Manual Orbit Toggle
  const toggleManualOrbit = () => {
    const next = !manualOrbit;
    setManualOrbit(next);
    if (controlsRef.current) {
      controlsRef.current.enabled = next;
    }
  };

  const resumeCinematicStory = () => {
    setManualOrbit(false);
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
    if (sceneAssetsRef.current) {
      const target = new THREE.Vector3();
      interpolateCinematicCamera(sceneAssetsRef.current.camera, scrollProgress, target);
      if (controlsRef.current) {
        controlsRef.current.target.copy(target);
      }
    }
  };

  // Layer buttons inside ergonomic dock
  const handleLayerSelect = (layer: 'city' | 'flood' | 'cascade' | 'route') => {
    setActiveLayer(layer);
    const assets = sceneAssetsRef.current;
    if (!assets) return;

    if (layer === 'city') {
      assets.updateFlood(0);
      assets.setBridgeState(false);
      assets.setNetworkVisibility(false);
      assets.setRouteProgress(0);
    } else if (layer === 'flood') {
      assets.updateFlood(0.85);
      assets.setBridgeState(true);
      assets.setNetworkVisibility(false);
      assets.setRouteProgress(0);
    } else if (layer === 'cascade') {
      assets.updateFlood(0.85);
      assets.setBridgeState(true);
      assets.setNetworkVisibility(true);
      assets.setRouteProgress(0);
    } else if (layer === 'route') {
      assets.updateFlood(0.85);
      assets.setBridgeState(true);
      assets.setNetworkVisibility(true);
      assets.setRouteProgress(1.0);
    }
  };

  // Helper function for silky smooth chapter opacity and parallax glide
  const getChapterStyle = (p: number, center: number, width: number) => {
    const dist = Math.abs(p - center);
    const opacity = Math.max(0, Math.min(1, 1 - dist / width));
    const translateY = (p - center) * 80;
    return {
      opacity,
      transform: `translateY(${translateY}px)`,
      pointerEvents: opacity > 0.35 ? ('auto' as const) : ('none' as const),
      display: opacity > 0.01 ? 'block' : 'none'
    };
  };

  return (
    <div className="relative bg-[#F2EFE7] text-[#18221F] selection:bg-[#326B58] selection:text-white">
      {/* 1. 650vh Scroll Container with Native GPU-Accelerated Sticky Viewport */}
      <div ref={scrollContainerRef} className="relative w-full" style={{ height: '650vh' }}>
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
          {/* Persistent Three.js Canvas */}
          <div ref={canvasMountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Selected Building Pill Tag */}
          {selectedBuilding && (
            <div className="absolute top-6 left-8 bg-white/95 border border-[#D9D2C5] rounded-xl px-4 py-2.5 shadow-sm text-xs z-30 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#326B58]"></span>
              <div>
                <div className="font-semibold text-[#18221F]">{selectedBuilding}</div>
                <div className="text-[11px] text-[#747772]">Interactive Inspection Active</div>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="ml-2 text-xs text-[#747772] hover:text-[#18221F]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Cartographic Coordinate Tag (Top Right) */}
          <div className="absolute top-6 right-8 text-right z-20 pointer-events-none">
            <div className="text-xs font-mono text-[#326B58] tracking-wider uppercase font-semibold">
              TIDELINE · DIGITAL TWIN
            </div>
            <div className="text-[11px] font-mono text-[#747772] mt-0.5">
              37°46'29" N · 122°25'10" W · SECTOR METRO-4
            </div>
          </div>

          {/* Manual Orbit Alert / Resume Cinematic Story */}
          {manualOrbit && (
            <div className="absolute top-20 right-8 z-30">
              <button
                onClick={resumeCinematicStory}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] shadow-md transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resume Cinematic Story</span>
              </button>
            </div>
          )}

          {/* Narrative Chapter Overlays (Scrubbed continuously with scroll) */}
          <div className="absolute inset-0 pointer-events-none flex items-center px-8 lg:px-24">
            {/* Chapter 01: Establishing Shot (Center: 0.06, Width: 0.08) */}
            <div
              style={getChapterStyle(scrollProgress, 0.06, 0.08)}
              className="max-w-2xl space-y-5 transition-transform duration-100 ease-out"
            >
              <div className="text-xs font-mono uppercase tracking-wider text-[#326B58] font-semibold">
                TIDELINE / URBAN INTELLIGENCE
              </div>
              <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#18221F] leading-[1.04] text-balance">
                Every city is a network of connections.
              </h1>
              <p className="text-lg text-[#747772] leading-relaxed max-w-xl">
                Buildings, roads, bridges and the people who depend on them. A delicate municipal balance sustaining life.
              </p>
              <div className="pt-2 text-xs font-mono text-[#747772] flex items-center gap-2">
                <span>SCROLL DOWN TO ADVANCE CINEMATIC NARRATIVE</span>
                <span>↓</span>
              </div>
            </div>

            {/* Chapter 02: Descent into downtown (Center: 0.22, Width: 0.09) */}
            <div
              style={getChapterStyle(scrollProgress, 0.22, 0.09)}
              className="max-w-xl space-y-4 bg-white/95 p-8 rounded-2xl border border-[#D9D2C5] shadow-md transition-transform duration-100 ease-out"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-[#326B58] font-semibold">
                Chapter 02 · Urban Vulnerability
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                But every connection has a point of failure.
              </h2>
              <p className="text-sm text-[#747772] leading-relaxed">
                As cities densify around natural river basins, structural reliance on single arterial bridges turns localized hazards into city-wide catastrophes.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#18221F] pt-2 border-t border-[#E8E4DA]">
                <span>URBAN INFRASTRUCTURE</span>
                <span>·</span>
                <span>CRITICAL NETWORKS</span>
              </div>
            </div>

            {/* Chapter 03: River surge and flooding (Center: 0.38, Width: 0.09) */}
            <div
              style={getChapterStyle(scrollProgress, 0.38, 0.09)}
              className="max-w-xl space-y-4 bg-white/95 p-8 rounded-2xl border border-[#D9D2C5] shadow-md ml-auto transition-transform duration-100 ease-out"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-[#315E77] font-semibold">
                Chapter 03 · Hydrological Impact
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                When the water rises, the entire system changes.
              </h2>
              <p className="text-sm text-[#747772] leading-relaxed">
                Precipitation exceeds 85mm/hr. River levels breach embankment thresholds, inundating eastern road corridors and low-lying residential sectors.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#E8E4DA] text-xs">
                <div>
                  <span className="text-[#747772]">River Surge Datum:</span>
                  <div className="font-bold font-mono text-base text-[#18221F]">+1.95 m</div>
                </div>
                <div>
                  <span className="text-[#747772]">Inundation Zone:</span>
                  <div className="font-bold font-mono text-base text-[#315E77]">24.8 sq km</div>
                </div>
              </div>
            </div>

            {/* Chapter 04: North Arch Bridge Failure (Center: 0.54, Width: 0.09) */}
            <div
              style={getChapterStyle(scrollProgress, 0.54, 0.09)}
              className="max-w-xl space-y-4 bg-white/95 p-8 rounded-2xl border border-[#D9D2C5] shadow-md transition-transform duration-100 ease-out"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-[#C47A60] font-semibold">
                Chapter 04 · Infrastructure Severance
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                One failed connection can isolate an entire community.
              </h2>
              <p className="text-sm text-[#747772] leading-relaxed">
                The North Arch Bridge is closed due to hydrodynamic deck pressure. Emergency access between the central business core and the northern medical trauma center is severed.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#C47A60] font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>North Arch Bridge Impassable · Eastern Arterials Blocked</span>
              </div>
            </div>

            {/* Chapter 05: Network Disruption Graph (Center: 0.70, Width: 0.09) */}
            <div
              style={getChapterStyle(scrollProgress, 0.70, 0.09)}
              className="max-w-xl space-y-4 bg-white/95 p-8 rounded-2xl border border-[#D9D2C5] shadow-md ml-auto transition-transform duration-100 ease-out"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-[#326B58] font-semibold">
                Chapter 05 · Cascade Graph Analysis
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                Understanding the failure is only the beginning.
              </h2>
              <p className="text-sm text-[#747772] leading-relaxed">
                TIDELINE models urban transit as a live mathematical network graph. Connected-component algorithms instantly identify cut-off districts and recalculate route betweenness.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E8E4DA] text-center text-xs">
                <div className="p-2 bg-[#F2EFE7] rounded-lg">
                  <div className="font-bold font-mono text-[#18221F]">2</div>
                  <div className="text-[11px] text-[#747772]">Isolated Zones</div>
                </div>
                <div className="p-2 bg-[#F2EFE7] rounded-lg">
                  <div className="font-bold font-mono text-[#18221F]">42%</div>
                  <div className="text-[11px] text-[#747772]">Hospital Access</div>
                </div>
                <div className="p-2 bg-[#F2EFE7] rounded-lg">
                  <div className="font-bold font-mono text-[#18221F]">6</div>
                  <div className="text-[11px] text-[#747772]">Active Closures</div>
                </div>
              </div>
            </div>

            {/* Chapter 06: Response / Pathfinder (Center: 0.84, Width: 0.08) */}
            <div
              style={getChapterStyle(scrollProgress, 0.84, 0.08)}
              className="max-w-xl space-y-4 bg-white/95 p-8 rounded-2xl border border-[#D9D2C5] shadow-md transition-transform duration-100 ease-out"
            >
              <span className="text-xs font-mono uppercase tracking-wider text-[#315E77] font-semibold">
                Chapter 06 · Pathfinder & ReliefNet
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                Intelligence turns disruption into a response.
              </h2>
              <p className="text-sm text-[#747772] leading-relaxed">
                Pathfinder discovers an unflooded bypass corridor over the South Causeway, re-establishing access to Southport Civic Shelter while avoiding flooded road sections.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#315E77] font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4 shrink-0" />
                <span>Alternative Evacuation Route Active via South Causeway (+3.2 km)</span>
              </div>
            </div>

            {/* Chapter 07: Final Reveal (Center: 0.96, Width: 0.08) */}
            <div
              style={getChapterStyle(scrollProgress, 0.96, 0.08)}
              className="max-w-2xl mx-auto text-center space-y-6 bg-white/95 p-10 sm:p-14 rounded-3xl border border-[#D9D2C5] shadow-xl transition-transform duration-100 ease-out"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EFE7] text-xs font-mono text-[#326B58] font-semibold">
                TIDELINE PLATFORM
              </div>
              <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#18221F]">
                Meet TIDELINE.
              </h2>
              <p className="text-lg text-[#747772] max-w-xl mx-auto leading-relaxed">
                See the city. Understand the impact. Adapt the response.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => onSelectView('digital-twin')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#326B58] text-white hover:bg-[#285545] shadow-sm transition-all hover:scale-[1.02]"
                >
                  <span>Explore the Digital Twin</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectView('overview')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#F2EFE7] text-[#18221F] hover:bg-[#E8E4DA] transition-all"
                >
                  <span>Launch Command Centre</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unified Bottom Ergonomic Dock (Zero Viewport Occlusion) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4 pointer-events-auto">
            <div className="bg-white/95 border border-[#D9D2C5] rounded-2xl shadow-sm p-3 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E4DA]">
                <div className="flex items-center gap-2 text-xs font-medium text-[#747772]">
                  <Layers className="w-3.5 h-3.5 text-[#326B58]" />
                  <span>Simulation Layers & Controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleManualOrbit}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      manualOrbit ? 'bg-[#326B58] text-white' : 'bg-[#F2EFE7] text-[#18221F] hover:bg-[#E8E4DA]'
                    }`}
                  >
                    {manualOrbit ? 'Orbit Active' : 'Explore Free 3D'}
                  </button>
                  <button
                    onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                    className="p-1 text-[#747772] hover:text-[#18221F]"
                    aria-label="Toggle Dock"
                  >
                    {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isDockCollapsed && (
                <div className="pt-3 flex flex-wrap items-center justify-between gap-4">
                  {/* Layer Selector */}
                  <div className="flex items-center gap-1 bg-[#F2EFE7] p-1 rounded-xl">
                    {(['city', 'flood', 'cascade', 'route'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => handleLayerSelect(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          activeLayer === l ? 'bg-white text-[#18221F] shadow-xs font-semibold' : 'text-[#747772] hover:text-[#18221F]'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  {/* Flood Depth Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#747772] font-mono">Flood Level:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(activeLayer === 'city' ? 0 : 85)}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        if (sceneAssetsRef.current) {
                          sceneAssetsRef.current.updateFlood(val);
                        }
                      }}
                      className="w-24 accent-[#326B58]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Seamless Post-Hero Editorial Sections */}
      <div className="relative z-20 bg-white border-t border-[#D9D2C5]">
        {/* Section A: The Problem */}
        <section className="py-24 px-8 max-w-7xl mx-auto space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#747772]">Section A · Systemic Vulnerability</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
              A disaster is never an isolated event.
            </h2>
            <p className="text-base text-[#747772] leading-relaxed">
              Conventional disaster maps plot flood hazards as static polygons. But modern cities are interconnected infrastructure networks where water triggers cascading systemic collapse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#F2EFE7] border border-[#D9D2C5] space-y-4">
              <div className="text-sm font-mono text-[#C47A60] font-semibold">01 · PRIMARY SEVERANCE</div>
              <h3 className="text-lg font-bold text-[#18221F]">Bridge & Arterial Outage</h3>
              <p className="text-xs text-[#747772] leading-relaxed">
                Hydrodynamic river surge submerges bridge approaches, forcing immediate police closures at the city's key crossing points.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#F2EFE7] border border-[#D9D2C5] space-y-4">
              <div className="text-sm font-mono text-[#D6A15C] font-semibold">02 · SECONDARY ISOLATION</div>
              <h3 className="text-lg font-bold text-[#18221F]">Cascading Neighbourhood Disconnection</h3>
              <p className="text-xs text-[#747772] leading-relaxed">
                Residential districts lose connection to trauma hospitals and civic shelters long before water enters individual homes.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#F2EFE7] border border-[#D9D2C5] space-y-4">
              <div className="text-sm font-mono text-[#326B58] font-semibold">03 · RESPONSE PARALYSIS</div>
              <h3 className="text-lg font-bold text-[#18221F]">Static Dispatch Failures</h3>
              <p className="text-xs text-[#747772] leading-relaxed">
                Emergency logistics stall when first responder convoys navigate using outdated maps unaware of downstream road closures.
              </p>
            </div>
          </div>
        </section>

        {/* Section B: The TIDELINE Intelligence Engines */}
        <section className="py-24 bg-[#F2EFE7] px-8 border-t border-[#D9D2C5]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#326B58] font-semibold">Section B · Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#18221F]">
                One city. Multiple interconnected intelligence systems.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border border-[#D9D2C5] space-y-4 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F2EFE7] flex items-center justify-center text-[#326B58]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#18221F]">CASCADE</h3>
                <p className="text-xs text-[#747772] leading-relaxed">
                  Infrastructure graph engine that identifies newly isolated neighbourhoods and assesses hospital connectivity using betweenness centrality.
                </p>
                <button
                  onClick={() => onSelectView('infrastructure')}
                  className="text-xs font-semibold text-[#326B58] hover:underline"
                >
                  Explore Cascade Graph →
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#D9D2C5] space-y-4 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F2EFE7] flex items-center justify-center text-[#315E77]">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#18221F]">PATHFINDER</h3>
                <p className="text-xs text-[#747772] leading-relaxed">
                  Deterministic A* routing engine that discovers safe alternative evacuation paths while actively avoiding inundated road sections.
                </p>
                <button
                  onClick={() => onSelectView('evacuation')}
                  className="text-xs font-semibold text-[#326B58] hover:underline"
                >
                  Test Route Optimization →
                </button>
              </div>

              <div className="bg-white p-8 rounded-2xl border border-[#D9D2C5] space-y-4 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-[#F2EFE7] flex items-center justify-center text-[#326B58]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#18221F]">RELIEFNET</h3>
                <p className="text-xs text-[#747772] leading-relaxed">
                  Min-cost flow resource distribution optimizer matching affected population demand to shelter capacities at minimum travel cost.
                </p>
                <button
                  onClick={() => onSelectView('relief')}
                  className="text-xs font-semibold text-[#326B58] hover:underline"
                >
                  Inspect Allocation Engine →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section C: Competition Presentation Mode CTA */}
        <section className="py-24 px-8 max-w-7xl mx-auto text-center space-y-8">
          <span className="text-xs font-mono uppercase tracking-wider text-[#747772]">Competition Presentation Mode</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#18221F] max-w-2xl mx-auto">
            Ready to present TIDELINE to the judging panel?
          </h2>
          <p className="text-sm text-[#747772] max-w-xl mx-auto">
            Launch our 10-chapter guided presentation mode featuring integrated live demonstrations, speaker scripts, and technical architecture talking points.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onStartPresentation}
              className="px-8 py-3.5 rounded-xl text-sm font-semibold bg-[#326B58] text-white hover:bg-[#285545] shadow-md transition-all hover:scale-[1.02]"
            >
              Start Guided Presentation
            </button>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="py-8 px-8 border-t border-[#D9D2C5] text-xs text-[#747772] flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>TIDELINE · Urban Flood Intelligence & Emergency Response Digital Twin</div>
          <div>Architectural WebGL · Zero External Hardware Dependencies</div>
        </footer>
      </div>
    </div>
  );
};
