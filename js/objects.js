/**
 * objects.js — Création des plans 3D (enveloppe + carte)
 * Charge les SVG Illustrator comme textures sur des PlaneGeometry
 */
import * as THREE from 'three';

// ── Chargeur SVG → Texture ──
function loadSVGTexture(url, viewBoxW, viewBoxH, maxRes = 2048) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const aspect = viewBoxW / viewBoxH;
      let w, h;
      if (aspect >= 1) {
        w = maxRes;
        h = Math.round(maxRes / aspect);
      } else {
        h = maxRes;
        w = Math.round(maxRes * aspect);
      }

      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      resolve(tex);
    };

    img.onerror = () => reject(new Error(`Échec du chargement : ${url}`));
    img.src = url;
  });
}

/**
 * Crée le mesh de l'enveloppe fermée
 * viewBox de enveloppe fermé.svg : 361.6 × 263.25
 */
export async function createEnvelope() {
  const closedVbW = 361.6;
  const closedVbH = 263.25;
  const openVbW = 293.05;
  const openVbH = 344;

  const [closedTexture, openTexture] = await Promise.all([
    loadSVGTexture(
      'files/enveloppe%20ferm%C3%A9.svg',
      closedVbW,
      closedVbH,
      2048
    ),
    loadSVGTexture(
      'files/enveloppe%20ouvert.svg',
      openVbW,
      openVbH,
      2048
    ),
  ]);

  const aspect = closedVbW / closedVbH;  // ~1.37
  const height = 2.6;
  const width = height * aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: closedTexture,
    transparent: true,
    side: THREE.FrontSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'envelope';
  mesh.userData = {
    opened: false,
    closedMap: closedTexture,
    openMap: openTexture,
    closedAspect: closedVbW / closedVbH,
    openAspect: openVbW / openVbH,
  };
  return mesh;
}

/**
 * Crée le mesh de la carte d'invitation
 * viewBox de carte_front.svg : 419.53 × 595.28
 */
export async function createCard() {
  const vbW = 419.53;
  const vbH = 595.28;
  const texture = await loadSVGTexture(
    'files/carte_front.svg',
    vbW,
    vbH,
    2048
  );

  const aspect = vbW / vbH;  // ~0.705
  const height = 3.4;
  const width = height * aspect;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'card';

  // La carte démarre cachée, juste derrière l'enveloppe
  mesh.position.z = -0.08;
  mesh.scale.set(0.7, 0.7, 1);
  mesh.material.opacity = 0;
  mesh.visible = false;

  return mesh;
}
