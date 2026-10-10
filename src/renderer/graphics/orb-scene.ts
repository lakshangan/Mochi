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

  private isRunning = true;
  private clock: THREE.Clock;
  private currentState: PetAnimationState = 'idle';
  private targetGaze = { x: 0, y: 0 };
  private currentTilt = { x: 0, y: 0 };
  private bounceOffset = 0;
  private bounceVelocity = 0;

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
    // Soften tone mapping so it doesn't crush colors
    this.renderer.toneMapping = THREE.NoToneMapping;
    container.appendChild(this.renderer.domElement);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.faceManager = new FaceTextureManager(512);

    // Inner Glowing Screen
    const screenGeo = new THREE.PlaneGeometry(1.6, 0.85);
    const screenMat = new THREE.MeshBasicMaterial({
      map: this.faceManager.texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0.1); 
    this.rootGroup.add(screenMesh);

    // Outer Glass Bubble
    const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const shellMat = new THREE.MeshPhongMaterial({
      color: 0x112244, // very dark blue tint
      transparent: true,
      opacity: 0.35,     // clear enough to see the screen inside perfectly
      shininess: 150,
      specular: 0x00f7ff, // cyan highlights
      depthWrite: false,  // Don't obscure the inner screen
      blending: THREE.NormalBlending
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    this.rootGroup.add(shellMesh);

    // Particles (emitting from top)
    this.particleSystem = new MochiParticleSystem();
    // Move particle system up slightly to look like it's emitting from the top of the bubble
    this.particleSystem.group.position.y = 0.8;
    this.rootGroup.add(this.particleSystem.group);

    // Lighting to make the glass bubble pop
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0x7f5af0, 1.5);
    rimLight.position.set(-2, 3, -2);
    this.scene.add(rimLight);
    
    const keyLight = new THREE.DirectionalLight(0x00f7ff, 2.0);
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

    if (this.bounceVelocity !== 0 || this.bounceOffset > 0) {
      this.bounceOffset += this.bounceVelocity * delta * 8;
      this.bounceVelocity -= 9.8 * delta * 0.4;
      if (this.bounceOffset <= 0) {
        this.bounceOffset = 0;
        this.bounceVelocity = 0;
      }
    }

    const floatY = Math.sin(elapsedTime * 1.5) * 0.04 + this.bounceOffset;
    this.rootGroup.position.y = floatY;

    // Smooth tilt
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
