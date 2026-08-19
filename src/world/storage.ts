import type { ChallengeId, LevelId } from './types';

function key(level: LevelId, challenge: ChallengeId): string {
  return `dr-driving-africa:v2:best:${level}:${challenge}`;
}

// localStorage can throw (privacy mode, sandboxed iframe preview, etc.) - never let a
// missing high-score store crash the game.
export function getBestScore(level: LevelId, challenge: ChallengeId): number {
  try {
    const raw = localStorage.getItem(key(level, challenge));
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setBestScore(level: LevelId, challenge: ChallengeId, score: number): boolean {
  const current = getBestScore(level, challenge);
  if (score > current) {
    try {
      localStorage.setItem(key(level, challenge), String(Math.floor(score)));
    } catch {
      // ignore - best score just won't persist this session
    }
    return true;
  }
  return false;
}
