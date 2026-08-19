import * as THREE from 'three';
import { InputHandler } from './input';
import { PlayerController } from './PlayerController';
import { buildCarMesh } from './carFactory';
import {
  buildGround,
  buildRoadSurface,
  buildSkyDome,
  createCityTiles,
  updateCityTiles,
  updateRoadScroll,
} from './cityTrack';
import type { WorldEntity } from './traffic';
import { spawnObstacle, spawnTraffic, updateEntity, disposeEntity } from './traffic';
import type { CarClassConfig, ChallengeConfig, LevelConfig, PilotConfig } from './types';
import { clamp, lerp, randomInt, randomRange } from './utils';
import { getBestScore, setBestScore } from './storage';

type EndReason = 'crash' | 'contact' | 'timeout' | 'time-success' | 'no-collision-success';

interface FloatingText {
  el: HTMLDivElement;
  life: number;
}

export class Game3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private input: InputHandler;

  private level: LevelConfig | null = null;
  private challenge: ChallengeConfig | null = null;
  private player: PlayerController | null = null;

  private cityTiles: ReturnType<typeof createCityTiles> = [];
  private roadMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private skyMesh: THREE.Mesh | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private sunLight: THREE.DirectionalLight | null = null;

  private entities: WorldEntity[] = [];
  private floatingTexts: FloatingText[] = [];
  private floatingLayer: HTMLElement;

  private distance = 0;
  private bonusPoints = 0;
  private elapsedTime = 0;
  private spawnTimer = 0;

  private jamActive = false;
  private nextJamAtDistance = 0;
  private jamEndAtDistance = 0;

  private cameraShake = 0;
  private collisionThisFrame = false;

  private running = false;
  private timer = new THREE.Timer();
  private rafId = 0;
  private bestScore = 0;

  private hud: {
    root: HTMLElement;
    score: HTMLElement;
    distance: HTMLElement;
    speed: HTMLElement;
    timerBadge: HTMLElement;
    timer: HTMLElement;
    healthFill: HTMLElement;
    jamWarning: HTMLElement;
  };

  private screens: {
    menu: HTMLElement;
    pause: HTMLElement;
    gameover: HTMLElement;
    touchControls: HTMLElement;
  };

  private gameoverEls: {
    title: HTMLElement;
    subtitle: HTMLElement;
    score: HTMLElement;
    distance: HTMLElement;
    best: HTMLElement;
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500);

    this.floatingLayer = document.getElementById('floating-layer')!;

    this.hud = {
      root: document.getElementById('hud')!,
      score: document.getElementById('hud-score')!,
      distance: document.getElementById('hud-distance')!,
      speed: document.getElementById('hud-speed')!,
      timerBadge: document.getElementById('hud-timer-badge')!,
      timer: document.getElementById('hud-timer')!,
      healthFill: document.getElementById('health-fill')!,
      jamWarning: document.getElementById('jam-warning')!,
    };

    this.screens = {
      menu: document.getElementById('screen-menu')!,
      pause: document.getElementById('screen-pause')!,
      gameover: document.getElementById('screen-gameover')!,
      touchControls: document.getElementById('touch-controls')!,
    };

    this.gameoverEls = {
      title: document.getElementById('gameover-title')!,
      subtitle: document.getElementById('gameover-subtitle')!,
      score: document.getElementById('final-score')!,
      distance: document.getElementById('final-distance')!,
      best: document.getElementById('final-best')!,
    };

    this.input = new InputHandler(() => this.togglePause());

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      this.screens.touchControls.classList.remove('hidden');
      this.input.bindTouchButton(document.getElementById('btn-left'), 'left');
      this.input.bindTouchButton(document.getElementById('btn-right'), 'right');
      this.input.bindTouchButton(document.getElementById('btn-gas'), 'gas');
      this.input.bindTouchButton(document.getElementById('btn-brake'), 'brake');
    }

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  private resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
  }

  private clearScene() {
    for (const tile of this.cityTiles) this.scene.remove(tile.group);
    this.cityTiles = [];
    for (const e of this.entities) disposeEntity(this.scene, e);
    this.entities = [];
    if (this.roadMesh) this.scene.remove(this.roadMesh);
    if (this.groundMesh) this.scene.remove(this.groundMesh);
    if (this.skyMesh) this.scene.remove(this.skyMesh);
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.sunLight) this.scene.remove(this.sunLight);
    if (this.player) this.scene.remove(this.player.mesh);
    for (const ft of this.floatingTexts) ft.el.remove();
    this.floatingTexts = [];
  }

  private buildLevelScene(level: LevelConfig) {
    this.scene.fog = new THREE.Fog(level.fogColor, level.fogNear, level.fogFar);
    this.scene.background = new THREE.Color(level.fogColor);

    this.skyMesh = buildSkyDome(level.skyTop, level.skyBottom);
    this.scene.add(this.skyMesh);

    this.groundMesh = buildGround(level);
    this.scene.add(this.groundMesh);

    this.roadMesh = buildRoadSurface(level);
    this.scene.add(this.roadMesh);

    this.cityTiles = createCityTiles(this.scene);

    this.ambientLight = new THREE.AmbientLight(level.ambientColor, level.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(level.sunColor, level.sunIntensity);
    this.sunLight.position.set(-18, 26, 12);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.left = -18;
    this.sunLight.shadow.camera.right = 18;
    this.sunLight.shadow.camera.top = 18;
    this.sunLight.shadow.camera.bottom = -18;
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.bias = -0.002;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  private addHeadlights(mesh: THREE.Group, cls: CarClassConfig) {
    for (const side of [-1, 1]) {
      const spot = new THREE.SpotLight('#fff3d0', 6, 26, Math.PI / 6.2, 0.5, 1.4);
      spot.position.set((side * cls.bodyWidth) / 2.6, 0.55, -cls.bodyLength / 2 - 0.1);
      const target = new THREE.Object3D();
      target.position.set((side * cls.bodyWidth) / 4, 0.1, -cls.bodyLength / 2 - 14);
      mesh.add(spot, target);
      spot.target = target;
    }
  }

  startRun(
    level: LevelConfig,
    challenge: ChallengeConfig,
    carClass: CarClassConfig,
    carColor: string,
    pilot: PilotConfig,
  ) {
    this.clearScene();
    this.level = level;
    this.challenge = challenge;
    this.bestScore = getBestScore(level.id, challenge.id);

    this.buildLevelScene(level);

    const carMesh = buildCarMesh(carClass, carColor, pilot);
    carMesh.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) obj.castShadow = true;
    });
    this.addHeadlights(carMesh, carClass);
    this.scene.add(carMesh);
    this.player = new PlayerController(carMesh, carClass);

    this.entities = [];
    this.floatingTexts = [];
    this.distance = 0;
    this.bonusPoints = 0;
    this.elapsedTime = 0;
    this.spawnTimer = 0.6;
    this.jamActive = false;
    this.nextJamAtDistance = randomRange(level.jamIntervalRange[0], level.jamIntervalRange[1]);
    this.jamEndAtDistance = 0;
    this.cameraShake = 0;
    this.input.reset();

    this.camera.position.set(0, 3.6, 7.8);
    this.camera.lookAt(0, 1, -12);

    this.hideAllScreens();
    this.hud.root.classList.remove('hidden');
    this.hud.timerBadge.classList.toggle('hidden', challenge.id !== 'timeTrial');
    this.hud.jamWarning.classList.add('hidden');

    this.resize();
    this.running = true;
    this.timer.reset();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  togglePause() {
    if (!this.running) return;
    this.pause();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.screens.pause.classList.remove('hidden');
  }

  resume() {
    if (this.running) return;
    this.screens.pause.classList.add('hidden');
    this.running = true;
    this.input.reset();
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  quitToMenu() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.hideAllScreens();
    this.hud.root.classList.add('hidden');
    this.screens.menu.classList.remove('hidden');
  }

  private hideAllScreens() {
    this.screens.menu.classList.add('hidden');
    this.screens.pause.classList.add('hidden');
    this.screens.gameover.classList.add('hidden');
  }

  private loop() {
    if (!this.running) return;
    this.timer.update();
    const dt = clamp(this.timer.getDelta(), 0, 0.05);

    this.update(dt);
    this.renderer.render(this.scene, this.camera);

    if (this.running) {
      this.rafId = requestAnimationFrame(() => this.loop());
    }
  }

  private update(dt: number) {
    if (!this.player || !this.level || !this.challenge) return;
    const level = this.level;
    const player = this.player;

    player.update(dt, this.input);

    this.distance += player.speed * dt;
    this.elapsedTime += dt;

    updateRoadScroll(this.roadMesh!, this.distance);
    updateCityTiles(this.cityTiles, player.speed, dt);

    this.updateJamZone(level);
    this.updateSpawning(level, dt);

    for (const e of this.entities) updateEntity(e, player.speed, dt);
    this.entities = this.entities.filter((e) => {
      const keep = e.z < 35 && e.z > -320;
      if (!keep) disposeEntity(this.scene, e);
      return keep;
    });

    this.collisionThisFrame = false;
    this.checkCollisions();
    this.updateFloatingTexts(dt);
    this.updateCamera(dt);

    if (this.cameraShake > 0) this.cameraShake -= dt;

    this.updateHud();
    this.checkEndConditions();
  }

  private updateJamZone(level: LevelConfig) {
    if (!this.jamActive && this.distance >= this.nextJamAtDistance) {
      this.jamActive = true;
      this.jamEndAtDistance = this.distance + randomRange(level.jamLengthRange[0], level.jamLengthRange[1]);
      this.hud.jamWarning.classList.remove('hidden');
    } else if (this.jamActive && this.distance >= this.jamEndAtDistance) {
      this.jamActive = false;
      this.nextJamAtDistance = this.distance + randomRange(level.jamIntervalRange[0], level.jamIntervalRange[1]);
      this.hud.jamWarning.classList.add('hidden');
    }
  }

  private updateSpawning(level: LevelConfig, dt: number) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const difficulty = clamp(this.distance / 1400, 0, 1);
    const baseInterval = lerp(level.spawnInterval, level.spawnInterval * 0.55, difficulty);
    const jamFactor = this.jamActive ? 0.45 : 1;
    this.spawnTimer = baseInterval * jamFactor * randomRange(0.75, 1.25);

    const lane = randomInt(0, 3);
    const spawnZ = -200;

    if (Math.random() < level.obstacleChance) {
      this.entities.push(spawnObstacle(this.scene, lane, spawnZ));
    } else {
      const trafficBase = lerp(level.baseTrafficSpeed, level.maxTrafficSpeed, difficulty);
      const jamSpeedMultiplier = this.jamActive ? randomRange(0.05, 0.25) : 1;
      const speed = trafficBase * jamSpeedMultiplier * randomRange(0.85, 1.1);
      this.entities.push(spawnTraffic(this.scene, lane, speed, spawnZ));
    }
  }

  private checkCollisions() {
    if (!this.player) return;
    const player = this.player;
    const playerHalfW = player.cls.bodyWidth / 2;
    const playerHalfL = player.cls.bodyLength / 2;

    for (const e of this.entities) {
      if (e.hit) continue;
      const overlapX = Math.abs(e.x - player.x) < playerHalfW + e.width / 2;
      const overlapZ = Math.abs(e.z - 0) < playerHalfL + e.length / 2;

      if (overlapX && overlapZ) {
        const registered = player.applyHit(e.damage, e.speedPenalty);
        if (registered) {
          e.hit = true;
          e.scored = true;
          this.collisionThisFrame = true;
          this.cameraShake = 0.25;
          this.spawnFloatingText(e.kind === 'obstacle' ? '−' : '💥', e.x, e.z);
        }
        continue;
      }

      if (e.kind === 'traffic' && !e.scored) {
        if (Math.abs(e.z) < playerHalfL + e.length / 2 + 1.2) {
          const gap = Math.abs(e.x - player.x) - (playerHalfW + e.width / 2);
          if (gap > 0 && gap < 0.6) {
            this.bonusPoints += 30;
            this.spawnFloatingText('+30 Presque !', e.x, e.z);
          }
          e.scored = true;
        }
      }
    }
  }

  private spawnFloatingText(text: string, worldX: number, worldZ: number) {
    const projected = new THREE.Vector3(worldX, 1.1, worldZ).project(this.camera);
    const screenX = (projected.x * 0.5 + 0.5) * 100;
    const screenY = (-projected.y * 0.5 + 0.5) * 100;

    const el = document.createElement('div');
    el.className = 'float-text';
    el.textContent = text;
    el.style.left = `${clamp(screenX, 3, 97)}%`;
    el.style.top = `${clamp(screenY, 5, 90)}%`;
    this.floatingLayer.appendChild(el);
    this.floatingTexts.push({ el, life: 0.9 });
  }

  private updateFloatingTexts(dt: number) {
    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.el.style.opacity = String(clamp(t.life / 0.9, 0, 1));
      t.el.style.transform = `translateY(${(1 - t.life / 0.9) * -24}px)`;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => {
      const keep = t.life > 0;
      if (!keep) t.el.remove();
      return keep;
    });
  }

  private updateCamera(dt: number) {
    if (!this.player) return;
    // Follow the player's lateral position closely so it never drifts off-frame
    // (even when pinned hard against a road edge) and exposes the scenery beyond the road.
    this.camera.position.x = lerp(this.camera.position.x, this.player.x, clamp(dt * 5, 0, 1));

    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShake > 0) {
      const mag = 0.18 * (this.cameraShake / 0.25);
      shakeX = (Math.random() - 0.5) * mag;
      shakeY = (Math.random() - 0.5) * mag;
    }

    this.camera.position.y = 3.6 + shakeY;
    this.camera.lookAt(this.player.x + shakeX, 1, -14);
  }

  private updateHud() {
    if (!this.player || !this.challenge) return;
    const score = Math.floor(this.distance) + this.bonusPoints;
    this.hud.score.textContent = String(score);
    this.hud.distance.textContent = `${Math.floor(this.distance)} m`;
    const speedKmh = Math.round(this.player.speed * 3.6);
    this.hud.speed.textContent = `${speedKmh} km/h`;
    this.hud.healthFill.style.width = `${this.player.health}%`;
    this.hud.healthFill.classList.toggle('health-low', this.player.health < 35);

    if (this.challenge.id === 'timeTrial' && this.challenge.timeLimit) {
      const remaining = Math.max(0, this.challenge.timeLimit - this.elapsedTime);
      this.hud.timer.textContent = `${Math.ceil(remaining)}s`;
    }
  }

  private checkEndConditions() {
    if (!this.player || !this.challenge) return;

    if (this.player.health <= 0) {
      this.endGame('crash');
      return;
    }
    if (this.challenge.id === 'noCollision' && this.collisionThisFrame) {
      this.endGame('contact');
      return;
    }
    if (this.challenge.targetDistance && this.distance >= this.challenge.targetDistance) {
      this.endGame(this.challenge.id === 'timeTrial' ? 'time-success' : 'no-collision-success');
      return;
    }
    if (this.challenge.id === 'timeTrial' && this.challenge.timeLimit && this.elapsedTime >= this.challenge.timeLimit) {
      this.endGame('timeout');
    }
  }

  private endGame(reason: EndReason) {
    if (!this.level || !this.challenge) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);

    const finalScore = Math.floor(this.distance) + this.bonusPoints;
    const isNewBest = setBestScore(this.level.id, this.challenge.id, finalScore);
    const best = isNewBest ? finalScore : this.bestScore;

    const copy: Record<EndReason, [string, string]> = {
      crash: ['Collision fatale 💥', 'Ta voiture est hors service.'],
      contact: ['Contact ! 💥', 'Le défi Zéro Collision exige la perfection.'],
      timeout: ['Temps écoulé ⏱️', "Tu n'as pas atteint la distance à temps."],
      'time-success': ['Défi réussi ! 🏁', 'Tu as parcouru la distance à temps.'],
      'no-collision-success': ['Parfait ! 💎', 'Aucune collision sur tout le trajet.'],
    };
    const [title, subtitle] = copy[reason];

    this.gameoverEls.title.textContent = title;
    this.gameoverEls.subtitle.textContent = subtitle;
    this.gameoverEls.score.textContent = String(finalScore);
    this.gameoverEls.distance.textContent = `${Math.floor(this.distance)} m`;
    this.gameoverEls.best.textContent = String(Math.max(best, finalScore));

    this.hud.root.classList.add('hidden');
    this.screens.gameover.classList.remove('hidden');
  }
}
