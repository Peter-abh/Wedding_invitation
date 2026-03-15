/**
 * app.js — Point d'entrée principal
 * Orchestre la scène Three.js, le chargement des objets,
 * les animations, et l'interaction utilisateur
 */
import * as THREE from 'three';
import { initScene } from './scene.js';
import { createEnvelope } from './objects.js';
import { createParticles, updateParticles, burstParticles } from './particles.js';
import { idleAnimation, playOpenAnimation } from './animations.js';

// ── État de l'app ──
let envelope = null;
let particleData = null;
let isOpened = false;
const clock = new THREE.Clock();

function revealHtmlInvitationCard() {
  const gsap = globalThis.gsap;
  if (!gsap) return;

  const invitationCard = document.getElementById('hero-invitation-card');
  if (!invitationCard) return;

  gsap.set(invitationCard, { opacity: 0, y: 24, scale: 0.9, rotation: -2.5 });
  gsap.to(invitationCard, {
    opacity: 1,
    y: 0,
    scale: 1,
    rotation: 0,
    duration: 0.82,
    ease: 'power3.out',
  });
}

function revealHeroSummary() {
  const gsap = globalThis.gsap;
  if (!gsap) return;

  const photo = document.getElementById('summary-photo');
  const details = document.getElementById('summary-details');
  const rsvp = document.getElementById('summary-rsvp');
  if (!photo || !details || !rsvp) return;

  // La rotation est gérée par CSS — GSAP gère uniquement opacity + y
  // On remet les transforms CSS intacts via clearProps ciblé
  gsap.set(photo, { y: 28, scale: 0.92, opacity: 0 });
  gsap.set(details, { y: 22, scale: 0.93, opacity: 0 });
  gsap.set(rsvp, { y: 22, scale: 0.93, opacity: 0 });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .to(photo, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.56,
    })
    .to(
      details,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
      },
      '-=0.30'
    )
    .to(
      rsvp,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.48,
      },
      '-=0.26'
    );
}

function applyResponsive3DLayout(camera, envelopeMesh) {
  const isMobile = globalThis.matchMedia('(max-width: 768px)').matches;

  if (isMobile) {
    // Sur mobile : enveloppe plus haute pour laisser la place à la grille en bas
    camera.position.set(0, 0.6, 8);
    if (envelopeMesh && !envelopeMesh.userData.opened) {
      envelopeMesh.scale.set(0.78, 0.78, 1);
      envelopeMesh.position.set(0, 0.3, 0);
    }
  } else {
    // Desktop : enveloppe centrée, les colonnes CSS encadrent le canvas
    camera.position.set(0, 0.2, 7);
    if (envelopeMesh && !envelopeMesh.userData.opened) {
      envelopeMesh.scale.set(1, 1, 1);
      envelopeMesh.position.set(0, 0, 0);
    }
  }

  camera.lookAt(0, 0, 0);
}

async function init() {
  const canvas = document.getElementById('scene');
  if (!canvas) {
    console.error('Canvas #scene introuvable');
    return;
  }

  // ── Initialiser la scène ──
  const { renderer, scene, camera } = initScene(canvas);

  // ── Charger les objets 3D ──
  try {
    envelope = await createEnvelope();
    scene.add(envelope);
    applyResponsive3DLayout(camera, envelope);
  } catch (err) {
    console.error('Erreur de chargement des textures :', err);
    // Masquer le loader même en cas d'erreur
    hideLoader();
    return;
  }

  // ── Particules ──
  const { points, velocities, posAttr, material: particleMat } = createParticles(120);
  scene.add(points);
  particleData = { velocities, posAttr, material: particleMat };

  // ── Masquer le loader ──
  hideLoader();

  // ── Clic / tap sur l'enveloppe ──
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function handleInteraction(event) {
    if (isOpened || !envelope) return;

    // Coordonnées normalisées
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(envelope);

    if (intersects.length > 0) {
      isOpened = true;

      // Cacher l'indice
      const hint = document.getElementById('heroHint');
      if (hint) {
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none';
      }

      // Burst de particules
      if (particleData) {
        burstParticles(particleData.velocities, particleData.posAttr);
      }

      // Jouer l'animation d'ouverture
      playOpenAnimation(envelope, null, () => {
        revealHtmlInvitationCard();
        revealHeroSummary();
        // Afficher l'indicateur de scroll
        const scrollInd = document.getElementById('scrollIndicator');
        if (scrollInd) scrollInd.classList.add('visible');
      });
    }
  }

  canvas.addEventListener('click', handleInteraction);
  canvas.addEventListener('touchstart', handleInteraction, { passive: true });

  globalThis.addEventListener('resize', () => {
    applyResponsive3DLayout(camera, envelope);
  });

  // ── Curseur interactif ──
  canvas.addEventListener('mousemove', (event) => {
    if (isOpened || !envelope) {
      canvas.style.cursor = 'default';
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(envelope);
    canvas.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
  });

  // ── Boucle de rendu ──
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Animation idle de l'enveloppe
    idleAnimation(envelope, time);

    // Mise à jour des particules
    if (particleData) {
      updateParticles(
        particleData.velocities,
        particleData.posAttr,
        particleData.material,
        time
      );
    }

    renderer.render(scene, camera);
  }

  animate();
}

// ── Masquer l'écran de chargement ──
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 600);
  }
}

// ── Animations de scroll (sections HTML) ──
function initScrollAnimations() {
  const gsap = globalThis.gsap;
  const ScrollTrigger = globalThis.ScrollTrigger;

  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  // Animation de révélation des éléments .reveal
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el) => {
    gsap.fromTo(
      el,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ── Gestion du formulaire RSVP ──
function initRSVPForm() {
  const form = document.getElementById('rsvpForm');
  const success = document.getElementById('rsvpSuccess');
  const error = document.getElementById('rsvpError');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const sheetDbUrl = form.dataset.sheetdbUrl?.trim();
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitLabel = submitBtn?.querySelector('span');

    if (!sheetDbUrl) {
      if (error) {
        error.textContent = 'Veuillez configurer l’URL SheetDB dans data-sheetdb-url du formulaire RSVP.';
        error.style.display = 'block';
      }
      return;
    }

    if (error) {
      error.style.display = 'none';
      error.textContent = '';
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.75';
      submitBtn.style.cursor = 'not-allowed';
    }
    if (submitLabel) submitLabel.textContent = 'Envoi en cours…';

    // Récupérer les données
    const data = new FormData(form);
    const entries = Object.fromEntries(data.entries());

    const payload = {
      data: [
        {
          Nom_Prenom: entries.fullName ?? '',
          Email: entries.email ?? '',
          Presence: entries.attendance ?? '',
          Message: entries.message ?? '',
          Date: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await fetch(sheetDbUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let apiMessage = '';
        try {
          const errorData = await response.json();
          apiMessage = errorData?.error || errorData?.message || '';
        } catch {
          apiMessage = '';
        }
        throw new Error(
          apiMessage || `SheetDB a retourné le statut ${response.status}`
        );
      }

      form.style.display = 'none';
      if (success) {
        success.style.display = 'block';
        const gsap = globalThis.gsap;
        if (gsap) {
          gsap.fromTo(
            success,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }
          );
        }
      }

      console.log('RSVP enregistré dans SheetDB :', entries);
    } catch (err) {
      console.error('Erreur envoi RSVP vers SheetDB :', err);
      if (error) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Échec de l’envoi. Vérifiez l’URL SheetDB et votre connexion, puis réessayez.';
        error.textContent = `Échec de l’envoi : ${message}`;
        error.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '';
        submitBtn.style.cursor = '';
      }
      if (submitLabel) submitLabel.textContent = 'Envoyer ma réponse';
    }
  });
}

// ── Smooth scroll pour l'indicateur ──
function initSmoothScroll() {
  const scrollInd = document.getElementById('scrollIndicator');
  const summaryLinks = document.querySelectorAll('.summary-link[href^="#"]');

  summaryLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href');
      if (!targetId) return;
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (scrollInd) {
    scrollInd.addEventListener('click', () => {
      const couple = document.getElementById('couple');
      if (couple) {
        couple.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

// ── Démarrage ──
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initRSVPForm();
  // Scroll animations après un délai pour laisser charger
  setTimeout(initScrollAnimations, 500);
});

await init();