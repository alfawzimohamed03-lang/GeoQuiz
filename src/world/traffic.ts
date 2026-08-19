import * as THREE from 'three';
import { buildCarMesh } from './carFactory';
import { CAR_CLASSES } from './types';
import { laneCenterX, isOncomingLane, ROAD_LEFT, ROAD_RIGHT } from './cityTrack';
import { randomRange, pick } from './utils';

export type ObstacleSubtype = 'pothole' | 'speed_bump' | 'debris' | 'animal' | 'cone';

export interface WorldEntity {
  kind: 'traffic' | 'obstacle';
  subtype: string;
  mesh: THREE.Group;
  x: number;
  z: number; // rendered Z, relative to player (player is fixed at z=0)
  width: number;
  length: number;
  forwardSpeed: number; // own speed magnitude (m/s)
  oncoming: boolean;
  lane: number;
  hit: boolean;
  scored: boolean;
  driftVx: number;
  damage: number;
  speedPenalty: number;
}

const TRAFFIC_CLASSES = CAR_CLASSES.filter((c) => c.id !== 'supercar');
const TRAFFIC_COLORS = ['#c94f4f', '#3f6fb0', '#e0e0e0', '#3a3a3a', '#4c6b45', '#e3b23c', '#2f9e6e'];

export function spawnTraffic(scene: THREE.Scene, lane: number, speed: number, spawnZ: number): WorldEntity {
  const cls = pick(TRAFFIC_CLASSES);
  const color = pick(TRAFFIC_COLORS);
  const mesh = buildCarMesh(cls, color);
  const oncoming = isOncomingLane(lane);
  if (oncoming) mesh.rotation.y = Math.PI;

  const x = laneCenterX(lane) + randomRange(-0.4, 0.4);
  mesh.position.set(x, 0, spawnZ);
  scene.add(mesh);

  return {
    kind: 'traffic',
    subtype: cls.id,
    mesh,
    x,
    z: spawnZ,
    width: cls.bodyWidth,
    length: cls.bodyLength,
    forwardSpeed: speed,
    oncoming,
    lane,
    hit: false,
    scored: false,
    driftVx: 0,
    damage: cls.id === 'suv' ? 30 : 24,
    speedPenalty: 9,
  };
}

const OBSTACLE_POOL: ObstacleSubtype[] = ['pothole', 'speed_bump', 'debris', 'cone', 'animal'];

function buildObstacleMesh(subtype: ObstacleSubtype): { mesh: THREE.Group; width: number; length: number } {
  const group = new THREE.Group();
  let width = 1;
  let length = 1;

  switch (subtype) {
    case 'pothole': {
      width = 1.3;
      length = 1.1;
      const geo = new THREE.CylinderGeometry(0.65, 0.6, 0.05, 12);
      const mat = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.02;
      group.add(mesh);
      break;
    }
    case 'speed_bump': {
      width = 3.2;
      length = 0.5;
      const geo = new THREE.CylinderGeometry(0.15, 0.15, 3.2, 10);
      const mat = new THREE.MeshStandardMaterial({ color: '#e3b23c', roughness: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.y = 0.1;
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }
    case 'debris': {
      width = 0.9;
      length = 0.9;
      const geo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
      const mat = new THREE.MeshStandardMaterial({ color: '#5c5044', roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.2;
      mesh.rotation.y = randomRange(0, Math.PI);
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }
    case 'cone': {
      width = 0.5;
      length = 0.5;
      const geo = new THREE.ConeGeometry(0.28, 0.7, 10);
      const mat = new THREE.MeshStandardMaterial({ color: '#d9622b', roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.35;
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }
    case 'animal': {
      width = 0.6;
      length = 1.1;
      const bodyGeo = new THREE.CapsuleGeometry(0.22, 0.6, 4, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: '#8a6b45', roughness: 0.9 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.42;
      body.castShadow = true;
      group.add(body);
      const legMat = new THREE.MeshStandardMaterial({ color: '#5c4632' });
      for (const dx of [-0.35, 0.05]) {
        for (const dz of [-0.15, 0.15]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), legMat);
          leg.position.set(dz, 0.2, dx);
          group.add(leg);
        }
      }
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), bodyMat);
      head.position.set(0, 0.55, -0.55);
      group.add(head);
      break;
    }
  }

  return { mesh: group, width, length };
}

export function spawnObstacle(scene: THREE.Scene, lane: number, spawnZ: number): WorldEntity {
  const subtype = pick(OBSTACLE_POOL);
  const { mesh, width, length } = buildObstacleMesh(subtype);
  const x = laneCenterX(lane);
  mesh.position.x = x;
  mesh.position.z = spawnZ;
  scene.add(mesh);

  const damageBySubtype: Record<ObstacleSubtype, number> = {
    pothole: 8,
    speed_bump: 5,
    debris: 14,
    cone: 6,
    animal: 20,
  };
  const speedPenaltyBySubtype: Record<ObstacleSubtype, number> = {
    pothole: 8,
    speed_bump: 11,
    debris: 9,
    cone: 6,
    animal: 12,
  };

  return {
    kind: 'obstacle',
    subtype,
    mesh,
    x,
    z: spawnZ,
    width,
    length,
    forwardSpeed: 0,
    oncoming: false,
    lane,
    hit: false,
    scored: true,
    driftVx: subtype === 'animal' ? randomRange(0.6, 1.1) * (Math.random() < 0.5 ? -1 : 1) : 0,
    damage: damageBySubtype[subtype],
    speedPenalty: speedPenaltyBySubtype[subtype],
  };
}

export function updateEntity(e: WorldEntity, playerSpeed: number, dt: number) {
  const relativeSpeed = e.oncoming ? playerSpeed + e.forwardSpeed : playerSpeed - e.forwardSpeed;
  e.z += relativeSpeed * dt;
  if (e.driftVx !== 0) {
    e.x += e.driftVx * dt;
    if (e.x < ROAD_LEFT + e.width / 2 || e.x > ROAD_RIGHT - e.width / 2) {
      e.driftVx *= -1;
      e.x = THREE.MathUtils.clamp(e.x, ROAD_LEFT + e.width / 2, ROAD_RIGHT - e.width / 2);
    }
  }
  e.mesh.position.set(e.x, e.mesh.position.y, e.z);
}

export function disposeEntity(scene: THREE.Scene, e: WorldEntity) {
  scene.remove(e.mesh);
  e.mesh.traverse((obj: THREE.Object3D) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const mat = obj.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    }
  });
}
