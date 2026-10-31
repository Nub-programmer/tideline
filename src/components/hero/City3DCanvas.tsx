import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface City3DCanvasProps {
  viewMode: 'normal' | 'flood' | 'infrastructure';
  onSelectBuilding?: (buildingId: string) => void;
  interactive?: boolean;
}

export const City3DCanvas: React.FC<City3DCanvasProps> = ({
  viewMode,
  onSelectBuilding,
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'normal' | 'flood' | 'infrastructure'>(viewMode);
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);

  useEffect(() => {
    setActiveView(viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF7F8F6);
    scene.fog = new THREE.FogExp2(0xF7F8F6, 0.012);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(38, 30, 38);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(40, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Ground Plane
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xEEF1EE,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // River
    const riverGeo = new THREE.PlaneGeometry(90, 12);
    const isFlood = activeView === 'flood' || activeView === 'infrastructure';
    const riverMat = new THREE.MeshStandardMaterial({
      color: isFlood ? 0x547FA5 : 0x6CA6C7,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: isFlood ? 0.9 : 0.82
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, isFlood ? 0.7 : 0.1, 0);
    river.rotation.z = 0.22;
    scene.add(river);

    // Buildings Group
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    const matNormal = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.25, metalness: 0.05 });
    const matAccent = new THREE.MeshStandardMaterial({ color: 0x326B58, roughness: 0.3, metalness: 0.1 });
    const matFlood = new THREE.MeshStandardMaterial({ color: 0xBF5C55, roughness: 0.3, metalness: 0.1 });

    const buildingMeshes: THREE.Mesh[] = [];
    const buildingCount = 56;
    for (let i = 0; i < buildingCount; i++) {
      const x = (Math.sin(i * 12.9898 + 42) * 43758.5453) % 34 - 17;
      const z = (Math.cos(i * 78.233 + 42) * 43758.5453) % 34 - 17;

      if (Math.abs(z - x * 0.22) < 7) continue;

      const w = 2.2 + (i % 3) * 0.9;
      const d = 2.2 + ((i + 1) % 3) * 0.9;
      const h = 3.5 + ((i * 7) % 16);

      const geom = new THREE.BoxGeometry(w, h, d);
      let mat = matNormal;
      if (i % 6 === 0) mat = matAccent;
      if (isFlood && (h < 7 || Math.abs(x) < 9)) mat = matFlood;

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { id: `bldg-${i}`, name: `Sector Building ${i + 1}`, height: h };
      buildingsGroup.add(mesh);
      buildingMeshes.push(mesh);
    }

    // Bridges
    const bridgeGeo = new THREE.BoxGeometry(4.5, 0.7, 14);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x68736E, roughness: 0.4 });

    const bridge1 = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge1.position.set(-6, 0.9, 1.5);
    bridge1.rotation.y = 0.22;
    bridge1.castShadow = true;
    scene.add(bridge1);

    const bridge2 = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge2.position.set(9, 0.9, -2.5);
    bridge2.rotation.y = 0.22;
    bridge2.castShadow = true;
    scene.add(bridge2);

    // Flood plane overlay
    if (isFlood) {
      const floodGeo = new THREE.PlaneGeometry(80, 80);
      const floodMat = new THREE.MeshStandardMaterial({
        color: 0x547FA5,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1
      });
      const floodMesh = new THREE.Mesh(floodGeo, floodMat);
      floodMesh.rotation.x = -Math.PI / 2;
      floodMesh.position.y = 0.8;
      scene.add(floodMesh);
    }

    // Raycaster for building selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(buildingMeshes);
      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const data = hit.userData;
        setSelectedInfo(data.name);
        if (onSelectBuilding) onSelectBuilding(data.id);
      }
    };

    const domElem = containerRef.current;
    domElem.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let animId: number;
    let angle = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      angle += 0.0015;
      camera.position.x = Math.cos(angle) * 42;
      camera.position.z = Math.sin(angle) * 42;
      camera.lookAt(0, 2, 0);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('pointerdown', handlePointerDown);
      if (domElem && renderer.domElement) {
        domElem.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [activeView, interactive, onSelectBuilding]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-[#E4E8E3] bg-[#F7F8F6] shadow-sm">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {selectedInfo && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl border border-[#E4E8E3] text-xs font-semibold text-[#18221F] shadow-sm z-20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#326B58]"></span>
          <span>Selected: {selectedInfo}</span>
        </div>
      )}

      {/* View Switcher Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-[#E4E8E3] flex items-center gap-1 shadow-sm z-20">
        <button
          onClick={() => setActiveView('normal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'normal' ? 'bg-[#326B58] text-white' : 'text-[#68736E] hover:text-[#18221F]'
          }`}
        >
          Normal View
        </button>
        <button
          onClick={() => setActiveView('flood')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'flood' ? 'bg-[#326B58] text-white' : 'text-[#68736E] hover:text-[#18221F]'
          }`}
        >
          Flood View
        </button>
        <button
          onClick={() => setActiveView('infrastructure')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'infrastructure' ? 'bg-[#326B58] text-white' : 'text-[#68736E] hover:text-[#18221F]'
          }`}
        >
          Infrastructure
        </button>
      </div>

      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E4E8E3] text-[11px] font-mono text-[#68736E]">
        3D ARCHITECTURAL DIGITAL TWIN
      </div>
    </div>
  );
};
