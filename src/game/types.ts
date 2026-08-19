export type RoadId = 'city' | 'highway' | 'rural';
export type ChallengeId = 'survival' | 'timeTrial' | 'noCollision';
export type Scenery = 'city' | 'highway' | 'savanna';

export interface LevelConfig {
  id: RoadId;
  name: string;
  emoji: string;
  description: string;
  laneCount: number;
  roadWidthRatio: number; // fraction of canvas width used by the road
  baseTrafficSpeed: number; // px/s (relative world scroll speed baseline)
  maxTrafficSpeed: number;
  trafficSpawnInterval: number; // seconds between spawns at start
  jamIntervalRange: [number, number]; // meters between jam zones
  jamLengthRange: [number, number]; // meters length of a jam zone
  obstacleChance: number; // 0..1 chance per spawn tick to spawn obstacle instead of/with traffic
  roadColor: string;
  edgeColor: string;
  laneMarkingColor: string;
  scenery: Scenery;
  surfaceRough: boolean; // rural bumpy road affects handling slightly
}

export interface ChallengeConfig {
  id: ChallengeId;
  name: string;
  emoji: string;
  description: string;
  targetDistance?: number; // meters, for timeTrial / noCollision
  timeLimit?: number; // seconds, for timeTrial
}

export const LEVELS: LevelConfig[] = [
  {
    id: 'city',
    name: 'Route Urbaine',
    emoji: '🏙️',
    description:
      "Rues animées d'Accra, feux de circulation et trafic dense. Attention aux arrêts brusques.",
    laneCount: 2,
    roadWidthRatio: 0.62,
    baseTrafficSpeed: 130,
    maxTrafficSpeed: 220,
    trafficSpawnInterval: 1.5,
    jamIntervalRange: [350, 550],
    jamLengthRange: [120, 220],
    obstacleChance: 0.18,
    roadColor: '#3a3a3a',
    edgeColor: '#c9a227',
    laneMarkingColor: '#e8e8e8',
    scenery: 'city',
    surfaceRough: false,
  },
  {
    id: 'highway',
    name: 'Autoroute',
    emoji: '🛣️',
    description:
      "Voie rapide entre Lagos et Accra. Trafic rapide sur plusieurs voies, dépassements risqués.",
    laneCount: 3,
    roadWidthRatio: 0.78,
    baseTrafficSpeed: 220,
    maxTrafficSpeed: 340,
    trafficSpawnInterval: 1.1,
    jamIntervalRange: [500, 750],
    jamLengthRange: [150, 260],
    obstacleChance: 0.1,
    roadColor: '#33373f',
    edgeColor: '#e3b23c',
    laneMarkingColor: '#f2f2f2',
    scenery: 'highway',
    surfaceRough: false,
  },
  {
    id: 'rural',
    name: 'Piste de Brousse',
    emoji: '🌍',
    description:
      'Piste en terre battue à travers la savane. Nids-de-poule, animaux et motos surprises.',
    laneCount: 2,
    roadWidthRatio: 0.5,
    baseTrafficSpeed: 100,
    maxTrafficSpeed: 170,
    trafficSpawnInterval: 2.1,
    jamIntervalRange: [300, 500],
    jamLengthRange: [80, 160],
    obstacleChance: 0.32,
    roadColor: '#8a6742',
    edgeColor: '#5c7a3f',
    laneMarkingColor: '#d8c69a',
    scenery: 'savanna',
    surfaceRough: true,
  },
];

export const CHALLENGES: ChallengeConfig[] = [
  {
    id: 'survival',
    name: 'Survie',
    emoji: '❤️',
    description: 'Roule le plus loin possible sans épuiser tes points de vie.',
  },
  {
    id: 'timeTrial',
    name: 'Contre-la-montre',
    emoji: '⏱️',
    description: 'Atteins 1500 m avant la fin du chrono.',
    targetDistance: 1500,
    timeLimit: 90,
  },
  {
    id: 'noCollision',
    name: 'Zéro Collision',
    emoji: '💎',
    description: '1000 m sans le moindre accrochage. Une seule touche et c’est fini.',
    targetDistance: 1000,
  },
];
