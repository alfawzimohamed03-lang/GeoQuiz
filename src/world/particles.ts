import * as THREE from 'three';

export interface ParticleSystem {
  points: THREE.Points;
  velocities: Float32Array;
  bounds: { x: number; yMin: number; yMax: number; zNear: number; zFar: number };
}

function buildSoftDotTexture(): THREE.CanvasTexture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

let sharedDotTexture: THREE.CanvasTexture | null = null;

export function buildDustParticles(color: string, count = 140): ParticleSystem {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const bounds = { x: 34, yMin: 0.3, yMax: 9, zNear: 25, zFar: -190 };

  for (let i = 0; i < count; i++) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(bounds.x * 2);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(bounds.yMin, bounds.yMax);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(bounds.zFar, bounds.zNear);
    velocities[i * 3] = THREE.MathUtils.randFloatSpread(0.4);
    velocities[i * 3 + 1] = THREE.MathUtils.randFloat(0.05, 0.25);
    velocities[i * 3 + 2] = THREE.MathUtils.randFloat(0.2, 0.6);
  }

  if (!sharedDotTexture) sharedDotTexture = buildSoftDotTexture();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    map: sharedDotTexture,
    alphaMap: sharedDotTexture,
    size: 0.3,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, velocities, bounds };
}

export function updateDustParticles(system: ParticleSystem, playerSpeed: number, dt: number) {
  const pos = system.points.geometry.attributes.position as THREE.BufferAttribute;
  const { velocities, bounds } = system;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) + velocities[i * 3] * dt;
    let y = pos.getY(i) + velocities[i * 3 + 1] * dt;
    let z = pos.getZ(i) + (playerSpeed + velocities[i * 3 + 2]) * dt;

    if (z > bounds.zNear) z = bounds.zFar;
    if (y > bounds.yMax) y = bounds.yMin;
    if (x > bounds.x) x = -bounds.x;
    else if (x < -bounds.x) x = bounds.x;

    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
}

export function disposeDustParticles(system: ParticleSystem) {
  system.points.geometry.dispose();
  (system.points.material as THREE.Material).dispose();
}
