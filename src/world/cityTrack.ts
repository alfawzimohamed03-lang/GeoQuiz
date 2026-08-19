import * as THREE from 'three';
import type { LevelConfig } from './types';

export const LANE_WIDTH = 3.6;
export const ROAD_HALF_WIDTH = LANE_WIDTH * 2; // 4 lanes total (2 each direction)
export const SIDEWALK_WIDTH = 3;
export const ROAD_LEFT = -ROAD_HALF_WIDTH;
export const ROAD_RIGHT = ROAD_HALF_WIDTH;

const REPEAT_UNIT = 20; // meters of road represented by one texture tile
const TILE_LENGTH = 30;
const TILE_COUNT = 10;
const RECYCLE_BEHIND = 20;

/** Lane 0-1 = oncoming traffic (left half), lane 2-3 = same direction as player (right half). */
export function laneCenterX(laneIndex: number): number {
  return ROAD_LEFT + LANE_WIDTH * (laneIndex + 0.5);
}

export function isOncomingLane(laneIndex: number): boolean {
  return laneIndex < 2;
}

function makeRoadTexture(level: LevelConfig): THREE.CanvasTexture {
  const texW = 256;
  const texH = 512;
  const canvas = document.createElement('canvas');
  canvas.width = texW;
  canvas.height = texH;
  const ctx = canvas.getContext('2d')!;

  const totalWidth = ROAD_HALF_WIDTH * 2 + SIDEWALK_WIDTH * 2;
  const pxPerMeter = texW / totalWidth;
  const roadLeftPx = SIDEWALK_WIDTH * pxPerMeter;
  const roadRightPx = (SIDEWALK_WIDTH + ROAD_HALF_WIDTH * 2) * pxPerMeter;

  ctx.fillStyle = level.sidewalkColor;
  ctx.fillRect(0, 0, texW, texH);
  ctx.fillStyle = level.roadColor;
  ctx.fillRect(roadLeftPx, 0, roadRightPx - roadLeftPx, texH);

  const centerPx = texW / 2;
  ctx.strokeStyle = '#e3b23c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerPx - 4, 0);
  ctx.lineTo(centerPx - 4, texH);
  ctx.moveTo(centerPx + 4, 0);
  ctx.lineTo(centerPx + 4, texH);
  ctx.stroke();

  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = 3;
  ctx.setLineDash([44, 40]);
  const laneWidthPx = LANE_WIDTH * pxPerMeter;
  const dividerLeftPx = roadLeftPx + laneWidthPx;
  const dividerRightPx = roadRightPx - laneWidthPx;
  ctx.beginPath();
  ctx.moveTo(dividerLeftPx, 0);
  ctx.lineTo(dividerLeftPx, texH);
  ctx.moveTo(dividerRightPx, 0);
  ctx.lineTo(dividerRightPx, texH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#f4f1ea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(roadLeftPx + 2, 0);
  ctx.lineTo(roadLeftPx + 2, texH);
  ctx.moveTo(roadRightPx - 2, 0);
  ctx.lineTo(roadRightPx - 2, texH);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildRoadSurface(level: LevelConfig): THREE.Mesh {
  const totalWidth = ROAD_HALF_WIDTH * 2 + SIDEWALK_WIDTH * 2;
  const planeLength = (TILE_COUNT + 2) * TILE_LENGTH;
  const texture = makeRoadTexture(level);
  texture.repeat.set(1, planeLength / REPEAT_UNIT);

  const geo = new THREE.PlaneGeometry(totalWidth, planeLength);
  const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.005, -planeLength / 2 + TILE_LENGTH);
  mesh.receiveShadow = true;
  mesh.userData.texture = texture;
  return mesh;
}

export function updateRoadScroll(mesh: THREE.Mesh, distance: number) {
  const texture = mesh.userData.texture as THREE.CanvasTexture;
  texture.offset.y = (distance / REPEAT_UNIT) % 1;
}

const BUILDING_PALETTE = ['#5b5f6b', '#4a4e58', '#6b5f52', '#55606b', '#4f4437', '#3f4a55'];

interface CityTile {
  group: THREE.Group;
  z: number;
}

function populateTile(group: THREE.Group) {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    group.remove(child);
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((m: THREE.Material) => m.dispose());
      else child.material.dispose();
    }
  }

  for (const side of [-1, 1]) {
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

export function createCityTiles(scene: THREE.Scene): CityTile[] {
  const tiles: CityTile[] = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    const group = new THREE.Group();
    const z = -i * TILE_LENGTH - 10;
    group.position.z = z;
    populateTile(group);
    scene.add(group);
    tiles.push({ group, z });
  }
  return tiles;
}

export function updateCityTiles(tiles: CityTile[], playerSpeed: number, dt: number) {
  const totalSpan = TILE_COUNT * TILE_LENGTH;
  for (const tile of tiles) {
    tile.z += playerSpeed * dt;
    if (tile.z > RECYCLE_BEHIND) {
      tile.z -= totalSpan;
      populateTile(tile.group);
    }
    tile.group.position.z = tile.z;
  }
}

export function buildGround(level: LevelConfig): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2000, 2000);
  const mat = new THREE.MeshStandardMaterial({ color: level.sidewalkColor, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.05;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildSkyDome(topColor: string, bottomColor: string): THREE.Mesh {
  const geo = new THREE.SphereGeometry(400, 20, 16);
  const top = new THREE.Color(topColor);
  const bottom = new THREE.Color(bottomColor);
  const colors: number[] = [];
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = THREE.MathUtils.clamp(y / 400, -1, 1) * 0.5 + 0.5;
    const c = bottom.clone().lerp(top, t);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false });
  return new THREE.Mesh(geo, mat);
}

export { TILE_LENGTH, TILE_COUNT };
