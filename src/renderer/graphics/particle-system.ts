import * as THREE from 'three';
import { PetAnimationState } from '../../shared/types';

export class MochiParticleSystem {
  public group: THREE.Group;
  private particleCount = 48;
  private geometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private velocities: Float32Array;
  private colors: Float32Array;
  private scales: Float32Array;
  private points: THREE.Points;
  private time = 0;

  constructor() {
    this.group = new THREE.Group();
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.scales = new Float32Array(this.particleCount);

    this.geometry = new THREE.BufferGeometry();
    this.initParticles();

    // Create custom particle circle texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.3, 'rgba(0, 247, 255, 0.8)');
      grad.addColorStop(0.7, 'rgba(127, 90, 240, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
      opacity: 0.85,
    });

    this.points = new THREE.Points(this.geometry, material);
    this.group.add(this.points);
  }

  private initParticles(): void {
    const cyan = new THREE.Color('#00f7ff');
    const violet = new THREE.Color('#7f5af0');
    const gold = new THREE.Color('#ffd166');

    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, false);

      const color = i % 3 === 0 ? violet : i % 3 === 1 ? cyan : gold;
      this.colors[i * 3] = color.r;
      this.colors[i * 3 + 1] = color.g;
      this.colors[i * 3 + 2] = color.b;
      this.scales[i] = 0.5 + Math.random() * 0.8;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
  }

  private resetParticle(i: number, burst = false): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = burst ? 0.3 + Math.random() * 0.4 : 1.1 + Math.random() * 0.6;
    const y = burst ? -0.2 + Math.random() * 0.4 : -0.6 + Math.random() * 1.5;

    this.positions[i * 3] = Math.cos(angle) * radius;
    this.positions[i * 3 + 1] = y;
    this.positions[i * 3 + 2] = Math.sin(angle) * radius;

    if (burst) {
      this.velocities[i * 3] = (Math.random() - 0.5) * 1.5;
      this.velocities[i * 3 + 1] = 0.8 + Math.random() * 1.8;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    } else {
      this.velocities[i * 3] = (Math.random() - 0.5) * 0.08;
      this.velocities[i * 3 + 1] = 0.05 + Math.random() * 0.15;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
  }

  public burst(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.resetParticle(i, true);
    }
  }

  public update(delta: number, state: PetAnimationState): void {
    this.time += delta;
    const speedMultiplier = state === 'sleeping' ? 0.25 : state === 'celebrating' ? 2.5 : 1.0;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;

      // Orbit rotation around center
      const currentX = this.positions[idx];
      const currentZ = this.positions[idx + 2];
      const angle = 0.4 * delta * speedMultiplier;
      this.positions[idx] = currentX * Math.cos(angle) - currentZ * Math.sin(angle);
      this.positions[idx + 2] = currentX * Math.sin(angle) + currentZ * Math.cos(angle);

      // Vertical drift
      this.positions[idx + 1] += this.velocities[idx + 1] * delta * speedMultiplier;

      // If drifted too high or far, reset
      if (this.positions[idx + 1] > 1.8 || Math.abs(this.positions[idx]) > 2.2) {
        this.resetParticle(i, state === 'celebrating');
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}
