/**
 * scene.js — Initialisation de la scène Three.js
 * Caméra perspective, lumières douces, renderer transparent
 */
import * as THREE from 'three';

export function initScene(canvas) {
  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ── Scène ──
  const scene = new THREE.Scene();

  // ── Caméra ──
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.2, 7);
  camera.lookAt(0, 0, 0);

  // ── Lumières ──
  // Lumière ambiante douce (blanc chaud)
  const ambient = new THREE.AmbientLight(0xfff8e7, 0.6);
  scene.add(ambient);

  // Lumière principale (dorée douce)
  const mainLight = new THREE.DirectionalLight(0xffe4b5, 1);
  mainLight.position.set(3, 5, 5);
  scene.add(mainLight);

  // Lumière de remplissage (vert sauge subtil)
  const fillLight = new THREE.DirectionalLight(0x9caf88, 0.25);
  fillLight.position.set(-4, -1, 3);
  scene.add(fillLight);

  // Lumière de contour (dorée)
  const rimLight = new THREE.DirectionalLight(0xc9a84c, 0.2);
  rimLight.position.set(0, 3, -4);
  scene.add(rimLight);

  // ── Redimensionnement ──
  function handleResize() {
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  return { renderer, scene, camera, handleResize };
}
