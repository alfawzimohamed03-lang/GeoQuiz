import * as THREE from 'three';
import type { LevelConfig, PilotConfig } from './types';
import { ROAD_HALF_WIDTH, SIDEWALK_WIDTH, TILE_LENGTH } from './track';
import { buildPilotBust } from './carFactory';
import { fbm2D, ridgedNoise2D } from './noise';
import { randomRange, pick } from './utils';

const TERRAIN_WIDTH = 40;
const TERRAIN_SEGMENTS_X = 10;
const TERRAIN_SEGMENTS_Z = 8;

/**
 * A roadside terrain patch (dunes/hills) that scrolls with its tile. Sampling noise using the
 * tile's actual world-relative Z keeps adjacent tiles seamless (see track.ts tile pooling).
 */
function buildTerrainPatch(level: LevelConfig, side: -1 | 1, tileZ: number): THREE.Mesh {
  const innerEdge = side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH);
  const geo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TILE_LENGTH, TERRAIN_SEGMENTS_X, TERRAIN_SEGMENTS_Z);
  const pos = geo.attributes.position;
  const colors: number[] = [];
  const baseColor = new THREE.Color(level.groundColor);
  const noiseFn = level.terrainStyle === 'dunes' ? ridgedNoise2D : fbm2D;
  const noiseScale = level.terrainStyle === 'dunes' ? 0.045 : 0.07;

  for (let i = 0; i < pos.count; i++) {
    const localX = pos.getX(i); // -TERRAIN_WIDTH/2 .. TERRAIN_WIDTH/2
    const localY = pos.getY(i); // -TILE_LENGTH/2 .. TILE_LENGTH/2 (pre-rotation "depth")
    const worldX = innerEdge + side * (localX + TERRAIN_WIDTH / 2);
    // PlaneGeometry's local Y becomes world Z as (-localY) once rotated -90deg on X below;
    // sampling noise with that same true world Z keeps adjacent recycled tiles seamless.
    const worldZ = tileZ - localY;

    const distFromRoad = Math.abs(worldX - side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH));
    const falloff = THREE.MathUtils.smoothstep(distFromRoad, 0, 6);
    const n = noiseFn(worldX * noiseScale, worldZ * noiseScale, 4);
    const height = n * level.terrainAmplitude * falloff;

    pos.setZ(i, height); // local Z maps to world Y (height) after the -90deg X rotation below

    const shade = 0.85 + fbm2D(worldX * 0.15, worldZ * 0.15, 2) * 0.3;
    const c = baseColor.clone().multiplyScalar(shade);
    colors.push(c.r, c.g, c.b);
  }
  geo.computeVertexNormals();
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(innerEdge + side * (TERRAIN_WIDTH / 2), -0.05, 0);
  mesh.receiveShadow = true;
  return mesh;
}

function addTerrainBothSides(group: THREE.Group, level: LevelConfig, tileZ: number) {
  if (level.terrainStyle === 'flat') return;
  group.add(buildTerrainPatch(level, -1, tileZ));
  group.add(buildTerrainPatch(level, 1, tileZ));
}

// ---------------------------------------------------------------------------
// City (kept here for a single source of truth on the tile-populate contract)
// ---------------------------------------------------------------------------

const BUILDING_PALETTE = ['#5b5f6b', '#4a4e58', '#6b5f52', '#55606b', '#4f4437', '#3f4a55'];

export function populateCityTile(group: THREE.Group, _tileZ: number) {
  for (const side of [-1, 1] as const) {
    const baseX = side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH);
    const count = 1 + Math.floor(Math.random() * 2);
    let cursorZ = -TILE_LENGTH / 2;

    for (let i = 0; i < count; i++) {
      const depth = 6 + Math.random() * 8;
      const width = 6 + Math.random() * 10;
      const height = 6 + Math.random() * 26;

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
          color: BUILDING_PALETTE[Math.floor(Math.random() * BUILDING_PALETTE.length)],
          roughness: 0.85,
        }),
      );
      building.position.set(baseX + side * (width / 2 + 1), height / 2, cursorZ + depth / 2);
      building.castShadow = true;
      building.receiveShadow = true;
      group.add(building);

      const lit = Math.random() > 0.35;
      const windowPane = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.72, height * 0.72),
        new THREE.MeshStandardMaterial({
          color: lit ? '#ffdf90' : '#1c2230',
          emissive: lit ? '#ffb347' : '#000000',
          emissiveIntensity: lit ? 0.55 : 0,
          roughness: 0.6,
        }),
      );
      windowPane.position.set(building.position.x - side * (width / 2 + 0.03), height / 2, building.position.z);
      windowPane.rotation.y = -side * (Math.PI / 2);
      group.add(windowPane);

      cursorZ += depth + 2 + Math.random() * 4;
      if (cursorZ > TILE_LENGTH / 2) break;
    }

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 4.2, 6),
      new THREE.MeshStandardMaterial({ color: '#2a2a2a' }),
    );
    pole.position.set(baseX - side * 0.4, 2.1, -TILE_LENGTH / 2 + 4);
    group.add(pole);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#fff3c9', emissive: '#ffdf80', emissiveIntensity: 1.6 }),
    );
    lamp.position.set(pole.position.x, 4.2, pole.position.z);
    group.add(lamp);
  }
}

// ---------------------------------------------------------------------------
// Desert du Ténéré
// ---------------------------------------------------------------------------

function buildRock(scale: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(scale, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const jitter = 1 + (Math.random() - 0.5) * 0.3;
    pos.setXYZ(i, pos.getX(i) * jitter, pos.getY(i) * jitter * 0.7, pos.getZ(i) * jitter);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: '#8a6b52', roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildPalmTree(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 3.6, 6),
    new THREE.MeshStandardMaterial({ color: '#8a6b45', roughness: 0.9 }),
  );
  trunk.position.y = 1.8;
  trunk.rotation.z = randomRange(-0.08, 0.08);
  trunk.castShadow = true;
  group.add(trunk);

  const frondMat = new THREE.MeshStandardMaterial({ color: '#4f8a3f', roughness: 0.8, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 4, 1, true), frondMat);
    frond.position.y = 3.5;
    const angle = (i / 7) * Math.PI * 2;
    frond.rotation.set(Math.PI / 2.6, angle, 0);
    frond.castShadow = true;
    group.add(frond);
  }
  return group;
}

function buildOasisWater(): THREE.Mesh {
  const geo = new THREE.CircleGeometry(4.5, 20);
  const mat = new THREE.MeshStandardMaterial({
    color: '#2f7ea8',
    roughness: 0.15,
    metalness: 0.3,
    emissive: '#123a4d',
    emissiveIntensity: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  mesh.userData.isWater = true;
  return mesh;
}

function buildCamel(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#c9a06a', roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 4, 8), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), bodyMat);
  hump.position.set(0, 1.5, 0);
  group.add(hump);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 6), bodyMat);
  neck.position.set(0, 1.55, -0.75);
  neck.rotation.x = -0.5;
  group.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), bodyMat);
  head.position.set(0, 1.95, -1.1);
  group.add(head);
  const legMat = new THREE.MeshStandardMaterial({ color: '#9c7a4e' });
  for (const dx of [-0.18, 0.18]) {
    for (const dz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), legMat);
      leg.position.set(dx, 0.55, dz);
      group.add(leg);
    }
  }
  return group;
}

export function populateDesertTile(group: THREE.Group, tileZ: number, level: LevelConfig) {
  addTerrainBothSides(group, level, tileZ);

  const isOasis = Math.random() < 0.12;

  for (const side of [-1, 1] as const) {
    const baseX = side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH + randomRange(2, 10));

    if (isOasis && side === 1) {
      const oasisGroup = new THREE.Group();
      oasisGroup.position.set(baseX + 6, 0, randomRange(-6, 6));
      oasisGroup.add(buildOasisWater());
      const palmCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < palmCount; i++) {
        const palm = buildPalmTree();
        const angle = (i / palmCount) * Math.PI * 2;
        palm.position.set(Math.cos(angle) * randomRange(4.5, 6.5), 0, Math.sin(angle) * randomRange(4.5, 6.5));
        oasisGroup.add(palm);
      }
      if (Math.random() < 0.6) {
        const camel = buildCamel();
        camel.position.set(randomRange(-3, 3), 0, 7 + randomRange(-1, 1));
        camel.rotation.y = randomRange(0, Math.PI * 2);
        oasisGroup.add(camel);
      }
      group.add(oasisGroup);
      continue;
    }

    const rockCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rockCount; i++) {
      const rock = buildRock(0.5 + Math.random() * 1.4);
      rock.position.set(baseX + side * randomRange(0, 8), 0.3, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
      group.add(rock);
    }
  }
}

// ---------------------------------------------------------------------------
// Forêt & Savane
// ---------------------------------------------------------------------------

function buildAcaciaTree(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 2.2, 6),
    new THREE.MeshStandardMaterial({ color: '#5c4632', roughness: 0.9 }),
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  group.add(trunk);
  const canopy = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.4, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: '#4f7a3f', roughness: 0.85 }),
  );
  canopy.position.y = 2.5;
  canopy.castShadow = true;
  group.add(canopy);
  return group;
}

function buildForestTree(): THREE.Group {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.24, 2.6, 6),
    new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.9 }),
  );
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  group.add(trunk);
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#3f6b32', roughness: 0.85 });
  for (let i = 0; i < 3; i++) {
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.1 - i * 0.18, 8, 7), canopyMat);
    canopy.position.y = 3.0 + i * 1.0;
    canopy.castShadow = true;
    group.add(canopy);
  }
  return group;
}

function buildBush(): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 7, 6),
    new THREE.MeshStandardMaterial({ color: '#4f6b3a', roughness: 0.9 }),
  );
  mesh.position.y = 0.4;
  mesh.castShadow = true;
  return mesh;
}

function buildGazelle(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#c9a06a', roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.55, 4, 8), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.55;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), bodyMat);
  head.position.set(0, 0.75, -0.42);
  group.add(head);
  const hornMat = new THREE.MeshStandardMaterial({ color: '#2a2015' });
  for (const dx of [-0.05, 0.05]) {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.02, 0.22, 4), hornMat);
    horn.position.set(dx, 0.9, -0.44);
    horn.rotation.x = -0.3;
    group.add(horn);
  }
  const legMat = new THREE.MeshStandardMaterial({ color: '#8a6b45' });
  for (const dx of [-0.1, 0.1]) {
    for (const dz of [-0.2, 0.2]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), legMat);
      leg.position.set(dx, 0.28, dz);
      group.add(leg);
    }
  }
  return group;
}

export function populateForestTile(group: THREE.Group, tileZ: number, level: LevelConfig) {
  addTerrainBothSides(group, level, tileZ);

  for (const side of [-1, 1] as const) {
    const baseX = side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH);
    const treeCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < treeCount; i++) {
      const tree = Math.random() < 0.5 ? buildForestTree() : buildAcaciaTree();
      tree.position.set(baseX + side * randomRange(2, 14), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
      tree.scale.setScalar(randomRange(0.8, 1.3));
      group.add(tree);
    }
    const bushCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bushCount; i++) {
      const bush = buildBush();
      bush.position.set(baseX + side * randomRange(1, 6), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
      group.add(bush);
    }
    if (Math.random() < 0.1) {
      const gazelle = buildGazelle();
      gazelle.position.set(baseX + side * randomRange(3, 9), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
      gazelle.rotation.y = randomRange(0, Math.PI * 2);
      group.add(gazelle);
    }
  }
}

// ---------------------------------------------------------------------------
// Route de Village
// ---------------------------------------------------------------------------

function buildHut(): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.7, 2.2, 12),
    new THREE.MeshStandardMaterial({ color: '#c9a463', roughness: 0.95 }),
  );
  base.position.y = 1.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.1, 1.6, 12),
    new THREE.MeshStandardMaterial({ color: '#8a6b3f', roughness: 1 }),
  );
  roof.position.y = 2.2 + 0.8;
  roof.castShadow = true;
  group.add(roof);
  return group;
}

function buildMarketStall(): THREE.Group {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: '#6b4d2e' });
  for (const dx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 6), postMat);
    post.position.set(dx, 1.05, 0);
    group.add(post);
  }
  const awningColor = pick(['#d9622b', '#2f9e6e', '#e3b23c', '#3c6fe3']);
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.08, 1.4),
    new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.8 }),
  );
  awning.position.y = 2.15;
  awning.castShadow = true;
  group.add(awning);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.7, 1.1),
    new THREE.MeshStandardMaterial({ color: '#8a6b45', roughness: 0.9 }),
  );
  table.position.y = 0.35;
  group.add(table);

  const produceMat = new THREE.MeshStandardMaterial({ color: pick(['#c94f4f', '#e3b23c', '#4f8a3f', '#e07a3c']) });
  for (let i = 0; i < 4; i++) {
    const item = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), produceMat);
    item.position.set(randomRange(-0.8, 0.8), 0.78, randomRange(-0.3, 0.3));
    group.add(item);
  }
  return group;
}

function buildVillagerBust(): THREE.Group {
  const pilot: PilotConfig = {
    id: 'villager',
    name: 'Villager',
    skinColor: pick(['#8a5a3c', '#6b4028', '#c48a5c', '#3d2a1c']),
    outfitColor: pick(['#d9622b', '#2f9e6e', '#3c6fe3', '#e3b23c', '#c94f4f']),
  };
  const bust = buildPilotBust(pilot, 2.6);
  bust.position.y = 0.65;
  return bust;
}

export function populateVillageTile(group: THREE.Group, tileZ: number, level: LevelConfig) {
  addTerrainBothSides(group, level, tileZ);

  const hasCluster = Math.random() < 0.55;
  for (const side of [-1, 1] as const) {
    const baseX = side * (ROAD_HALF_WIDTH + SIDEWALK_WIDTH);

    if (hasCluster) {
      if (Math.random() < 0.5) {
        const hut = buildHut();
        hut.position.set(baseX + side * randomRange(4, 10), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
        group.add(hut);
      } else {
        const stall = buildMarketStall();
        stall.position.set(baseX + side * randomRange(2.5, 5), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
        stall.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        group.add(stall);

        if (Math.random() < 0.7) {
          const villager = buildVillagerBust();
          villager.position.set(baseX + side * randomRange(1.5, 3), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
          villager.rotation.y = randomRange(0, Math.PI * 2);
          group.add(villager);
        }
      }
    } else {
      const bush = buildBush();
      bush.position.set(baseX + side * randomRange(1, 5), 0, randomRange(-TILE_LENGTH / 2, TILE_LENGTH / 2));
      group.add(bush);
    }
  }
}

export function getPopulateFn(level: LevelConfig): (group: THREE.Group, tileZ: number) => void {
  switch (level.id) {
    case 'desert_tenere':
      return (group, tileZ) => populateDesertTile(group, tileZ, level);
    case 'forest_savanna':
      return (group, tileZ) => populateForestTile(group, tileZ, level);
    case 'village_road':
      return (group, tileZ) => populateVillageTile(group, tileZ, level);
    case 'street_city':
    default:
      return (group) => populateCityTile(group, 0);
  }
}
