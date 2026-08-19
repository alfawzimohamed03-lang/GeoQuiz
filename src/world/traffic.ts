import * as THREE from 'three';
import { buildCarMesh } from './carFactory';
import { CAR_CLASSES } from './types';
import type { LevelConfig, LevelId } from './types';
import { laneCenterX, isOncomingLane, ROAD_LEFT, ROAD_RIGHT } from './track';
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

const OBSTACLE_POOL_BY_LEVEL: Record<LevelId, ObstacleSubtype[]> = {
  street_city: ['pothole', 'speed_bump', 'cone', 'debris'],
  desert_tenere: ['pothole', 'debris', 'animal', 'animal'],
  forest_savanna: ['pothole', 'debris', 'animal', 'animal'],
  village_road: ['pothole', 'speed_bump', 'animal', 'debris'],
};

interface AnimalSpec {
  bodyColor: string;
  legColor: string;
  bodyRadius: number;
  bodyLength: number;
  bodyHeight: number;
  hasHump: boolean;
}

const ANIMAL_BY_LEVEL: Record<LevelId, AnimalSpec> = {
  street_city: { bodyColor: '#8a6b45', legColor: '#5c4632', bodyRadius: 0.22, bodyLength: 0.6, bodyHeight: 0.42, hasHump: false },
  village_road: { bodyColor: '#d8d0c0', legColor: '#3a3a3a', bodyRadius: 0.2, bodyLength: 0.55, bodyHeight: 0.4, hasHump: false },
  forest_savanna: { bodyColor: '#c9a06a', legColor: '#8a6b45', bodyRadius: 0.17, bodyLength: 0.6, bodyHeight: 0.55, hasHump: false },
  desert_tenere: { bodyColor: '#c9a06a', legColor: '#9c7a4e', bodyRadius: 0.3, bodyLength: 1.0, bodyHeight: 0.95, hasHump: true },
};

function buildAnimalMesh(level: LevelId): { mesh: THREE.Group; width: number; length: number } {
  const spec = ANIMAL_BY_LEVEL[level];
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: spec.bodyColor, roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(spec.bodyRadius, spec.bodyLength, 4, 8), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = spec.bodyHeight;
  body.castShadow = true;
  group.add(body);

  if (spec.hasHump) {
    const hump = new THREE.Mesh(new THREE.SphereGeometry(spec.bodyRadius * 0.9, 8, 8), bodyMat);
    hump.position.set(0, spec.bodyHeight + spec.bodyRadius * 0.7, 0);
    group.add(hump);
  }

  const legMat = new THREE.MeshStandardMaterial({ color: spec.legColor });
  const legLength = spec.bodyHeight * 0.75;
  for (const dx of [-spec.bodyLength * 0.55, spec.bodyLength * 0.15]) {
    for (const dz of [-spec.bodyRadius * 1.3, spec.bodyRadius * 1.3]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, legLength, 6), legMat);
      leg.position.set(dz, legLength / 2, dx);
      group.add(leg);
    }
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(spec.bodyRadius * 0.7, 8, 8), bodyMat);
  head.position.set(0, spec.bodyHeight + (spec.hasHump ? spec.bodyRadius * 0.3 : 0.1), -spec.bodyLength * 0.85);
  group.add(head);

  const width = spec.bodyRadius * 2.6;
  const length = spec.bodyLength + spec.bodyRadius * 2;
  return { mesh: group, width, length };
}

function buildObstacleMesh(subtype: ObstacleSubtype, levelId: LevelId): { mesh: THREE.Group; width: number; length: number } {
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
      const animal = buildAnimalMesh(levelId);
      group.add(animal.mesh);
      width = animal.width;
      length = animal.length;
      break;
    }
  }

  return { mesh: group, width, length };
}

export function spawnObstacle(scene: THREE.Scene, level: LevelConfig, lane: number, spawnZ: number): WorldEntity {
  const pool = OBSTACLE_POOL_BY_LEVEL[level.id];
  const subtype = pick(pool);
  const { mesh, width, length } = buildObstacleMesh(subtype, level.id);
  const x = laneCenterX(lane);
  mesh.position.x = x;
  mesh.position.z = spawnZ;
  scene.add(mesh);

  const damageBySubtype: Record<ObstacleSubtype, number> = {
    pothole: 8,
    speed_bump: 5,
    debris: 14,
    cone: 6,
    animal: level.id === 'desert_tenere' ? 26 : 18,
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
