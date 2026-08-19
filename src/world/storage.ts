import type { ChallengeId, LevelId } from './types';

function key(level: LevelId, challenge: ChallengeId): string {
  return `dr-driving-africa:v2:best:${level}:${challenge}`;
}

export function getBestScore(level: LevelId, challenge: ChallengeId): number {
  const raw = localStorage.getItem(key(level, challenge));
  return raw ? Number(raw) || 0 : 0;
}

export function setBestScore(level: LevelId, challenge: ChallengeId, score: number): boolean {
  const current = getBestScore(level, challenge);
  if (score > current) {
    localStorage.setItem(key(level, challenge), String(Math.floor(score)));
    return true;
  }
  return false;
}
