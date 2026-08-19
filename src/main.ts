import './style.css';
import { Game3D } from './world/Game3D';
import { Preview } from './world/Preview';
import { CAR_CLASSES, CHALLENGES, LEVELS, PILOTS } from './world/types';
import type { CarClassConfig, ChallengeConfig, LevelConfig, PilotConfig } from './world/types';

const threeRoot = document.getElementById('three-root')!;
const game = new Game3D(threeRoot);

const previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
const preview = new Preview(previewCanvas);

let selectedPilot: PilotConfig = PILOTS[0];
let selectedCarClass: CarClassConfig = CAR_CLASSES[0];
let selectedCarColor: string = CAR_CLASSES[0].colors[0];
let selectedLevel: LevelConfig = LEVELS[0];
let selectedChallenge: ChallengeConfig = CHALLENGES[0];
let activeTab: 'pilot' | 'car' | 'level' | 'challenge' = 'pilot';

const pilotSelect = document.getElementById('pilot-select')!;
const carSelect = document.getElementById('car-select')!;
const carDescription = document.getElementById('car-description')!;
const levelSelect = document.getElementById('level-select')!;
const levelDescription = document.getElementById('level-description')!;
const challengeSelect = document.getElementById('challenge-select')!;
const challengeDescription = document.getElementById('challenge-description')!;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;

function resizePreview() {
  const w = previewCanvas.clientWidth || 240;
  const h = previewCanvas.clientHeight || 170;
  preview.resize(w, h);
}

function refreshPreview() {
  if (activeTab === 'pilot') {
    preview.showPilot(selectedPilot);
  } else {
    preview.showCar(selectedCarClass, selectedCarColor);
  }
}

function renderPilotOptions() {
  pilotSelect.innerHTML = '';
  for (const pilot of PILOTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (pilot.id === selectedPilot.id ? ' selected' : '');
    btn.innerHTML = `<span class="option-swatch" style="background:${pilot.outfitColor}"></span><span class="option-name">${pilot.name}</span>`;
    btn.addEventListener('click', () => {
      selectedPilot = pilot;
      renderPilotOptions();
      refreshPreview();
    });
    pilotSelect.appendChild(btn);
  }
}

function renderCarOptions() {
  carSelect.innerHTML = '';
  for (const cls of CAR_CLASSES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (cls.id === selectedCarClass.id ? ' selected' : '');
    btn.innerHTML = `<span class="option-swatch" style="background:${cls.colors[0]}"></span><span class="option-name">${cls.name}</span>`;
    btn.addEventListener('click', () => {
      selectedCarClass = cls;
      selectedCarColor = cls.colors[0];
      renderCarOptions();
      renderColorOptions();
      updateCarDescription();
      refreshPreview();
    });
    carSelect.appendChild(btn);
  }
  renderColorOptions();
  updateCarDescription();
}

let colorRow: HTMLDivElement | null = null;
function renderColorOptions() {
  if (!colorRow) {
    colorRow = document.createElement('div');
    colorRow.className = 'color-row';
    carSelect.after(colorRow);
  }
  colorRow.innerHTML = '';
  for (const color of selectedCarClass.colors) {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch' + (color === selectedCarColor ? ' selected' : '');
    swatch.style.background = color;
    swatch.addEventListener('click', () => {
      selectedCarColor = color;
      renderColorOptions();
      refreshPreview();
    });
    colorRow.appendChild(swatch);
  }
}

function updateCarDescription() {
  carDescription.textContent = `${selectedCarClass.tagline} — vitesse max ${Math.round(selectedCarClass.maxSpeed * 3.6)} km/h.`;
}

function renderLevelOptions() {
  levelSelect.innerHTML = '';
  for (const level of LEVELS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-btn' + (level.id === selectedLevel.id ? ' selected' : '') + (level.comingSoon ? ' disabled' : '');
    btn.innerHTML = `<span class="option-emoji">${level.emoji}</span><span class="option-name">${level.name}</span>${level.comingSoon ? '<span class="soon-badge">Bientôt</span>' : ''}`;
    if (level.comingSoon) {
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => {
        selectedLevel = level;
        renderLevelOptions();
        updateLevelDescription();
      });
    }
    levelSelect.appendChild(btn);
  }
  updateLevelDescription();
}

function updateLevelDescription() {
  levelDescription.textContent = selectedLevel.description;
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
      updateChallengeDescription();
    });
    challengeSelect.appendChild(btn);
  }
  updateChallengeDescription();
}

function updateChallengeDescription() {
  challengeDescription.textContent = selectedChallenge.description;
}

const tabButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.menu-tab'));
const tabPanels: Record<string, HTMLElement> = {
  pilot: document.getElementById('tab-pilot')!,
  car: document.getElementById('tab-car')!,
  level: document.getElementById('tab-level')!,
  challenge: document.getElementById('tab-challenge')!,
};

function setActiveTab(tab: typeof activeTab) {
  activeTab = tab;
  for (const btn of tabButtons) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  }
  for (const [key, panel] of Object.entries(tabPanels)) {
    panel.classList.toggle('hidden', key !== tab);
  }
  refreshPreview();
}

for (const btn of tabButtons) {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.tab as typeof activeTab));
}

renderPilotOptions();
renderCarOptions();
renderLevelOptions();
renderChallengeOptions();
resizePreview();
refreshPreview();
preview.start();
window.addEventListener('resize', resizePreview);

function launchRun() {
  preview.stop();
  game.startRun(selectedLevel, selectedChallenge, selectedCarClass, selectedCarColor, selectedPilot);
}

btnStart.addEventListener('click', launchRun);
document.getElementById('btn-retry')!.addEventListener('click', launchRun);

document.getElementById('btn-pause')!.addEventListener('click', () => game.pause());
document.getElementById('btn-resume')!.addEventListener('click', () => game.resume());
document.getElementById('btn-quit')!.addEventListener('click', () => {
  game.quitToMenu();
  resizePreview();
  refreshPreview();
  preview.start();
});
document.getElementById('btn-menu')!.addEventListener('click', () => {
  game.quitToMenu();
  resizePreview();
  refreshPreview();
  preview.start();
});
