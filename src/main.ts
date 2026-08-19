import './style.css';
import { Game } from './game/Game';
import { CHALLENGES, LEVELS } from './game/types';
import type { ChallengeConfig, LevelConfig } from './game/types';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);

const levelSelect = document.getElementById('level-select')!;
const challengeSelect = document.getElementById('challenge-select')!;
const levelDescription = document.getElementById('level-description')!;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;

let selectedLevel: LevelConfig = LEVELS[0];
let selectedChallenge: ChallengeConfig = CHALLENGES[0];

function renderLevelOptions() {
  levelSelect.innerHTML = '';
  for (const level of LEVELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (level.id === selectedLevel.id ? ' selected' : '');
    btn.innerHTML = `<span class="option-emoji">${level.emoji}</span><span class="option-name">${level.name}</span>`;
    btn.addEventListener('click', () => {
      selectedLevel = level;
      renderLevelOptions();
      updateDescription();
    });
    levelSelect.appendChild(btn);
  }
}

function renderChallengeOptions() {
  challengeSelect.innerHTML = '';
  for (const challenge of CHALLENGES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (challenge.id === selectedChallenge.id ? ' selected' : '');
    btn.innerHTML = `<span class="option-emoji">${challenge.emoji}</span><span class="option-name">${challenge.name}</span>`;
    btn.addEventListener('click', () => {
      selectedChallenge = challenge;
      renderChallengeOptions();
      updateDescription();
    });
    challengeSelect.appendChild(btn);
  }
}

function updateDescription() {
  levelDescription.textContent = `${selectedLevel.description} — ${selectedChallenge.description}`;
}

renderLevelOptions();
renderChallengeOptions();
updateDescription();

btnStart.addEventListener('click', () => {
  game.startRun(selectedLevel, selectedChallenge);
});

document.getElementById('btn-pause')!.addEventListener('click', () => game.pause());
document.getElementById('btn-resume')!.addEventListener('click', () => game.resume());
document.getElementById('btn-quit')!.addEventListener('click', () => game.quitToMenu());
document.getElementById('btn-retry')!.addEventListener('click', () => game.retry());
document.getElementById('btn-menu')!.addEventListener('click', () => game.quitToMenu());
