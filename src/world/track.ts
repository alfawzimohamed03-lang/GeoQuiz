import * as THREE from 'three';
import type { LevelConfig } from './types';
import { fbm2D } from './noise';

export const LANE_WIDTH = 3.6;
export const ROAD_HALF_WIDTH = LANE_WIDTH * 2; // 4 lanes total (2 each direction)
export const SIDEWALK_WIDTH = 3;
export const ROAD_LEFT = -ROAD_HALF_WIDTH;
export const ROAD_RIGHT = ROAD_HALF_WIDTH;

export const TILE_LENGTH = 30;
export const TILE_COUNT = 10;
const RECYCLE_BEHIND = 20;

const REPEAT_UNIT = 20; // meters of road represented by one texture tile

/** Lane 0-1 = oncoming traffic (left half), lane 2-3 = same direction as player (right half). */
export function laneCenterX(laneIndex: number): number {
  return ROAD_LEFT + LANE_WIDTH * (laneIndex + 0.5);
}

export function isOncomingLane(laneIndex: number): boolean {
  return laneIndex < 2;
}

function mixHex(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  const factor = 1 + amount;
  c.r = THREE.MathUtils.clamp(c.r * factor, 0, 1);
  c.g = THREE.MathUtils.clamp(c.g * factor, 0, 1);
  c.b = THREE.MathUtils.clamp(c.b * factor, 0, 1);
  return `#${c.getHexString()}`;
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

  // Speckled color variation so the surface doesn't read as a flat, uniform fill.
  for (let i = 0; i < 900; i++) {
    const x = roadLeftPx + Math.random() * (roadRightPx - roadLeftPx);
    const y = Math.random() * texH;
    const shade = fbm2D(x * 0.05, y * 0.05, 2);
    ctx.fillStyle = mixHex(level.roadColor, (shade - 0.5) * (level.paved ? 0.14 : 0.32));
    const r = level.paved ? 1 + Math.random() * 1.5 : 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * texW;
    const y = Math.random() * texH;
    const onRoad = x > roadLeftPx && x < roadRightPx;
    ctx.fillStyle = mixHex(onRoad ? level.roadColor : level.sidewalkColor, (Math.random() - 0.5) * 0.2);
    const r = 1 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (level.paved) {
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
  } else {
    // Unpaved track: faint worn tire ruts instead of painted lane lines.
    ctx.strokeStyle = mixHex(level.roadColor, -0.35);
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.45;
    for (const laneIdx of [0, 1, 2, 3]) {
      const laneWidthPx = LANE_WIDTH * pxPerMeter;
      const rutOffset = laneWidthPx * 0.28;
      const laneCenterPx = roadLeftPx + laneWidthPx * (laneIdx + 0.5);
      for (const off of [-rutOffset, rutOffset]) {
        ctx.beginPath();
        ctx.moveTo(laneCenterPx + off, 0);
        ctx.lineTo(laneCenterPx + off, texH);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

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
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: level.paved ? 0.95 : 1,
    metalness: 0.02,
  });
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

export interface TrackTile {
  group: THREE.Group;
  z: number;
}

export type TilePopulateFn = (group: THREE.Group, tileZ: number) => void;

export function disposeGroupChildren(group: THREE.Group) {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = group.children[i];
    group.remove(child);
    child.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}

export function createTiles(scene: THREE.Scene, populate: TilePopulateFn): TrackTile[] {
  const tiles: TrackTile[] = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    const group = new THREE.Group();
    const z = -i * TILE_LENGTH - 10;
    group.position.z = z;
    populate(group, z);
    scene.add(group);
    tiles.push({ group, z });
  }
  return tiles;
}

export function updateTiles(tiles: TrackTile[], populate: TilePopulateFn, playerSpeed: number, dt: number) {
  const totalSpan = TILE_COUNT * TILE_LENGTH;
  for (const tile of tiles) {
    tile.z += playerSpeed * dt;
    if (tile.z > RECYCLE_BEHIND) {
      tile.z -= totalSpan;
      populate(tile.group, tile.z);
    }
    tile.group.position.z = tile.z;
  }
}

export function disposeTiles(scene: THREE.Scene, tiles: TrackTile[]) {
  for (const tile of tiles) {
    disposeGroupChildren(tile.group);
    scene.remove(tile.group);
  }
}

export function buildGround(level: LevelConfig): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2000, 2000);
  const mat = new THREE.MeshStandardMaterial({ color: level.groundColor, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.15;
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
  // Rendered as a pure backdrop: no depth test/write, drawn first, so it can never
  // z-fight with the sun disc or mountain backdrop at these extreme distances.
  const mat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    fog: false,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -3;
  return mesh;
}

/** A bright sun/moon disc with a soft additive glow halo, placed far in the sky. */
export function buildSunDisc(color: string, elevation: number): THREE.Group {
  const group = new THREE.Group();

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(9, 24),
    new THREE.MeshBasicMaterial({ color, fog: false, depthTest: false, depthWrite: false }),
  );
  disc.renderOrder = -1;
  group.add(disc);

  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d')!;
  const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.35, 'rgba(255,240,200,0.35)');
  grad.addColorStop(1, 'rgba(255,240,200,0)');
  hctx.fillStyle = grad;
  hctx.fillRect(0, 0, 128, 128);
  const haloTex = new THREE.CanvasTexture(haloCanvas);
  haloTex.generateMipmaps = false;
  haloTex.minFilter = THREE.LinearFilter;
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      fog: false,
    }),
  );
  halo.renderOrder = -1;
  group.add(halo);

  group.position.set(-70, elevation, -300);
  group.lookAt(0, elevation * 0.6, 0);
  return group;
}

const BACKDROP_DISTANCES = [220, 280, 340];

/** Layered, static (non-scrolling) silhouettes for a distant mountain/hill horizon. Cheap, big depth payoff. */
export function buildBackdrop(level: LevelConfig): THREE.Group | null {
  if (level.backdropStyle === 'none') return null;
  const group = new THREE.Group();

  if (level.backdropStyle === 'skyline') {
    for (let layer = 0; layer < 3; layer++) {
      const dist = BACKDROP_DISTANCES[layer];
      const color = level.backdropColors[layer];
      const layerGroup = new THREE.Group();
      let x = -260;
      while (x < 260) {
        const w = 8 + Math.random() * 14;
        const h = 14 + Math.random() * (40 - layer * 8);
        const bld = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, 6),
          new THREE.MeshBasicMaterial({ color, fog: true, depthTest: false, depthWrite: false }),
        );
        bld.position.set(x, h / 2 - 0.15, -dist);
        bld.renderOrder = -2;
        layerGroup.add(bld);
        x += w + Math.random() * 6;
      }
      group.add(layerGroup);
    }
    return group;
  }

  const isMountain = level.backdropStyle === 'mountains';
  for (let layer = 0; layer < 3; layer++) {
    const dist = BACKDROP_DISTANCES[layer];
    const color = level.backdropColors[layer];
    const segments = 22;
    const width = 640;
    const baseHeight = isMountain ? 55 - layer * 12 : 26 - layer * 6;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -5);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = -width / 2 + t * width;
      const n = fbm2D(t * (isMountain ? 3.2 : 2.2) + layer * 11.3, layer * 4.7, 4);
      const ridge = isMountain ? Math.pow(n, 1.6) : n;
      const y = ridge * baseHeight;
      shape.lineTo(x, y);
    }
    shape.lineTo(width / 2, -5);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, fog: true, depthTest: false, depthWrite: false }));
    mesh.position.set(0, 0, -dist);
    mesh.renderOrder = -2;
    group.add(mesh);
  }
  return group;
}
