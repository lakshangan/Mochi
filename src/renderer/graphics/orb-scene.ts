import * as THREE from 'three';
import { PetAnimationState } from '../../shared/types';
import { FaceTextureManager } from './orb-materials';
import { MochiParticleSystem } from './particle-system';

export class MochiOrbScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private rootGroup: THREE.Group;
  private faceManager: FaceTextureManager;
  private particleSystem: MochiParticleSystem;
  private orbitalRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;

  private isRunning = true;
  private clock: THREE.Clock;
  private currentState: PetAnimationState = 'idle';
  private targetGaze = { x: 0, y: 0 };
  private currentTilt = { x: 0, y: 0 };
  private bounceOffset = 0;
  private bounceVelocity = 0;
  private isTimerActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 3.4);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.faceManager = new FaceTextureManager(512);

    // Scale the entire orb down slightly for sleek minimal desktop footprint
    this.rootGroup.scale.set(0.72, 0.72, 0.72);

    // 1. Inner Glowing Living Aura Screen (Gemini / Siri iridescent face)
    const screenGeo = new THREE.PlaneGeometry(1.65, 1.65);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.faceManager.texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0.95);
    this.rootGroup.add(screenMesh);

    // 2. Solid Deep Obsidian Sphere Body
    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellMat = new THREE.MeshPhongMaterial({
      color: 0x080911,
      transparent: false,
      shininess: 100,
      specular: 0x1e293b,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    this.rootGroup.add(shellMesh);

    // 3. Holographic Orbital Countdown Ring (Visible during Active Timers)
    const ringGeo = new THREE.TorusGeometry(1.24, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.orbitalRing = new THREE.Mesh(ringGeo, ringMat);
    this.orbitalRing.rotation.x = Math.PI / 2.3;
    this.rootGroup.add(this.orbitalRing);

    // 4. Stardust Particles (Emitting softly around the aura)
    this.particleSystem = new MochiParticleSystem();
    this.particleSystem.group.position.y = 0.85;
    this.rootGroup.add(this.particleSystem.group);

    // 5. Studio Lighting with Siri / Gemini Cyber Rim Glow
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x7f5af0, 1.8);
    rimLight.position.set(-2, 3, -2);
    this.scene.add(rimLight);

    const keyLight = new THREE.DirectionalLight(0x00f7ff, 2.2);
    keyLight.position.set(2, 2, 2);
    this.scene.add(keyLight);

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onResize = (): void => {
    if (!this.container || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setState(state: PetAnimationState): void {
    this.currentState = state;
    this.faceManager.setExpression(state, this.targetGaze);

    if (state === 'happy' || state === 'celebrating') {
      this.bounceVelocity = 0.45;
      this.particleSystem.burst();
    } else if (state === 'reminding') {
      this.bounceVelocity = 0.25;
    }
  }

  public setTimer(active: boolean, progress = 0, remainingText = ''): void {
    this.isTimerActive = active;
    this.faceManager.setTimer(active, progress, remainingText);
  }

  public setSpeaking(speaking: boolean): void {
    this.faceManager.setSpeaking(speaking);
  }

  public setGaze(x: number, y: number): void {
    this.targetGaze = { x, y };
    this.faceManager.setExpression(this.currentState, this.targetGaze);
  }

  public triggerBlink(): void {
    if (this.currentState === 'sleeping') return;
    this.faceManager.setExpression('blink', this.targetGaze);
    setTimeout(() => {
      this.faceManager.setExpression(this.currentState, this.targetGaze);
    }, 180);
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    this.faceManager.update(delta);
    this.particleSystem.update(delta, this.currentState);

    // Animate orbital ring opacity & rotation when timer is active
    if (this.orbitalRing) {
      const targetOpacity = this.isTimerActive ? 0.85 : 0;
      this.orbitalRing.material.opacity += (targetOpacity - this.orbitalRing.material.opacity) * delta * 5;
      if (this.isTimerActive) {
        this.orbitalRing.rotation.z += delta * 0.8;
      }
    }

    // Physical bounce physics
    if (this.bounceVelocity !== 0 || this.bounceOffset > 0) {
      this.bounceOffset += this.bounceVelocity * delta * 8;
      this.bounceVelocity -= 9.8 * delta * 0.4;
      if (this.bounceOffset <= 0) {
        this.bounceOffset = 0;
        this.bounceVelocity = 0;
      }
    }

    // Organic floating sine wave
    const floatFrequency = this.currentState === 'sleeping' ? 0.8 : 1.5;
    const floatAmplitude = this.currentState === 'sleeping' ? 0.02 : 0.04;
    const floatY = Math.sin(elapsedTime * floatFrequency) * floatAmplitude + this.bounceOffset;
    this.rootGroup.position.y = floatY;

    // Smooth head-tilt gaze tracking
    const targetTiltX = this.targetGaze.y * 0.2;
    const targetTiltY = this.targetGaze.x * 0.3;
    this.currentTilt.x += (targetTiltX - this.currentTilt.x) * delta * 5;
    this.currentTilt.y += (targetTiltY - this.currentTilt.y) * delta * 5;

    this.rootGroup.rotation.x = this.currentTilt.x;
    this.rootGroup.rotation.y = this.currentTilt.y;

    this.renderer.render(this.scene, this.camera);
  };

  public destroy(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
