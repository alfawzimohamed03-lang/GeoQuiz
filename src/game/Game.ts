import { InputHandler } from './input';
import { PlayerCar } from './PlayerCar';
import type { WorldEntity } from './entities';
import { spawnObstacle, spawnTraffic } from './entities';
import type { ChallengeConfig, LevelConfig } from './types';
import { clamp, lerp, randomInt, randomRange, rectsOverlap } from './utils';
import { getBestScore, setBestScore } from './storage';

const PX_PER_METER = 12;
const NEAR_MISS_PX = 16;

type EndReason = 'crash' | 'contact' | 'timeout' | 'time-success' | 'no-collision-success';

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface SceneryProp {
  x: number;
  y: number;
  side: 'left' | 'right';
  kind: string;
  size: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputHandler;

  private level: LevelConfig | null = null;
  private challenge: ChallengeConfig | null = null;
  private player: PlayerCar | null = null;

  private roadLeft = 0;
  private roadRight = 0;
  private laneWidth = 0;
  private playerY = 0;

  private entities: WorldEntity[] = [];
  private scenery: SceneryProp[] = [];
  private floatingTexts: FloatingText[] = [];

  private distance = 0;
  private bonusPoints = 0;
  private elapsedTime = 0;
  private spawnTimer = 0;
  private sceneryTimer = 0;
  private dashOffset = 0;

  private jamActive = false;
  private nextJamAtDistance = 0;
  private jamEndAtDistance = 0;

  private shakeTimer = 0;
  private collisionThisFrame = false;

  private running = false;
  private lastTime = 0;
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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;

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

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();
  }

  private resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.computeRoadBounds();
  }

  private computeRoadBounds() {
    if (!this.level) return;
    const w = window.innerWidth;
    const roadWidth = w * this.level.roadWidthRatio;
    this.roadLeft = (w - roadWidth) / 2;
    this.roadRight = this.roadLeft + roadWidth;
    this.laneWidth = roadWidth / this.level.laneCount;
    this.playerY = window.innerHeight * 0.78;
    this.player?.updateBounds(this.roadLeft, this.roadRight);
  }

  startRun(level: LevelConfig, challenge: ChallengeConfig) {
    this.level = level;
    this.challenge = challenge;
    this.bestScore = getBestScore(level.id, challenge.id);
    this.computeRoadBounds();

    this.player = new PlayerCar(this.roadLeft, this.roadRight, level, this.laneWidth);
    this.entities = [];
    this.scenery = [];
    this.floatingTexts = [];
    this.distance = 0;
    this.bonusPoints = 0;
    this.elapsedTime = 0;
    this.spawnTimer = 0.4;
    this.sceneryTimer = 0.2;
    this.dashOffset = 0;
    this.jamActive = false;
    this.nextJamAtDistance = randomRange(level.jamIntervalRange[0], level.jamIntervalRange[1]);
    this.jamEndAtDistance = 0;
    this.shakeTimer = 0;
    this.input.reset();

    this.hideAllScreens();
    this.hud.root.classList.remove('hidden');
    this.hud.timerBadge.classList.toggle('hidden', challenge.id !== 'timeTrial');
    this.hud.jamWarning.classList.add('hidden');

    this.running = true;
    this.lastTime = 0;
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((t) => this.loop(t));
  }

  retry() {
    if (this.level && this.challenge) this.startRun(this.level, this.challenge);
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
    this.lastTime = 0;
    this.input.reset();
    this.rafId = requestAnimationFrame((t) => this.loop(t));
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

  private loop(timestamp: number) {
    if (!this.running) return;
    if (this.lastTime === 0) this.lastTime = timestamp;
    const dt = clamp((timestamp - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    if (this.running) {
      this.rafId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private update(dt: number) {
    if (!this.player || !this.level || !this.challenge) return;
    const level = this.level;
    const player = this.player;

    player.update(dt, this.input, level.surfaceRough);

    const distanceDelta = (player.speed * dt) / PX_PER_METER;
    this.distance += distanceDelta;
    this.elapsedTime += dt;
    this.dashOffset += player.speed * dt;

    this.updateJamZone();
    this.updateSpawning(dt);
    this.updateScenery(dt);
    this.updateEntities(dt);
    this.collisionThisFrame = false;
    this.checkCollisions();
    this.updateFloatingTexts(dt);

    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    this.updateHud();
    this.checkEndConditions();
  }

  private updateJamZone() {
    if (!this.level) return;
    const level = this.level;
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

  private updateSpawning(dt: number) {
    if (!this.level) return;
    const level = this.level;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const difficulty = clamp(this.distance / 2000, 0, 1);
    const baseInterval = lerp(level.trafficSpawnInterval, level.trafficSpawnInterval * 0.55, difficulty);
    const jamFactor = this.jamActive ? 0.5 : 1;
    this.spawnTimer = baseInterval * jamFactor * randomRange(0.7, 1.3);

    const lane = randomInt(0, level.laneCount - 1);
    const spawnY = -140;

    if (Math.random() < level.obstacleChance) {
      this.entities.push(spawnObstacle(level, this.laneWidth, this.roadLeft, lane, spawnY));
    } else {
      const trafficBase = lerp(level.baseTrafficSpeed, level.maxTrafficSpeed, difficulty);
      const jamSpeedMultiplier = this.jamActive ? randomRange(0.05, 0.25) : 1;
      const speed = trafficBase * jamSpeedMultiplier * randomRange(0.85, 1.1);
      this.entities.push(spawnTraffic(level, this.laneWidth, this.roadLeft, lane, speed, spawnY));
    }
  }

  private updateScenery(dt: number) {
    if (!this.level || !this.player) return;
    this.sceneryTimer -= dt;
    const kinds: Record<string, string[]> = {
      city: ['building', 'lamp'],
      highway: ['guardrail', 'sign'],
      savanna: ['baobab', 'bush', 'hut'],
    };
    if (this.sceneryTimer <= 0) {
      this.sceneryTimer = randomRange(0.5, 0.9);
      const pool = kinds[this.level.scenery];
      const kind = pool[randomInt(0, pool.length - 1)];
      const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
      this.scenery.push({
        x: side === 'left' ? this.roadLeft - randomRange(20, 70) : this.roadRight + randomRange(20, 70),
        y: -60,
        side,
        kind,
        size: randomRange(0.7, 1.3),
      });
    }
    for (const prop of this.scenery) {
      prop.y += this.player.speed * dt;
    }
    this.scenery = this.scenery.filter((p) => p.y < window.innerHeight + 80);
  }

  private updateEntities(dt: number) {
    if (!this.player) return;
    const player = this.player;
    for (const e of this.entities) {
      const relativeSpeed = player.speed - e.forwardSpeed;
      e.y += relativeSpeed * dt;
      if (e.driftVx !== 0) {
        e.x += e.driftVx * dt;
        if (e.x < this.roadLeft + e.width / 2 || e.x > this.roadRight - e.width / 2) {
          e.driftVx *= -1;
          e.x = clamp(e.x, this.roadLeft + e.width / 2, this.roadRight - e.width / 2);
        }
      }
    }
    this.entities = this.entities.filter((e) => e.y - e.height / 2 < window.innerHeight + 60 && e.y + e.height / 2 > -400);
  }

  private checkCollisions() {
    if (!this.player) return;
    const player = this.player;
    const playerRect = {
      x: player.x - player.width / 2,
      y: this.playerY - player.height / 2,
      width: player.width,
      height: player.height,
    };

    for (const e of this.entities) {
      if (e.hit) continue;
      const entityRect = { x: e.x - e.width / 2, y: e.y - e.height / 2, width: e.width, height: e.height };

      if (rectsOverlap(playerRect, entityRect)) {
        const registered = player.applyHit(e.damage, e.speedPenalty);
        if (registered) {
          e.hit = true;
          e.scored = true;
          this.collisionThisFrame = true;
          this.shakeTimer = 0.25;
          this.spawnFloatingText(e.kind === 'obstacle' ? '-' : '💥', e.x, e.y, '#ff5252');
        }
        continue;
      }

      if (e.kind === 'traffic' && !e.scored) {
        const verticalGap = Math.abs(e.y - this.playerY);
        if (verticalGap < e.height / 2 + player.height / 2 + 4) {
          const horizontalGap = Math.abs(e.x - player.x) - (e.width / 2 + player.width / 2);
          if (horizontalGap > 0 && horizontalGap < NEAR_MISS_PX) {
            this.bonusPoints += 30;
            this.spawnFloatingText('+30 Presque !', e.x, e.y, '#e3b23c');
          }
          e.scored = true;
        }
      }
    }
  }

  private spawnFloatingText(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({ x, y, text, life: 0.9, color });
  }

  private updateFloatingTexts(dt: number) {
    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.y -= 28 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);
  }

  private updateHud() {
    if (!this.player || !this.challenge) return;
    const score = Math.floor(this.distance) + this.bonusPoints;
    this.hud.score.textContent = String(score);
    this.hud.distance.textContent = `${Math.floor(this.distance)} m`;
    const speedKmh = Math.round((this.player.speed / PX_PER_METER) * 3.6);
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

  private render() {
    if (!this.level || !this.player) return;
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    if (this.shakeTimer > 0) {
      const mag = 7 * (this.shakeTimer / 0.25);
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    this.drawBackground(ctx, w, h);
    this.drawScenery(ctx);
    this.drawRoad(ctx, w, h);
    this.drawEntities(ctx);
    this.drawPlayer(ctx);
    this.drawFloatingTexts(ctx);

    if (this.player.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,0,0,${clamp(this.player.hitFlash / 0.7, 0, 1) * 0.22})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.jamActive) {
      ctx.fillStyle = 'rgba(230,150,20,0.05)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const level = this.level!;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (level.scenery === 'city') {
      grad.addColorStop(0, '#2a2f3d');
      grad.addColorStop(1, '#454b57');
    } else if (level.scenery === 'highway') {
      grad.addColorStop(0, '#2f3947');
      grad.addColorStop(1, '#4a5568');
    } else {
      grad.addColorStop(0, '#e58a4e');
      grad.addColorStop(0.5, '#d97a3f');
      grad.addColorStop(1, '#c9a463');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private drawScenery(ctx: CanvasRenderingContext2D) {
    for (const prop of this.scenery) {
      const s = prop.size;
      ctx.save();
      ctx.translate(prop.x, prop.y);
      switch (prop.kind) {
        case 'building': {
          const bw = 46 * s;
          const bh = 90 * s;
          ctx.fillStyle = '#5b5f6b';
          ctx.fillRect(-bw / 2, -bh, bw, bh);
          ctx.fillStyle = '#e3b23c';
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
              ctx.fillRect(-bw / 2 + 6 + j * (bw / 2 - 4), -bh + 10 + i * (bh / 3), 8 * s, 8 * s);
            }
          }
          break;
        }
        case 'lamp':
          ctx.fillStyle = '#33363f';
          ctx.fillRect(-2, -50 * s, 4, 50 * s);
          ctx.fillStyle = '#ffe28a';
          ctx.beginPath();
          ctx.arc(0, -50 * s, 6 * s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'guardrail':
          ctx.fillStyle = '#c7ccd1';
          ctx.fillRect(-30 * s, -4, 60 * s, 8);
          break;
        case 'sign':
          ctx.fillStyle = '#33363f';
          ctx.fillRect(-2, -46 * s, 4, 46 * s);
          ctx.fillStyle = '#2f9e6e';
          ctx.fillRect(-18 * s, -46 * s, 36 * s, 20 * s);
          break;
        case 'baobab':
          ctx.fillStyle = '#7a5230';
          ctx.fillRect(-5 * s, -20 * s, 10 * s, 20 * s);
          ctx.fillStyle = '#5c7a3f';
          ctx.beginPath();
          ctx.arc(0, -30 * s, 20 * s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'bush':
          ctx.fillStyle = '#4f6b3a';
          ctx.beginPath();
          ctx.arc(0, -8 * s, 12 * s, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'hut':
          ctx.fillStyle = '#c9a463';
          ctx.fillRect(-14 * s, -18 * s, 28 * s, 18 * s);
          ctx.fillStyle = '#7a5230';
          ctx.beginPath();
          ctx.moveTo(-18 * s, -18 * s);
          ctx.lineTo(0, -34 * s);
          ctx.lineTo(18 * s, -18 * s);
          ctx.closePath();
          ctx.fill();
          break;
      }
      ctx.restore();
    }
  }

  private drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const level = this.level!;
    ctx.fillStyle = level.roadColor;
    ctx.fillRect(this.roadLeft, 0, this.roadRight - this.roadLeft, h);

    ctx.strokeStyle = level.edgeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.roadLeft, 0);
    ctx.lineTo(this.roadLeft, h);
    ctx.moveTo(this.roadRight, 0);
    ctx.lineTo(this.roadRight, h);
    ctx.stroke();

    const dashLen = 34;
    const gapLen = 24;
    const period = dashLen + gapLen;
    const offset = this.dashOffset % period;

    ctx.strokeStyle = level.laneMarkingColor;
    ctx.lineWidth = 3;
    for (let lane = 1; lane < level.laneCount; lane++) {
      const x = this.roadLeft + this.laneWidth * lane;
      ctx.beginPath();
      for (let y = -period + offset; y < h; y += period) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + dashLen);
      }
      ctx.stroke();
    }
    void w;
  }

  private drawEntities(ctx: CanvasRenderingContext2D) {
    const sorted = [...this.entities].sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.globalAlpha = e.hit ? 0.55 : 1;
      if (e.kind === 'traffic') {
        this.drawCarShape(ctx, e.width, e.height, e.color, e.subtype);
      } else {
        this.drawObstacleShape(ctx, e.width, e.height, e.color, e.accentColor, e.subtype);
      }
      ctx.restore();
    }
  }

  private drawCarShape(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    color: string,
    subtype: string,
  ) {
    const r = Math.min(w, h) * 0.22;
    roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();

    if (subtype !== 'moto') {
      ctx.fillStyle = 'rgba(180,220,255,0.75)';
      const wsH = h * 0.28;
      roundRect(ctx, -w * 0.38, -h / 2 + h * 0.14, w * 0.76, wsH, 3);
      ctx.fill();
    } else {
      ctx.fillStyle = '#1c1c1c';
      ctx.beginPath();
      ctx.arc(0, -h * 0.22, w * 0.42, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(-w / 2, -h / 2, w * 0.18, h * 0.08);
    ctx.fillRect(w / 2 - w * 0.18, -h / 2, w * 0.18, h * 0.08);
    ctx.fillStyle = '#c94f4f';
    ctx.fillRect(-w / 2, h / 2 - h * 0.08, w * 0.18, h * 0.08);
    ctx.fillRect(w / 2 - w * 0.18, h / 2 - h * 0.08, w * 0.18, h * 0.08);
  }

  private drawObstacleShape(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    color: string,
    accent: string,
    subtype: string,
  ) {
    switch (subtype) {
      case 'speed_bump':
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h, h / 2);
        ctx.fill();
        ctx.strokeStyle = '#1c1c1c';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'pothole':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'cone':
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-w / 2, h * 0.05, w, h * 0.14);
        break;
      case 'debris':
        ctx.fillStyle = color;
        ctx.save();
        ctx.rotate(0.4);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
        break;
      case 'animal':
        ctx.fillStyle = color;
        roundRect(ctx, -w / 2, -h / 2, w, h * 0.7, w * 0.3);
        ctx.fill();
        ctx.fillRect(-w * 0.15, h * 0.1, w * 0.1, h * 0.3);
        ctx.fillRect(w * 0.05, h * 0.1, w * 0.1, h * 0.3);
        break;
      case 'oil_slick':
        ctx.fillStyle = 'rgba(10,10,10,0.65)';
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const player = this.player!;
    ctx.save();
    ctx.translate(player.x, this.playerY);

    const w = player.width;
    const h = player.height;
    const r = Math.min(w, h) * 0.22;

    roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = player.hitFlash > 0 ? '#ff6b57' : '#f2b807';
    ctx.fill();

    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(-w * 0.12, -h / 2 + 2, w * 0.24, h - 4);

    ctx.fillStyle = 'rgba(180,220,255,0.85)';
    roundRect(ctx, -w * 0.36, -h / 2 + h * 0.14, w * 0.72, h * 0.26, 3);
    ctx.fill();

    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(-w / 2, -h / 2, w * 0.18, h * 0.08);
    ctx.fillRect(w / 2 - w * 0.18, -h / 2, w * 0.18, h * 0.08);
    ctx.fillStyle = '#c94f4f';
    ctx.fillRect(-w / 2, h / 2 - h * 0.08, w * 0.18, h * 0.08);
    ctx.fillRect(w / 2 - w * 0.18, h / 2 - h * 0.08, w * 0.18, h * 0.08);

    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = clamp(t.life / 0.9, 0, 1);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
