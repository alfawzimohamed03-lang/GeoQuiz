import * as THREE from 'three';
import { clamp } from './utils';
import type { CarClassConfig } from './types';
import type { InputState } from './input';
import { ROAD_LEFT, ROAD_RIGHT } from './cityTrack';

export class PlayerController {
  mesh: THREE.Group;
  x = 0;
  speed: number;
  minSpeed = 3;
  maxSpeed: number;
  health = 100;
  invulnTimer = 0;
  hitFlash = 0;

  readonly cls: CarClassConfig;
  private steerVel = 0;
  private steerAccel: number;
  private steerMax: number;
  private steerFriction = 0.86;
  private bounceT = 0;

  constructor(mesh: THREE.Group, cls: CarClassConfig) {
    this.mesh = mesh;
    this.cls = cls;
    this.maxSpeed = cls.maxSpeed;
    this.speed = cls.maxSpeed * 0.35;
    this.steerAccel = 9 * cls.handling;
    this.steerMax = 6.5 * cls.handling;
  }

  update(dt: number, input: InputState) {
    if (input.gas) {
      this.speed += this.cls.accel * dt;
    } else if (input.brake) {
      this.speed -= this.cls.accel * 2.1 * dt;
    } else {
      this.speed -= this.cls.accel * 0.55 * dt;
    }
    this.speed = clamp(this.speed, this.minSpeed, this.maxSpeed);

    let steerInput = 0;
    if (input.left) steerInput -= 1;
    if (input.right) steerInput += 1;
    this.steerVel += steerInput * this.steerAccel * dt;
    this.steerVel *= this.steerFriction;
    this.steerVel = clamp(this.steerVel, -this.steerMax, this.steerMax);
    this.x += this.steerVel * dt;

    const halfW = this.cls.bodyWidth / 2;
    if (this.x < ROAD_LEFT + halfW) {
      this.x = ROAD_LEFT + halfW;
      this.steerVel = 0;
    }
    if (this.x > ROAD_RIGHT - halfW) {
      this.x = ROAD_RIGHT - halfW;
      this.steerVel = 0;
    }

    this.bounceT += dt * (2 + this.speed * 0.15);
    const bounce = Math.sin(this.bounceT) * 0.01 * (this.speed / this.maxSpeed);

    this.mesh.position.set(this.x, bounce, 0);
    this.mesh.rotation.z = clamp(-this.steerVel * 0.045, -0.16, 0.16);
    this.mesh.rotation.y = clamp(-this.steerVel * 0.035, -0.22, 0.22);

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  applyHit(damage: number, speedPenaltyMs: number): boolean {
    if (this.invulnTimer > 0) return false;
    this.health = clamp(this.health - damage, 0, 100);
    this.speed = clamp(this.speed - speedPenaltyMs, this.minSpeed, this.maxSpeed);
    this.invulnTimer = 0.7;
    this.hitFlash = 0.7;
    return true;
  }
}
