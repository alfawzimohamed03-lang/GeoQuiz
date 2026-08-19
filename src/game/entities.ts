import type { LevelConfig, RoadId } from './types';
import { pick, randomRange } from './utils';

export type TrafficSubtype = 'sedan' | 'suv' | 'moto' | 'tuktuk' | 'truck';
export type ObstacleSubtype = 'pothole' | 'speed_bump' | 'debris' | 'animal' | 'cone' | 'oil_slick';

export interface WorldEntity {
  kind: 'traffic' | 'obstacle';
  subtype: TrafficSubtype | ObstacleSubtype;
  x: number;
  y: number;
  width: number;
  height: number;
  forwardSpeed: number; // px/s, own speed along the road (0 for static hazards)
  color: string;
  accentColor: string;
  lane: number;
  hit: boolean;
  scored: boolean; // near-miss already evaluated
  driftVx: number;
  wobble: number;
  damage: number;
  speedPenalty: number;
  blocksLane: boolean; // affects visual slow-down cue only
}

const TRAFFIC_COLORS: Record<TrafficSubtype, string[]> = {
  sedan: ['#c94f4f', '#3f6fb0', '#e0e0e0', '#3a3a3a'],
  suv: ['#4c6b45', '#5b4636', '#33445c'],
  moto: ['#e3b23c', '#1c1c1c'],
  tuktuk: ['#e3b23c', '#2f9e6e', '#c94f4f'],
  truck: ['#33445c', '#7a5230'],
};

function trafficDims(subtype: TrafficSubtype, laneWidth: number) {
  switch (subtype) {
    case 'moto':
      return { w: laneWidth * 0.26, h: laneWidth * 0.5 };
    case 'tuktuk':
      return { w: laneWidth * 0.4, h: laneWidth * 0.58 };
    case 'truck':
      return { w: laneWidth * 0.56, h: laneWidth * 1.15 };
    case 'suv':
      return { w: laneWidth * 0.52, h: laneWidth * 0.92 };
    default:
      return { w: laneWidth * 0.48, h: laneWidth * 0.82 };
  }
}

function trafficPoolFor(roadId: RoadId): TrafficSubtype[] {
  if (roadId === 'city') return ['sedan', 'sedan', 'tuktuk', 'moto', 'suv'];
  if (roadId === 'highway') return ['sedan', 'suv', 'truck', 'sedan'];
  return ['moto', 'tuktuk', 'sedan', 'suv'];
}

export function spawnTraffic(
  level: LevelConfig,
  laneWidth: number,
  roadLeft: number,
  lane: number,
  speed: number,
  spawnY: number,
): WorldEntity {
  const subtype = pick(trafficPoolFor(level.id));
  const { w, h } = trafficDims(subtype, laneWidth);
  const colors = TRAFFIC_COLORS[subtype];
  const laneCenter = roadLeft + laneWidth * (lane + 0.5);
  const jitter = (laneWidth - w) * 0.3;
  return {
    kind: 'traffic',
    subtype,
    x: laneCenter + randomRange(-jitter, jitter),
    y: spawnY,
    width: w,
    height: h,
    forwardSpeed: speed,
    color: pick(colors),
    accentColor: '#1c1c1c',
    lane,
    hit: false,
    scored: false,
    driftVx: 0,
    wobble: Math.random() * Math.PI * 2,
    damage: subtype === 'truck' ? 34 : subtype === 'moto' ? 18 : 26,
    speedPenalty: 70,
    blocksLane: true,
  };
}

function obstaclePoolFor(roadId: RoadId): ObstacleSubtype[] {
  if (roadId === 'city') return ['speed_bump', 'cone'];
  if (roadId === 'highway') return ['debris', 'oil_slick'];
  return ['pothole', 'animal', 'pothole'];
}

export function spawnObstacle(
  level: LevelConfig,
  laneWidth: number,
  roadLeft: number,
  lane: number,
  spawnY: number,
): WorldEntity {
  const subtype = pick(obstaclePoolFor(level.id));
  const laneCenter = roadLeft + laneWidth * (lane + 0.5);
  let w = laneWidth * 0.4;
  let h = laneWidth * 0.28;
  let damage = 12;
  let speedPenalty = 90;
  let color = '#2b2b2b';
  const accentColor = '#e3b23c';

  switch (subtype) {
    case 'pothole':
      w = laneWidth * 0.42;
      h = laneWidth * 0.3;
      damage = 10;
      speedPenalty = 100;
      color = '#1a1a1a';
      break;
    case 'speed_bump':
      w = laneWidth * 0.9;
      h = laneWidth * 0.16;
      damage = 6;
      speedPenalty = 130;
      color = '#e3b23c';
      break;
    case 'debris':
      w = laneWidth * 0.34;
      h = laneWidth * 0.3;
      damage = 16;
      speedPenalty = 110;
      color = '#5c5044';
      break;
    case 'animal':
      w = laneWidth * 0.3;
      h = laneWidth * 0.42;
      damage = 22;
      speedPenalty = 140;
      color = '#8a6b45';
      break;
    case 'cone':
      w = laneWidth * 0.22;
      h = laneWidth * 0.26;
      damage = 8;
      speedPenalty = 80;
      color = '#d9622b';
      break;
    case 'oil_slick':
      w = laneWidth * 0.5;
      h = laneWidth * 0.32;
      damage = 4;
      speedPenalty = 40;
      color = '#141414';
      break;
  }

  return {
    kind: 'obstacle',
    subtype,
    x: laneCenter,
    y: spawnY,
    width: w,
    height: h,
    forwardSpeed: 0,
    color,
    accentColor,
    lane,
    hit: false,
    scored: true, // obstacles don't award near-miss bonus
    driftVx: subtype === 'animal' ? randomRange(20, 40) * (Math.random() < 0.5 ? -1 : 1) : 0,
    wobble: 0,
    damage,
    speedPenalty,
    blocksLane: subtype !== 'oil_slick',
  };
}
