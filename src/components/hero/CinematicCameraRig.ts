import * as THREE from 'three';

// 7 Keyframe Waypoints across the 650vh cinematic sequence
const CAMERA_POSITIONS = [
  new THREE.Vector3(54, 46, 56),    // 0.00: Establishing Shot - Wide panoramic view
  new THREE.Vector3(34, 26, 38),    // 0.12: Moving forward & establishing architectural scale
  new THREE.Vector3(14, 8.5, 20),   // 0.25: Descent into street canyons, foreground framing
  new THREE.Vector3(-7, 4.2, 14),   // 0.40: Low riverbank oblique shot showing water rise
  new THREE.Vector3(-4.2, 2.8, 6.0),// 0.55: Dramatic close-up on severed North Arch Bridge
  new THREE.Vector3(0, 44, 14),     // 0.72: High-angle spatial network graph overview
  new THREE.Vector3(16, 12, -8),    // 0.86: Tracking South Causeway detour evacuation corridor
  new THREE.Vector3(42, 34, 44)     // 1.00: Grand final reveal - full digital twin composition
];

const LOOKAT_TARGETS = [
  new THREE.Vector3(0, 2, 0),       // 0.00: Central city basin
  new THREE.Vector3(-1, 2.5, 1),    // 0.12: Downtown approach
  new THREE.Vector3(-2, 2.0, 2),    // 0.25: Street corridor level
  new THREE.Vector3(-1, 1.4, 2),    // 0.40: River surface & waterline
  new THREE.Vector3(-6, 1.4, 1),    // 0.55: North Arch Bridge deck
  new THREE.Vector3(0, 0, 0),       // 0.72: City center network origin
  new THREE.Vector3(4, 2, -14),     // 0.86: South Causeway & Southport Shelter
  new THREE.Vector3(0, 2, 0)        // 1.00: Full urban landscape
];

const FOV_KEYFRAMES = [
  34, // 0.00
  38, // 0.12
  44, // 0.25: Wider for dramatic street canyon perspective
  40, // 0.40
  35, // 0.55: Telephoto focus on bridge
  46, // 0.72: Wide spatial graph
  38, // 0.86
  36  // 1.00
];

// Continuous Catmull-Rom Splines for silky-smooth cinematic camera flight
export const cameraPathSpline = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, 'catmullrom', 0.5);
export const lookAtSpline = new THREE.CatmullRomCurve3(LOOKAT_TARGETS, false, 'catmullrom', 0.5);

export function interpolateCinematicCamera(
  camera: THREE.PerspectiveCamera,
  progress: number, // 0.0 to 1.0
  targetOut: THREE.Vector3
) {
  const p = Math.max(0, Math.min(1, progress));

  // Sample Catmull-Rom spline curves for position and target
  cameraPathSpline.getPointAt(p, camera.position);
  lookAtSpline.getPointAt(p, targetOut);

  // Interpolate FOV smoothly across keyframes
  const segmentCount = FOV_KEYFRAMES.length - 1;
  const rawIdx = p * segmentCount;
  const idx = Math.min(Math.floor(rawIdx), segmentCount - 1);
  const t = rawIdx - idx;
  const easeT = t * t * (3 - 2 * t);
  camera.fov = THREE.MathUtils.lerp(FOV_KEYFRAMES[idx], FOV_KEYFRAMES[idx + 1], easeT);

  camera.updateProjectionMatrix();
  camera.lookAt(targetOut);
}
