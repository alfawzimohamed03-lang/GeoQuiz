import * as THREE from 'three';
import type { CarClassConfig, PilotConfig } from './types';

function box(w: number, h: number, d: number, color: string, metalness = 0.35, roughness = 0.45): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildWheel(radius: number, width: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, width, 14);
  const mat = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.9, metalness: 0.1 });
  const wheel = new THREE.Mesh(geo, mat);
  wheel.rotation.z = Math.PI / 2;
  wheel.castShadow = true;
  return wheel;
}

export function buildPilotBust(pilot: PilotConfig, scale = 1): THREE.Group {
  const group = new THREE.Group();

  const torso = box(0.34 * scale, 0.32 * scale, 0.24 * scale, pilot.outfitColor, 0.1, 0.8);
  torso.position.y = 0.18 * scale;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13 * scale, 14, 12),
    new THREE.MeshStandardMaterial({ color: pilot.skinColor, roughness: 0.7 }),
  );
  head.position.y = 0.44 * scale;
  head.castShadow = true;
  group.add(head);

  const eyeGeo = new THREE.SphereGeometry(0.015 * scale, 6, 6);
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#1c1c1c' });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(0.05 * scale, 0.45 * scale, 0.11 * scale);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.05 * scale;
  group.add(eyeL, eyeR);

  return group;
}

export function buildCarMesh(cls: CarClassConfig, color: string, pilot?: PilotConfig): THREE.Group {
  const group = new THREE.Group();
  const { bodyLength: L, bodyWidth: W, bodyHeight: H, wheelRadius: R } = cls;

  const chassisH = H * 0.45;
  const chassis = box(W, chassisH, L, color);
  chassis.position.y = R + chassisH / 2;
  group.add(chassis);

  let cabinW = W * 0.82;
  let cabinH = H * 0.55;
  let cabinL = L * 0.46;
  let cabinOffsetZ = -L * 0.03;

  if (cls.id === 'sedan') {
    cabinL = L * 0.4;
    cabinOffsetZ = -L * 0.06;
  } else if (cls.id === 'suv') {
    cabinH = H * 0.62;
    cabinL = L * 0.56;
  } else if (cls.id === 'supercar') {
    cabinH = H * 0.38;
    cabinW = W * 0.7;
    cabinL = L * 0.34;
    cabinOffsetZ = 0.1 * L;
  }

  const cabin = box(cabinW, cabinH, cabinL, color, 0.35, 0.4);
  cabin.position.y = R + chassisH + cabinH / 2;
  cabin.position.z = cabinOffsetZ;
  group.add(cabin);

  const glassMat = new THREE.MeshStandardMaterial({
    color: '#8fc7e8',
    transparent: true,
    opacity: 0.55,
    metalness: 0.2,
    roughness: 0.15,
  });
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(cabinW * 0.96, cabinH * 0.7, cabinL * 0.9), glassMat);
  windshield.position.copy(cabin.position);
  windshield.position.y += cabinH * 0.02;
  group.add(windshield);

  if (pilot) {
    const bust = buildPilotBust(pilot, W / 1.8);
    bust.position.set(0, R + chassisH + 0.02, cabin.position.z + cabinL * 0.12);
    group.add(bust);
  }

  // headlights / taillights
  const headMat = new THREE.MeshStandardMaterial({ color: '#fff6cf', emissive: '#ffdf80', emissiveIntensity: 1.4 });
  const tailMat = new THREE.MeshStandardMaterial({ color: '#c93030', emissive: '#c93030', emissiveIntensity: 1.1 });
  const lightGeo = new THREE.BoxGeometry(W * 0.16, chassisH * 0.35, 0.06);
  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(lightGeo, headMat);
    head.position.set((side * W) / 2.4, R + chassisH * 0.55, -L / 2 - 0.02);
    group.add(head);
    const tail = new THREE.Mesh(lightGeo, tailMat);
    tail.position.set((side * W) / 2.4, R + chassisH * 0.55, L / 2 + 0.02);
    group.add(tail);
  }

  // class-specific accents
  if (cls.id === 'suv') {
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, cabinL * 0.9, 6),
      new THREE.MeshStandardMaterial({ color: '#1c1c1c' }),
    );
    rail.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) {
      const r = rail.clone();
      r.position.set((side * cabinW) / 2, cabin.position.y + cabinH / 2 + 0.03, cabin.position.z);
      group.add(r);
    }
  }
  if (cls.id === 'supercar') {
    const wing = box(W * 0.95, 0.06, 0.3, '#161616', 0.3, 0.6);
    wing.position.set(0, R + chassisH + 0.28, L / 2 - 0.15);
    group.add(wing);
    const strutGeo = new THREE.BoxGeometry(0.05, 0.22, 0.05);
    const strutMat = new THREE.MeshStandardMaterial({ color: '#161616' });
    for (const side of [-1, 1]) {
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.position.set((side * W) / 2.6, R + chassisH + 0.16, L / 2 - 0.15);
      group.add(strut);
    }
  }

  const wheelWidth = W * 0.16;
  const wheelXOffset = W / 2 - wheelWidth * 0.4;
  const wheelZOffset = L / 2 - R * 1.3;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const wheel = buildWheel(R, wheelWidth);
      wheel.position.set(sx * wheelXOffset, R, sz * wheelZOffset);
      group.add(wheel);
    }
  }

  return group;
}
