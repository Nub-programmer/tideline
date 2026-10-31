import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface BuildingData {
  id: string;
  name: string;
  type: 'commercial' | 'residential' | 'civic' | 'hospital' | 'shelter' | 'bridge';
  height: number;
  position: THREE.Vector3;
  group: THREE.Group;
  primaryMesh: THREE.Mesh;
}

export interface CitySceneAssets {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  buildings: BuildingData[];
  waterMesh: THREE.Mesh;
  waterMaterial: THREE.ShaderMaterial;
  floodMesh: THREE.Mesh;
  floodMaterial: THREE.ShaderMaterial;
  bridgeGroup: THREE.Group;
  bridgeDeck: THREE.Mesh;
  bridgeArches: THREE.Mesh[];
  roadblocksGroup: THREE.Group;
  networkGroup: THREE.Group;
  routeGroup: THREE.Group;
  routeTube: THREE.Mesh;
  routeMaterial: THREE.MeshStandardMaterial;
  updateFlood: (progress: number) => void;
  setBridgeState: (severed: boolean) => void;
  setNetworkVisibility: (visible: boolean) => void;
  setRouteProgress: (progress: number) => void;
  dispose: () => void;
}

// Multi-wave river water shader with depth-attenuation and specular sunlight sheen
const WaterShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uWaveSpeed;
    uniform float uWaveHeight;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Realistic multi-wave current simulation
      float w1 = sin(pos.x * 0.16 + uTime * uWaveSpeed) * cos(pos.y * 0.12 + uTime * uWaveSpeed * 0.85);
      float w2 = sin(pos.x * 0.38 - uTime * uWaveSpeed * 1.25) * sin(pos.y * 0.28 + uTime * uWaveSpeed * 1.1);
      float w3 = cos((pos.x + pos.y) * 0.22 + uTime * uWaveSpeed * 0.6) * 0.4;
      pos.z += (w1 + w2 + w3) * uWaveHeight;

      float dX = cos(pos.x * 0.16 + uTime * uWaveSpeed) * 0.16 * uWaveHeight;
      float dY = -sin(pos.y * 0.12 + uTime * uWaveSpeed * 0.85) * 0.12 * uWaveHeight;
      vNormal = normalize(vec3(-dX, -dY, 1.0));

      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uDeepColor;      // #315E77
    uniform vec3 uMidColor;       // #527E91
    uniform vec3 uShallowColor;   // #85ACB8
    uniform vec3 uHighlightColor; // #A9C7CB
    uniform vec3 uSunDirection;
    uniform float uOpacity;
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;

    void main() {
      // Channel depth gradient based on vUv.y (0.0 bank -> 0.5 mid-river -> 1.0 bank)
      float channelDepth = 1.0 - abs(vUv.y - 0.5) * 2.0;
      vec3 baseWater = mix(uShallowColor, uMidColor, smoothstep(0.0, 0.55, channelDepth));
      baseWater = mix(baseWater, uDeepColor, smoothstep(0.50, 1.0, channelDepth));

      // Specular sunlight reflection
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 norm = normalize(vNormal);
      vec3 halfVec = normalize(uSunDirection + viewDir);
      float spec = pow(max(dot(norm, halfVec), 0.0), 36.0);
      
      // Surface ripple highlights
      float ripple = sin(vWorldPosition.x * 0.55 + uTime * 0.75) * cos(vWorldPosition.z * 0.55 + uTime * 0.65);
      vec3 finalColor = baseWater + uHighlightColor * (spec * 0.75 + pow(abs(ripple), 3.5) * 0.20);

      gl_FragColor = vec4(finalColor, uOpacity);
    }
  `
};

export function createCityScene(container: HTMLElement): CitySceneAssets {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  // 1. Renderer Setup with Strict Color Management
  const isSoftwareGl = (() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  })();

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.appendChild(renderer.domElement);

  // 2. Scene & Warm Architectural Environment (#F2EFE7)
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF2EFE7);
  scene.fog = new THREE.FogExp2(0xF2EFE7, 0.0075);

  // Studio Environment Map via RoomEnvironment for realistic PBR reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // 3. Perspective Camera
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 600);
  camera.position.set(54, 46, 56);
  camera.lookAt(0, 2, 0);

  // 4. Lighting Rig with Calibrated Contrast (Not Washed Out)
  // Warm Key Sunlight
  const sunLight = new THREE.DirectionalLight(0xFFF5E6, 2.2);
  sunLight.position.set(45, 65, 35);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 180;
  const shadowBounds = 55;
  sunLight.shadow.camera.left = -shadowBounds;
  sunLight.shadow.camera.right = shadowBounds;
  sunLight.shadow.camera.top = shadowBounds;
  sunLight.shadow.camera.bottom = -shadowBounds;
  sunLight.shadow.bias = -0.00015;
  sunLight.shadow.normalBias = 0.015;
  scene.add(sunLight);

  // Cool Sky Fill / Warm Ground Bounce (Hemisphere)
  const hemiLight = new THREE.HemisphereLight(0xE8EFF5, 0xD8D2C5, 0.70);
  scene.add(hemiLight);

  // Soft Rim Fill Light
  const rimLight = new THREE.DirectionalLight(0xC9D8E6, 0.35);
  rimLight.position.set(-35, 25, -40);
  scene.add(rimLight);

  // 5. Materials Palette
  const materials = {
    // Terrain & Roads
    terrain: new THREE.MeshStandardMaterial({ color: 0xEEF1EB, roughness: 0.92, metalness: 0.04 }),
    curb: new THREE.MeshStandardMaterial({ color: 0xBBB8AF, roughness: 0.82, metalness: 0.05 }),
    sidewalk: new THREE.MeshStandardMaterial({ color: 0xBBB8AF, roughness: 0.80, metalness: 0.05 }),
    asphalt: new THREE.MeshStandardMaterial({ color: 0x747772, roughness: 0.88, metalness: 0.10 }),
    asphaltWet: new THREE.MeshStandardMaterial({ color: 0x484B48, roughness: 0.40, metalness: 0.35 }),
    roadMarking: new THREE.MeshBasicMaterial({ color: 0xE8E4DA }),
    quayWall: new THREE.MeshStandardMaterial({ color: 0xBEBDB5, roughness: 0.85 }),

    // Architectural Facades
    warmLimestone: new THREE.MeshStandardMaterial({ color: 0xD9D2C5, roughness: 0.72, metalness: 0.05 }),
    naturalConcrete: new THREE.MeshStandardMaterial({ color: 0xBEBDB5, roughness: 0.84, metalness: 0.08 }),
    warmWhite: new THREE.MeshStandardMaterial({ color: 0xEBE8DF, roughness: 0.58, metalness: 0.05 }),
    slateRoof: new THREE.MeshStandardMaterial({ color: 0x89939A, roughness: 0.65, metalness: 0.20 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x4D606E, roughness: 0.08, metalness: 0.90 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x3E4448, roughness: 0.55, metalness: 0.50 }),

    // Infrastructure & Indicators
    bridgeNormal: new THREE.MeshStandardMaterial({ color: 0xBEBDB5, roughness: 0.60, metalness: 0.25 }),
    bridgeSevered: new THREE.MeshStandardMaterial({ color: 0xC47A60, roughness: 0.45, metalness: 0.35 }),
    warningAmber: new THREE.MeshStandardMaterial({ color: 0xD6A15C, roughness: 0.40 }),
    sageGreen: new THREE.MeshStandardMaterial({ color: 0x74866C, roughness: 0.70 }),
    deepFoliage: new THREE.MeshStandardMaterial({ color: 0x526A55, roughness: 0.75 })
  };

  // 6. Base Ground Plane with Contact Depth
  const groundGeo = new THREE.PlaneGeometry(180, 180);
  const ground = new THREE.Mesh(groundGeo, materials.terrain);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = !isSoftwareGl;
  scene.add(ground);

  // 7. Winding River Channel & Riverbanks
  const riverGeo = new THREE.PlaneGeometry(180, 18, 96, 24);
  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: WaterShader.vertexShader,
    fragmentShader: WaterShader.fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWaveSpeed: { value: 1.5 },
      uWaveHeight: { value: 0.16 },
      uDeepColor: { value: new THREE.Color(0x315E77) },
      uMidColor: { value: new THREE.Color(0x527E91) },
      uShallowColor: { value: new THREE.Color(0x85ACB8) },
      uHighlightColor: { value: new THREE.Color(0xA9C7CB) },
      uSunDirection: { value: new THREE.Vector3(0.6, 0.8, 0.4).normalize() },
      uOpacity: { value: 0.94 }
    },
    transparent: true,
    depthWrite: true
  });
  const waterMesh = new THREE.Mesh(riverGeo, waterMaterial);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.rotation.z = 0.22;
  waterMesh.position.set(0, 0.14, 0);
  scene.add(waterMesh);

  // Stepped Stone Quays / Embankments
  const quayGeo = new THREE.BoxGeometry(180, 0.5, 0.8);
  const quayNorth = new THREE.Mesh(quayGeo, materials.quayWall);
  quayNorth.rotation.y = 0.22;
  quayNorth.position.set(-2.0, 0.25, 9.4);
  quayNorth.castShadow = !isSoftwareGl;
  quayNorth.receiveShadow = !isSoftwareGl;
  scene.add(quayNorth);

  const quaySouth = new THREE.Mesh(quayGeo, materials.quayWall);
  quaySouth.rotation.y = 0.22;
  quaySouth.position.set(2.0, 0.25, -9.4);
  quaySouth.castShadow = !isSoftwareGl;
  quaySouth.receiveShadow = !isSoftwareGl;
  scene.add(quaySouth);

  // 8. Progressive Street Flood Mesh (Eastern Lowlands)
  const floodGeo = new THREE.PlaneGeometry(90, 80, 48, 48);
  const floodMaterial = new THREE.ShaderMaterial({
    vertexShader: WaterShader.vertexShader,
    fragmentShader: WaterShader.fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWaveSpeed: { value: 1.2 },
      uWaveHeight: { value: 0.10 },
      uDeepColor: { value: new THREE.Color(0x315E77) },
      uMidColor: { value: new THREE.Color(0x527E91) },
      uShallowColor: { value: new THREE.Color(0x85ACB8) },
      uHighlightColor: { value: new THREE.Color(0xA9C7CB) },
      uSunDirection: { value: new THREE.Vector3(0.6, 0.8, 0.4).normalize() },
      uOpacity: { value: 0.0 }
    },
    transparent: true,
    depthWrite: false
  });
  const floodMesh = new THREE.Mesh(floodGeo, floodMaterial);
  floodMesh.rotation.x = -Math.PI / 2;
  floodMesh.position.set(16, 0.06, 10);
  scene.add(floodMesh);

  // 9. Street Network with Elevated Curbs & Asphalt
  const roadsGroup = new THREE.Group();

  // Grand Avenue North-South
  const mainAsphalt = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 100), materials.asphalt);
  mainAsphalt.rotation.x = -Math.PI / 2;
  mainAsphalt.position.set(-6, 0.04, 0);
  mainAsphalt.receiveShadow = !isSoftwareGl;
  roadsGroup.add(mainAsphalt);

  // Sidewalks flanking Grand Avenue
  const swGeo = new THREE.BoxGeometry(0.8, 0.08, 100);
  const swLeft = new THREE.Mesh(swGeo, materials.sidewalk);
  swLeft.position.set(-8.5, 0.08, 0);
  swLeft.receiveShadow = !isSoftwareGl;
  roadsGroup.add(swLeft);

  const swRight = new THREE.Mesh(swGeo, materials.sidewalk);
  swRight.position.set(-3.5, 0.08, 0);
  swRight.receiveShadow = !isSoftwareGl;
  roadsGroup.add(swRight);

  // Cross Avenue East-West
  const crossAsphalt = new THREE.Mesh(new THREE.PlaneGeometry(90, 3.8), materials.asphalt);
  crossAsphalt.rotation.x = -Math.PI / 2;
  crossAsphalt.position.set(0, 0.04, 16);
  crossAsphalt.receiveShadow = !isSoftwareGl;
  roadsGroup.add(crossAsphalt);

  // Secondary grid connectors
  const gridAsphalt1 = new THREE.Mesh(new THREE.PlaneGeometry(90, 3.2), materials.asphalt);
  gridAsphalt1.rotation.x = -Math.PI / 2;
  gridAsphalt1.position.set(0, 0.04, -16);
  roadsGroup.add(gridAsphalt1);

  const gridAsphalt2 = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 100), materials.asphalt);
  gridAsphalt2.rotation.x = -Math.PI / 2;
  gridAsphalt2.position.set(16, 0.04, 0);
  roadsGroup.add(gridAsphalt2);

  // Road Markings (Crisp white/cream dashes)
  const dashGeo = new THREE.PlaneGeometry(0.18, 1.4);
  for (let i = -20; i <= 20; i++) {
    const dash = new THREE.Mesh(dashGeo, materials.roadMarking);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-6, 0.05, i * 2.8);
    roadsGroup.add(dash);
  }

  // Crosswalk zebra stripes at intersections
  for (let z = 0; z < 6; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.2), materials.roadMarking);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-7.5 + z * 0.6, 0.05, 14.5);
    roadsGroup.add(stripe);
  }

  scene.add(roadsGroup);

  // 10. Detailed Architectural Bridges
  const bridgeGroup = new THREE.Group();

  // North Arch Bridge (The Critical Demonstration Bridge)
  const deckGeo = new THREE.BoxGeometry(5.2, 0.6, 24);
  const bridgeDeck = new THREE.Mesh(deckGeo, materials.bridgeNormal);
  bridgeDeck.position.set(-6, 1.4, 1);
  bridgeDeck.rotation.y = 0.22;
  bridgeDeck.castShadow = !isSoftwareGl;
  bridgeDeck.receiveShadow = !isSoftwareGl;
  bridgeGroup.add(bridgeDeck);

  // Railings on Bridge Deck
  const railingGeo = new THREE.BoxGeometry(0.12, 0.5, 24);
  const railLeft = new THREE.Mesh(railingGeo, materials.darkMetal);
  railLeft.position.set(-2.4, 0.5, 0);
  bridgeDeck.add(railLeft);
  const railRight = new THREE.Mesh(railingGeo, materials.darkMetal);
  railRight.position.set(2.4, 0.5, 0);
  bridgeDeck.add(railRight);

  // Double Structural Arches with cross-bracing
  const bridgeArches: THREE.Mesh[] = [];
  const archGeo = new THREE.TorusGeometry(9.2, 0.26, 8, 32, Math.PI);
  const archMat = materials.sageGreen;

  const arch1 = new THREE.Mesh(archGeo, archMat);
  arch1.rotation.y = Math.PI / 2 + 0.22;
  arch1.position.set(-8.4, 0.9, 1);
  bridgeGroup.add(arch1);
  bridgeArches.push(arch1);

  const arch2 = new THREE.Mesh(archGeo, archMat);
  arch2.rotation.y = Math.PI / 2 + 0.22;
  arch2.position.set(-3.6, 0.9, 1);
  bridgeGroup.add(arch2);
  bridgeArches.push(arch2);

  // Heavy concrete piers in the water
  const pierGeo = new THREE.BoxGeometry(1.4, 2.8, 4.0);
  const pier1 = new THREE.Mesh(pierGeo, materials.naturalConcrete);
  pier1.position.set(-6, 0.2, 1);
  pier1.rotation.y = 0.22;
  pier1.castShadow = !isSoftwareGl;
  bridgeGroup.add(pier1);

  // Roadblock barricades (appear when bridge is severed)
  const roadblocksGroup = new THREE.Group();
  const barrierGeo = new THREE.BoxGeometry(4.8, 0.8, 0.3);
  const barrierNorth = new THREE.Mesh(barrierGeo, materials.bridgeSevered);
  barrierNorth.position.set(-6, 1.8, 12);
  barrierNorth.rotation.y = 0.22;
  roadblocksGroup.add(barrierNorth);

  const barrierSouth = new THREE.Mesh(barrierGeo, materials.bridgeSevered);
  barrierSouth.position.set(-6, 1.8, -10);
  barrierSouth.rotation.y = 0.22;
  roadblocksGroup.add(barrierSouth);

  bridgeGroup.add(roadblocksGroup);
  roadblocksGroup.visible = false;

  scene.add(bridgeGroup);

  // South Causeway Viaduct (Elevation corridor for evacuation detour)
  const southCauseway = new THREE.Group();
  const causewayDeck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.6, 22), materials.bridgeNormal);
  causewayDeck.position.set(14, 1.2, -4);
  causewayDeck.rotation.y = 0.22;
  causewayDeck.castShadow = !isSoftwareGl;
  southCauseway.add(causewayDeck);

  for (let p = -8; p <= 8; p += 8) {
    const cpier = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 2.2, 12), materials.naturalConcrete);
    cpier.position.set(14 + p * 0.22, 0.1, -4 + p);
    southCauseway.add(cpier);
  }
  scene.add(southCauseway);

  // 11. Architectural Buildings with Rich Silhouettes
  const buildings: BuildingData[] = [];

  const buildingBlueprints = [
    // Commercial Towers (Downtown Core)
    { id: 'b1', name: 'Centennial Tower & Meridian Exchange', x: -15, z: 6, w: 5.6, d: 5.6, h: 22, type: 'commercial' as const, mat: materials.slateRoof, hasSpire: true },
    { id: 'b2', name: 'International Trade Pavilion', x: -16, z: -5, w: 5.0, d: 5.0, h: 16, type: 'commercial' as const, mat: materials.warmLimestone },
    { id: 'b3', name: 'Financial Core Highrise', x: -22, z: 8, w: 4.8, d: 4.8, h: 14, type: 'commercial' as const, mat: materials.naturalConcrete },
    { id: 'b4', name: 'Maritime Logistics HQ', x: -22, z: -3, w: 4.6, d: 4.6, h: 13, type: 'commercial' as const, mat: materials.warmWhite },

    // Medical & Civic Campus
    { id: 'b5', name: 'St. Jude Metropolitan Trauma Hospital', x: -14, z: 22, w: 6.2, d: 7.0, h: 10, type: 'hospital' as const, mat: materials.warmWhite, isHospital: true },
    { id: 'b6', name: 'Municipal Civic Council Hall', x: -15, z: -22, w: 5.8, d: 5.8, h: 9, type: 'civic' as const, mat: materials.warmLimestone },

    // North Pier Residential Sector
    { id: 'b7', name: 'North Riverfront Promenade Condos', x: -6, z: 26, w: 4.5, d: 4.5, h: 13, type: 'residential' as const, mat: materials.slateRoof },
    { id: 'b8', name: 'Riverside Esplanade Apartments', x: 2, z: 24, w: 5.2, d: 4.5, h: 11, type: 'residential' as const, mat: materials.warmLimestone },
    { id: 'b9', name: 'Harbor Terrace Residential Complex', x: 8, z: 27, w: 4.8, d: 5.2, h: 9, type: 'residential' as const, mat: materials.naturalConcrete },

    // Eastern Lowlands (Vulnerable Inundation District)
    { id: 'b10', name: 'Eastside Residential Complex Alpha', x: 8, z: 6, w: 5.0, d: 5.0, h: 7.5, type: 'residential' as const, mat: materials.warmWhite },
    { id: 'b11', name: 'Eastside Residential Complex Beta', x: 18, z: 8, w: 4.8, d: 4.8, h: 6.8, type: 'residential' as const, mat: materials.warmLimestone },
    { id: 'b12', name: 'Marina Court Waterfront Condos', x: 24, z: 6, w: 5.4, d: 4.4, h: 6.0, type: 'residential' as const, mat: materials.naturalConcrete },
    { id: 'b13', name: 'Riverbend Community Blocks', x: 20, z: -4, w: 4.8, d: 4.8, h: 7.0, type: 'residential' as const, mat: materials.slateRoof },
    { id: 'b14', name: 'Industrial Pier Logistics Warehouses', x: 26, z: -2, w: 5.2, d: 4.6, h: 5.5, type: 'commercial' as const, mat: materials.naturalConcrete },

    // Southern High-Ground Safe Sector (Shelters)
    { id: 'b15', name: 'Southport Civic Emergency Shelter', x: -4, z: -24, w: 6.8, d: 7.8, h: 8.5, type: 'shelter' as const, mat: materials.sageGreen, isShelter: true },
    { id: 'b16', name: 'Pine Hill Community Refuge', x: 6, z: -24, w: 5.5, d: 5.0, h: 8.0, type: 'shelter' as const, mat: materials.warmLimestone, isShelter: true },
    { id: 'b17', name: 'Pine Hill Heights Apartments', x: 14, z: -22, w: 4.6, d: 4.6, h: 8.5, type: 'residential' as const, mat: materials.slateRoof },

    // Outer Infill Buildings
    { id: 'b18', name: 'West End Quarter Building 1', x: -24, z: 18, w: 4.4, d: 4.4, h: 8, type: 'residential' as const, mat: materials.warmLimestone },
    { id: 'b19', name: 'West End Quarter Building 2', x: -24, z: 27, w: 4.4, d: 4.4, h: 7, type: 'residential' as const, mat: materials.naturalConcrete },
    { id: 'b20', name: 'South Gate Retail Pavilion', x: -14, z: -14, w: 4.6, d: 4.6, h: 8.5, type: 'commercial' as const, mat: materials.warmWhite },
    { id: 'b21', name: 'Transit Interchange Block', x: 2, z: -12, w: 4.4, d: 4.4, h: 7.5, type: 'commercial' as const, mat: materials.slateRoof }
  ];

  buildingBlueprints.forEach((bp) => {
    const group = new THREE.Group();
    group.position.set(bp.x, 0, bp.z);

    // 1. Podium Base (Ground Floor Lobby with Glass Recess)
    const podiumH = 1.2;
    const podiumGeo = new THREE.BoxGeometry(bp.w + 0.4, podiumH, bp.d + 0.4);
    const podiumMesh = new THREE.Mesh(podiumGeo, materials.naturalConcrete);
    podiumMesh.position.y = podiumH / 2;
    podiumMesh.castShadow = !isSoftwareGl;
    podiumMesh.receiveShadow = !isSoftwareGl;
    group.add(podiumMesh);

    // Recessed dark glass entrance band
    const entranceGeo = new THREE.BoxGeometry(bp.w + 0.42, 0.5, bp.d + 0.42);
    const entranceMesh = new THREE.Mesh(entranceGeo, materials.glass);
    entranceMesh.position.y = podiumH * 0.45;
    group.add(entranceMesh);

    // 2. Main Building Tower Body
    const bodyH = bp.h - podiumH - 1.5;
    const bodyGeo = new THREE.BoxGeometry(bp.w, bodyH, bp.d);
    const bodyMesh = new THREE.Mesh(bodyGeo, bp.mat);
    bodyMesh.position.y = podiumH + bodyH / 2;
    bodyMesh.castShadow = !isSoftwareGl;
    bodyMesh.receiveShadow = !isSoftwareGl;
    group.add(bodyMesh);

    // Architectural Window Band Slices (Floor divisions)
    const floors = Math.floor(bodyH / 1.8);
    for (let f = 1; f < floors; f++) {
      const bandGeo = new THREE.BoxGeometry(bp.w + 0.04, 0.45, bp.d + 0.04);
      const bandMesh = new THREE.Mesh(bandGeo, materials.glass);
      bandMesh.position.y = podiumH + f * 1.8;
      group.add(bandMesh);
    }

    // 3. Setback Crown & Rooftop Equipment
    const crownH = 1.5;
    const crownGeo = new THREE.BoxGeometry(bp.w * 0.72, crownH, bp.d * 0.72);
    const crownMesh = new THREE.Mesh(crownGeo, materials.slateRoof);
    crownMesh.position.y = bp.h - crownH / 2;
    crownMesh.castShadow = !isSoftwareGl;
    group.add(crownMesh);

    // Rooftop HVAC boxes & water tanks
    const hvacGeo = new THREE.BoxGeometry(bp.w * 0.35, 0.6, bp.d * 0.35);
    const hvacMesh = new THREE.Mesh(hvacGeo, materials.darkMetal);
    hvacMesh.position.y = bp.h + 0.3;
    group.add(hvacMesh);

    // Spire / Antenna on Centennial Tower
    if (bp.hasSpire) {
      const spireGeo = new THREE.CylinderGeometry(0.08, 0.18, 4.2, 8);
      const spireMesh = new THREE.Mesh(spireGeo, materials.darkMetal);
      spireMesh.position.y = bp.h + 2.7;
      group.add(spireMesh);
    }

    // Hospital Helipad marking
    if (bp.isHospital) {
      const padGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.12, 24);
      const padMat = new THREE.MeshBasicMaterial({ color: 0xC47A60 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.y = bp.h + 0.06;
      group.add(pad);
    }

    // Shelter Green Marker Badge on roof
    if (bp.isShelter) {
      const shelterRoof = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 16), materials.sageGreen);
      shelterRoof.position.y = bp.h + 0.06;
      group.add(shelterRoof);
    }

    scene.add(group);

    buildings.push({
      id: bp.id,
      name: bp.name,
      type: bp.type,
      height: bp.h,
      position: new THREE.Vector3(bp.x, bp.h / 2, bp.z),
      group,
      primaryMesh: bodyMesh
    });
  });

  // 12. Stylized Architectural Trees (Instanced Foliage)
  const treeCount = 64;
  const treeTrunkGeo = new THREE.CylinderGeometry(0.14, 0.20, 1.4, 6);
  const treeCanopyGeo = new THREE.ConeGeometry(1.1, 2.4, 7);

  const trunkInst = new THREE.InstancedMesh(treeTrunkGeo, materials.darkMetal, treeCount);
  const canopyInst = new THREE.InstancedMesh(treeCanopyGeo, materials.sageGreen, treeCount);
  trunkInst.castShadow = !isSoftwareGl;
  canopyInst.castShadow = !isSoftwareGl;

  const dummy = new THREE.Object3D();
  let validTrees = 0;
  for (let i = 0; i < treeCount; i++) {
    const side = (i % 2 === 0 ? 1 : -1);
    const tx = (side * 10) + ((i * 4.1) % 22 - 11);
    const tz = ((i * 5.7) % 70) - 35;

    // Keep river clear
    if (Math.abs(tz - tx * 0.22) < 10) continue;

    dummy.position.set(tx, 0.7, tz);
    dummy.scale.setScalar(0.75 + (i % 4) * 0.12);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(validTrees, dummy.matrix);

    dummy.position.set(tx, 2.1, tz);
    dummy.updateMatrix();
    canopyInst.setMatrixAt(validTrees, dummy.matrix);
    validTrees++;
  }
  trunkInst.count = validTrees;
  canopyInst.count = validTrees;
  trunkInst.instanceMatrix.needsUpdate = true;
  canopyInst.instanceMatrix.needsUpdate = true;
  scene.add(trunkInst);
  scene.add(canopyInst);

  // 13. Spatial Network Graph Overlay (Nodes & Edges)
  const networkGroup = new THREE.Group();

  const networkNodes = [
    { id: 'n1', pos: new THREE.Vector3(-6, 1.2, 6), color: 0x74866C }, // Central Hub
    { id: 'n2', pos: new THREE.Vector3(-14, 1.2, 22), color: 0x74866C }, // Hospital
    { id: 'n3', pos: new THREE.Vector3(-6, 2.0, 1), color: 0xC47A60 }, // North Bridge Link
    { id: 'n4', pos: new THREE.Vector3(14, 1.2, 8), color: 0xD6A15C }, // Eastside Isolated
    { id: 'n5', pos: new THREE.Vector3(-4, 1.2, -24), color: 0x526A55 }, // Southport Shelter
    { id: 'n6', pos: new THREE.Vector3(14, 1.6, -4), color: 0x74866C }  // South Causeway
  ];

  const nodeGeo = new THREE.SphereGeometry(0.7, 16, 16);
  networkNodes.forEach(nn => {
    const nMat = new THREE.MeshBasicMaterial({ color: nn.color });
    const nMesh = new THREE.Mesh(nodeGeo, nMat);
    nMesh.position.copy(nn.pos);
    networkGroup.add(nMesh);
  });

  // Edge lines
  const edgeConnections = [
    [0, 1], // Central -> Hospital
    [0, 2], // Central -> Bridge
    [2, 3], // Bridge -> Eastside (The severed link)
    [0, 4], // Central -> Shelter
    [4, 5], // Shelter -> Causeway
    [5, 3]  // Causeway -> Eastside (Detour link)
  ];

  const edgeLineMatNormal = new THREE.LineBasicMaterial({ color: 0x74866C, linewidth: 3, transparent: true, opacity: 0.90 });
  const edgeLineMatSevered = new THREE.LineDashedMaterial({ color: 0xC47A60, dashSize: 0.8, gapSize: 0.4, linewidth: 3 });

  edgeConnections.forEach((conn, idx) => {
    const p1 = networkNodes[conn[0]].pos;
    const p2 = networkNodes[conn[1]].pos;
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const isSeveredLink = (idx === 2);
    const lineMat = isSeveredLink ? edgeLineMatSevered : edgeLineMatNormal;
    const line = new THREE.Line(geom, lineMat);
    if (isSeveredLink) line.computeLineDistances();
    networkGroup.add(line);
  });

  scene.add(networkGroup);
  networkGroup.visible = false;

  // 14. Animated Pathfinder Route Tube (Draws along safe alternative path)
  const routeGroup = new THREE.Group();
  const routePathPoints = [
    new THREE.Vector3(14, 1.2, 8),   // Eastside
    new THREE.Vector3(14, 1.2, 1),
    new THREE.Vector3(14, 1.6, -4),  // South Causeway
    new THREE.Vector3(4, 1.2, -16),
    new THREE.Vector3(-4, 1.2, -24)  // Southport Shelter
  ];
  const routeCurve = new THREE.CatmullRomCurve3(routePathPoints);
  const routeTubeGeo = new THREE.TubeGeometry(routeCurve, 64, 0.32, 8, false);
  const routeMaterial = new THREE.MeshStandardMaterial({
    color: 0x315E77,
    emissive: 0x527E91,
    roughness: 0.2,
    metalness: 0.4
  });
  const routeTube = new THREE.Mesh(routeTubeGeo, routeMaterial);
  routeGroup.add(routeTube);
  scene.add(routeGroup);
  routeGroup.visible = false;

  // 15. Real-Time Render Loop
  let animId: number;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    waterMaterial.uniforms.uTime.value = elapsedTime;
    floodMaterial.uniforms.uTime.value = elapsedTime;
    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  function onResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  return {
    scene,
    camera,
    renderer,
    buildings,
    waterMesh,
    waterMaterial,
    floodMesh,
    floodMaterial,
    bridgeGroup,
    bridgeDeck,
    bridgeArches,
    roadblocksGroup,
    networkGroup,
    routeGroup,
    routeTube,
    routeMaterial,

    updateFlood: (progress: number) => {
      // Progress 0.0 to 1.0: Physically raise river and expand lowlands inundation
      const floodHeight = 0.16 + progress * 2.05;
      floodMesh.position.y = floodHeight;
      floodMaterial.uniforms.uOpacity.value = Math.min(0.88, progress * 0.95);
      waterMesh.position.y = 0.14 + progress * 0.85;
    },

    setBridgeState: (severed: boolean) => {
      bridgeDeck.material = severed ? materials.bridgeSevered : materials.bridgeNormal;
      roadblocksGroup.visible = severed;
      bridgeArches.forEach(arch => {
        arch.material = severed ? materials.bridgeSevered : materials.sageGreen;
      });
    },

    setNetworkVisibility: (visible: boolean) => {
      networkGroup.visible = visible;
    },

    setRouteProgress: (progress: number) => {
      routeGroup.visible = progress > 0.01;
      const s = Math.max(0.01, Math.min(1.0, progress));
      routeGroup.scale.set(s, s, s);
    },

    dispose: () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      groundGeo.dispose();
      riverGeo.dispose();
      floodGeo.dispose();
      waterMaterial.dispose();
      floodMaterial.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };
}
