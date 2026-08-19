import { clamp } from './utils';
import type { LevelConfig } from './types';
import type { InputHandler } from './input';

export class PlayerCar {
  x: number;
  width: number;
  height: number;
  speed: number;
  minSpeed = 45;
  maxSpeed: number;
  health = 100;
  invulnTimer = 0;
  hitFlash = 0;

  private roadLeft: number;
  private roadRight: number;
  private accel: number;
  private brakeDecel = 230;
  private naturalDecel = 55;
  private steerVel = 0;
  private steerAccel: number;
  private steerMax: number;
  private steerFriction = 0.86;

  constructor(roadLeft: number, roadRight: number, level: LevelConfig, laneWidth: number) {
    this.roadLeft = roadLeft;
    this.roadRight = roadRight;
    this.width = laneWidth * 0.5;
    this.height = this.width * 1.85;
    this.x = (roadLeft + roadRight) / 2;
    this.maxSpeed = level.maxTrafficSpeed * 1.15;
    this.speed = level.baseTrafficSpeed * 0.6;
    this.accel = level.surfaceRough ? 95 : 135;
    this.steerAccel = laneWidth * (level.surfaceRough ? 3.0 : 4.2);
    this.steerMax = laneWidth * 3.4;
  }

  updateBounds(roadLeft: number, roadRight: number) {
    this.roadLeft = roadLeft;
    this.roadRight = roadRight;
  }

  update(dt: number, input: InputHandler, roughSurface: boolean) {
    if (input.gas) {
      this.speed += this.accel * dt;
    } else if (input.brake) {
      this.speed -= this.brakeDecel * dt;
    } else {
      this.speed -= this.naturalDecel * dt;
    }
    this.speed = clamp(this.speed, this.minSpeed, this.maxSpeed);

    let steerInput = 0;
    if (input.left) steerInput -= 1;
    if (input.right) steerInput += 1;
    this.steerVel += steerInput * this.steerAccel * dt;
    this.steerVel *= this.steerFriction;
    if (roughSurface) {
      this.steerVel += (Math.random() - 0.5) * 5;
    }
    this.steerVel = clamp(this.steerVel, -this.steerMax, this.steerMax);
    this.x += this.steerVel * dt;

    const halfW = this.width / 2;
    if (this.x < this.roadLeft + halfW) {
      this.x = this.roadLeft + halfW;
      this.steerVel = 0;
    }
    if (this.x > this.roadRight - halfW) {
      this.x = this.roadRight - halfW;
      this.steerVel = 0;
    }

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  /** Returns true if the hit actually registered (not currently invulnerable). */
  applyHit(damage: number, speedPenalty: number): boolean {
    if (this.invulnTimer > 0) return false;
    this.health = clamp(this.health - damage, 0, 100);
    this.speed = clamp(this.speed - speedPenalty, this.minSpeed, this.maxSpeed);
    this.invulnTimer = 0.7;
    this.hitFlash = 0.7;
    return true;
  }
}
