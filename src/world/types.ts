export type CarClassId = 'compact' | 'sedan' | 'suv' | 'supercar';
export type ChallengeId = 'survival' | 'timeTrial' | 'noCollision';
export type LevelId = 'street_city' | 'desert_tenere' | 'forest_savanna' | 'village_road';

export interface CarClassConfig {
  id: CarClassId;
  name: string;
  tagline: string;
  bodyLength: number;
  bodyWidth: number;
  bodyHeight: number;
  wheelRadius: number;
  maxSpeed: number; // m/s
  accel: number;
  handling: number; // steering responsiveness multiplier
  colors: string[];
}

export interface PilotConfig {
  id: string;
  name: string;
  skinColor: string;
  outfitColor: string;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  emoji: string;
  description: string;
  comingSoon: boolean;
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientColor: string;
  ambientIntensity: number;
  sunColor: string;
  sunIntensity: number;
  roadColor: string;
  sidewalkColor: string;
  baseTrafficSpeed: number; // m/s
  maxTrafficSpeed: number; // m/s
  spawnInterval: number; // seconds
  jamIntervalRange: [number, number]; // meters between jam zones
  jamLengthRange: [number, number]; // meters
  obstacleChance: number; // 0..1
  paved: boolean; // false = dirt/sand track, no painted lane lines
  terrainStyle: 'flat' | 'dunes' | 'hills';
  terrainAmplitude: number; // meters of height variation off to the sides of the road
  groundColor: string;
  backdropStyle: 'none' | 'skyline' | 'mountains' | 'hills';
  backdropColors: [string, string, string]; // near -> far, for atmospheric-perspective layering
  dustParticles: boolean;
}

export interface ChallengeConfig {
  id: ChallengeId;
  name: string;
  emoji: string;
  description: string;
  targetDistance?: number;
  timeLimit?: number;
}

export const CAR_CLASSES: CarClassConfig[] = [
  {
    id: 'compact',
    name: 'Citadine',
    tagline: 'Légère et maniable, parfaite en ville',
    bodyLength: 3.9,
    bodyWidth: 1.7,
    bodyHeight: 1.45,
    wheelRadius: 0.32,
    maxSpeed: 42,
    accel: 9,
    handling: 1.25,
    colors: ['#e3483c', '#3c8de3', '#f2d13c', '#39c98c'],
  },
  {
    id: 'sedan',
    name: 'Berline Sport',
    tagline: 'Equilibre entre vitesse et confort',
    bodyLength: 4.6,
    bodyWidth: 1.8,
    bodyHeight: 1.3,
    wheelRadius: 0.34,
    maxSpeed: 52,
    accel: 8,
    handling: 1.05,
    colors: ['#1c1c1c', '#e0e0e0', '#2f4b8f', '#7a1f2b'],
  },
  {
    id: 'suv',
    name: 'SUV Tout-Terrain',
    tagline: 'Robuste, taillé pour la brousse et le désert',
    bodyLength: 4.7,
    bodyWidth: 1.95,
    bodyHeight: 1.75,
    wheelRadius: 0.42,
    maxSpeed: 46,
    accel: 7,
    handling: 0.85,
    colors: ['#4c6b45', '#5c4a36', '#33445c', '#8a6b2b'],
  },
  {
    id: 'supercar',
    name: 'Bolide',
    tagline: 'Vitesse maximale, prise au vent minimale',
    bodyLength: 4.4,
    bodyWidth: 1.95,
    bodyHeight: 1.05,
    wheelRadius: 0.35,
    maxSpeed: 68,
    accel: 12,
    handling: 1.15,
    colors: ['#e3483c', '#f2b807', '#1c1c1c', '#2f9e6e'],
  },
];

export const PILOTS: PilotConfig[] = [
  { id: 'amara', name: 'Amara', skinColor: '#8a5a3c', outfitColor: '#d9622b' },
  { id: 'kwame', name: 'Kwame', skinColor: '#6b4028', outfitColor: '#2f9e6e' },
  { id: 'zola', name: 'Zola', skinColor: '#c48a5c', outfitColor: '#3c6fe3' },
  { id: 'nia', name: 'Nia', skinColor: '#3d2a1c', outfitColor: '#e3b23c' },
];

export const LEVELS: LevelConfig[] = [
  {
    id: 'street_city',
    name: 'Rue de la Ville',
    emoji: '🌃',
    description: 'Course de rue nocturne, double sens, tout le trafic est permis.',
    comingSoon: false,
    skyTop: '#1a1f3d',
    skyBottom: '#4a3a5c',
    fogColor: '#241f38',
    fogNear: 45,
    fogFar: 190,
    ambientColor: '#5566aa',
    ambientIntensity: 0.55,
    sunColor: '#ffd8a8',
    sunIntensity: 1.1,
    roadColor: '#2c2c32',
    sidewalkColor: '#6b6b70',
    baseTrafficSpeed: 8,
    maxTrafficSpeed: 20,
    spawnInterval: 1.4,
    jamIntervalRange: [280, 450],
    jamLengthRange: [70, 140],
    obstacleChance: 0.16,
    paved: true,
    terrainStyle: 'flat',
    terrainAmplitude: 0,
    groundColor: '#3a3d45',
    backdropStyle: 'skyline',
    backdropColors: ['#3a3f52', '#2c3040', '#1f2230'],
    dustParticles: false,
  },
  {
    id: 'desert_tenere',
    name: 'Désert du Ténéré',
    emoji: '🏜️',
    description: 'Dunes à perte de vue, une oasis parfois à l’horizon, montagnes lointaines.',
    comingSoon: false,
    skyTop: '#3a6ea8',
    skyBottom: '#f0c07a',
    fogColor: '#e0a862',
    fogNear: 70,
    fogFar: 230,
    ambientColor: '#e8b06a',
    ambientIntensity: 0.65,
    sunColor: '#fff2d0',
    sunIntensity: 1.6,
    roadColor: '#d4ab6e',
    sidewalkColor: '#c9a463',
    baseTrafficSpeed: 9,
    maxTrafficSpeed: 22,
    spawnInterval: 2.4,
    jamIntervalRange: [400, 600],
    jamLengthRange: [60, 120],
    obstacleChance: 0.3,
    paved: false,
    terrainStyle: 'dunes',
    terrainAmplitude: 5.5,
    groundColor: '#dcb277',
    backdropStyle: 'mountains',
    backdropColors: ['#c98a5c', '#a8724e', '#8a6b6e'],
    dustParticles: true,
  },
  {
    id: 'forest_savanna',
    name: 'Forêt & Savane',
    emoji: '🌳',
    description: 'Pistes bordées d’arbres, animaux sauvages en liberté.',
    comingSoon: false,
    skyTop: '#4a7a9a',
    skyBottom: '#d9e08a',
    fogColor: '#8aa563',
    fogNear: 42,
    fogFar: 175,
    ambientColor: '#a8c96a',
    ambientIntensity: 0.65,
    sunColor: '#fff4c8',
    sunIntensity: 1.3,
    roadColor: '#8a6742',
    sidewalkColor: '#5c7a3f',
    baseTrafficSpeed: 7,
    maxTrafficSpeed: 16,
    spawnInterval: 2.4,
    jamIntervalRange: [300, 480],
    jamLengthRange: [50, 100],
    obstacleChance: 0.34,
    paved: false,
    terrainStyle: 'hills',
    terrainAmplitude: 3.2,
    groundColor: '#5c7a3f',
    backdropStyle: 'hills',
    backdropColors: ['#4f6b3a', '#3f5a35', '#33502e'],
    dustParticles: true,
  },
  {
    id: 'village_road',
    name: 'Route de Village',
    emoji: '🏘️',
    description: 'Marchés, cases et pistes de terre entre les villages.',
    comingSoon: false,
    skyTop: '#8ab0d8',
    skyBottom: '#f2d19a',
    fogColor: '#e0c088',
    fogNear: 45,
    fogFar: 180,
    ambientColor: '#f2d19a',
    ambientIntensity: 0.65,
    sunColor: '#fff2d0',
    sunIntensity: 1.4,
    roadColor: '#9c8058',
    sidewalkColor: '#c9a463',
    baseTrafficSpeed: 7,
    maxTrafficSpeed: 15,
    spawnInterval: 2.0,
    jamIntervalRange: [250, 400],
    jamLengthRange: [50, 90],
    obstacleChance: 0.24,
    paved: false,
    terrainStyle: 'hills',
    terrainAmplitude: 1.8,
    groundColor: '#c9a463',
    backdropStyle: 'hills',
    backdropColors: ['#c9a463', '#b08a52', '#8a6b45'],
    dustParticles: false,
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
    description: 'Atteins 2000 m avant la fin du chrono.',
    targetDistance: 2000,
    timeLimit: 110,
  },
  {
    id: 'noCollision',
    name: 'Zéro Collision',
    emoji: '💎',
    description: '1200 m sans le moindre accrochage.',
    targetDistance: 1200,
  },
];
