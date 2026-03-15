/**
Système de particules dorées flottantes
 * Crée un effet de poussière / paillettes dorées dans la scène
 */
import * as THREE from 'three';

/**
 * Crée un système de particules dorées
 * @param {number} count - Nombre de particules
 * @returns {{ points: THREE.Points, velocities: Array, posAttr: THREE.BufferAttribute }}
 */
export function createParticles(count = 100) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const velocities = [];
  const spread = 10;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;

    sizes[i] = Math.random() * 0.06 + 0.02;
    opacities[i] = Math.random() * 0.5 + 0.3;

    velocities.push({
      x: (Math.random() - 0.5) * 0.002,
      y: Math.random() * 0.004 + 0.001,
      z: (Math.random() - 0.5) * 0.001,
      twinkleSpeed: Math.random() * 2 + 1,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Texture circulaire douce pour chaque particule
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(218, 190, 120, 1)');
  gradient.addColorStop(0.3, 'rgba(201, 168, 76, 0.8)');
  gradient.addColorStop(0.7, 'rgba(201, 168, 76, 0.2)');
  gradient.addColorStop(1, 'rgba(201, 168, 76, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.PointsMaterial({
    size: 0.1,
    map: texture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.5,
    color: 0xdabe78,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'particles';

  return {
    points,
    velocities,
    posAttr: geometry.attributes.position,
    material,
  };
}

/**
 * Met à jour la position des particules à chaque frame
 */
export function updateParticles(velocities, posAttr, material, time) {
  const arr = posAttr.array;
  const count = arr.length / 3;

  for (let i = 0; i < count; i++) {
    arr[i * 3] += velocities[i].x;
    arr[i * 3 + 1] += velocities[i].y;
    arr[i * 3 + 2] += velocities[i].z;

    // Reboucler quand la particule sort du cadre
    if (arr[i * 3 + 1] > 5) {
      arr[i * 3 + 1] = -5;
      arr[i * 3] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
  }

  // Effet de scintillement global doux
  material.opacity = 0.4 + Math.sin(time * 1.5) * 0.1;

  posAttr.needsUpdate = true;
}

/**
 * Émet un burst de particules (appelé lors de l'ouverture)
 */
export function burstParticles(velocities, posAttr) {
  const arr = posAttr.array;
  const count = arr.length / 3;

  for (let i = 0; i < count; i++) {
    // Accélérer et recentrer les particules pour un effet burst
    velocities[i].y = Math.random() * 0.015 + 0.005;
    velocities[i].x = (Math.random() - 0.5) * 0.01;
    arr[i * 3] = (Math.random() - 0.5) * 3;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 2;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  posAttr.needsUpdate = true;

  // Revenir à la vitesse normale après 2 secondes
  setTimeout(() => {
    for (let i = 0; i < count; i++) {
      velocities[i].y = Math.random() * 0.004 + 0.001;
      velocities[i].x = (Math.random() - 0.5) * 0.002;
    }
  }, 2000);
}
