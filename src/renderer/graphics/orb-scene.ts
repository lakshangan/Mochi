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
  private orbMesh: THREE.Mesh;
  private innerCoreMesh: THREE.Mesh;
  private faceMesh: THREE.Mesh;
  private faceManager: FaceTextureManager;
  private particleSystem: MochiParticleSystem;
  private innerPointLight: THREE.PointLight;
  private rimLight: THREE.DirectionalLight;

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

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const aspect = container.clientWidth / container.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 3.4);

    // WebGL Renderer with full alpha transparency
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0.0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    container.appendChild(this.renderer.domElement);

    // Root Group for movement & bobbing
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Face Texture
    this.faceManager = new FaceTextureManager(512);

    // 1. Inner glowing core (deep electric blue/indigo with pulsing cosmic emissive core)
    const coreGeo = new THREE.SphereGeometry(0.72, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0e173e,
      emissive: 0x241d66,
      emissiveIntensity: 1.3,
      roughness: 0.35,
      metalness: 0.1,
    });
    this.innerCoreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.rootGroup.add(this.innerCoreMesh);

    // 1b. Luminous internal aura (soft cyan/violet gradient energy field)
    const auraGeo = new THREE.SphereGeometry(0.79, 36, 36);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.rootGroup.add(auraMesh);

    // 2. Face screen (curved disc facing the camera)
    const faceGeo = new THREE.CircleGeometry(0.56, 36);
    const faceMat = new THREE.MeshBasicMaterial({
      map: this.faceManager.texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.98,
    });
    this.faceMesh = new THREE.Mesh(faceGeo, faceMat);
    this.faceMesh.position.set(0, 0, 0.74);
    this.rootGroup.add(this.faceMesh);

    // 3. Translucent glass outer shell (realistic glass refraction & clearcoat)
    const shellGeo = new THREE.SphereGeometry(0.88, 64, 64);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x1f3160,
      emissive: 0x0d1a40,
      emissiveIntensity: 0.35,
      roughness: 0.06,
      metalness: 0.05,
      transmission: 0.86,
      ior: 1.52,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
    });
    this.orbMesh = new THREE.Mesh(shellGeo, shellMat);
    this.rootGroup.add(this.orbMesh);

    // 4. Dual celestial orbital rings (glowing cyan primary + inclined violet secondary)
    const ringGroup = new THREE.Group();
    this.rootGroup.add(ringGroup);

    const primaryRingGeo = new THREE.TorusGeometry(0.84, 0.015, 16, 80);
    const primaryRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const primaryRing = new THREE.Mesh(primaryRingGeo, primaryRingMat);
    primaryRing.rotation.x = Math.PI / 2.3;
    ringGroup.add(primaryRing);

    const secondaryRingGeo = new THREE.TorusGeometry(0.88, 0.008, 16, 80);
    const secondaryRingMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const secondaryRing = new THREE.Mesh(secondaryRingGeo, secondaryRingMat);
    secondaryRing.rotation.x = Math.PI / 2.05;
    secondaryRing.rotation.y = 0.25;
    ringGroup.add(secondaryRing);

    // 5. Particles
    this.particleSystem = new MochiParticleSystem();
    this.rootGroup.add(this.particleSystem.group);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x182654, 1.8);
    this.scene.add(ambientLight);

    // Key front light
    const keyLight = new THREE.DirectionalLight(0x9d4edd, 2.8);
    keyLight.position.set(2, 3, 2.5);
    this.scene.add(keyLight);

    // Rim light from rear-right (brilliant cyan edge)
    this.rimLight = new THREE.DirectionalLight(0x00f7ff, 3.2);
    this.rimLight.position.set(-2.5, 1.5, -2);
    this.scene.add(this.rimLight);

    // Internal point light inside the core
    this.innerPointLight = new THREE.PointLight(0x00f7ff, 3.5, 3.5);
    this.innerPointLight.position.set(0, 0, 0.2);
    this.rootGroup.add(this.innerPointLight);

    const backPointLight = new THREE.PointLight(0x7f5af0, 2.2, 3);
    backPointLight.position.set(0, 0, -0.4);
    this.rootGroup.add(backPointLight);

    // Resize observer
    window.addEventListener('resize', this.onResize);

    // Start render loop
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
    // Normalised between -1 and 1
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

    // Update face texture and eyes
    this.faceManager.update(delta);

    // Update particles
    this.particleSystem.update(delta, this.currentState);

    // Bounce physics
    if (this.bounceVelocity !== 0 || this.bounceOffset > 0) {
      this.bounceOffset += this.bounceVelocity * delta * 8;
      this.bounceVelocity -= 9.8 * delta * 0.4;
      if (this.bounceOffset <= 0) {
        this.bounceOffset = 0;
        this.bounceVelocity = 0;
      }
    }

    // Natural breathing & floating
    const floatFrequency = this.currentState === 'sleeping' ? 1.0 : 2.2;
    const floatAmplitude = this.currentState === 'sleeping' ? 0.02 : 0.06;
    const floatY = Math.sin(elapsedTime * floatFrequency) * floatAmplitude + this.bounceOffset;

    // Breath scale
    const breathFrequency = this.currentState === 'sleeping' ? 1.2 : 2.8;
    const breathScale = 1.0 + Math.sin(elapsedTime * breathFrequency) * 0.018;

    this.rootGroup.position.y = floatY;
    this.rootGroup.scale.set(breathScale, breathScale, breathScale);

    // Smooth tilt towards gaze
    const targetTiltX = this.targetGaze.y * 0.25;
    const targetTiltY = this.targetGaze.x * 0.35;
    this.currentTilt.x += (targetTiltX - this.currentTilt.x) * delta * 5;
    this.currentTilt.y += (targetTiltY - this.currentTilt.y) * delta * 5;

    this.rootGroup.rotation.x = this.currentTilt.x;
    this.rootGroup.rotation.y = this.currentTilt.y;

    // Gentle pulse of inner core lighting
    const pulseFreq = this.currentState === 'thinking' ? 5.0 : 2.0;
    const pulse = 1.8 + Math.sin(elapsedTime * pulseFreq) * 0.6;
    this.innerPointLight.intensity = pulse;

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
