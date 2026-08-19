import * as THREE from 'three';
import { buildCarMesh, buildPilotBust } from './carFactory';
import type { CarClassConfig, PilotConfig } from './types';

export class Preview {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private current: THREE.Object3D | null = null;
  private rafId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);

    const ambient = new THREE.AmbientLight('#8fa0c9', 0.7);
    const key = new THREE.DirectionalLight('#fff3d0', 1.4);
    key.position.set(3, 4, 4);
    const rim = new THREE.DirectionalLight('#5c7fe0', 0.6);
    rim.position.set(-4, 2, -3);
    this.scene.add(ambient, key, rim);

    this.resize(canvas.clientWidth || 200, canvas.clientHeight || 160);
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
  }

  showCar(cls: CarClassConfig, color: string) {
    this.clear();
    const car = buildCarMesh(cls, color);
    car.rotation.y = Math.PI * 0.15;
    this.current = car;
    this.scene.add(car);
    const dist = Math.max(cls.bodyLength, cls.bodyWidth) * 1.55;
    this.camera.position.set(dist * 0.8, dist * 0.55, dist);
    this.camera.lookAt(0, 0.4, 0);
  }

  showPilot(pilot: PilotConfig) {
    this.clear();
    const bust = buildPilotBust(pilot, 2.1);
    this.current = bust;
    this.scene.add(bust);
    this.camera.position.set(0.9, 0.75, 1.6);
    this.camera.lookAt(0, 0.55, 0);
  }

  private clear() {
    if (this.current) {
      this.scene.remove(this.current);
      this.current.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      this.current = null;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    const animate = () => {
      if (!this.running) return;
      if (this.current) this.current.rotation.y += 0.012;
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }
}
