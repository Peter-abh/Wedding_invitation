
export function idleAnimation(envelope, time) {
  if (!envelope || envelope.userData.opened) return;

  envelope.position.y = Math.sin(time * 0.8) * 0.12;
  envelope.rotation.y = Math.sin(time * 0.5) * 0.06;
  envelope.rotation.z = Math.sin(time * 0.35) * 0.015;
}

/**
 * Animation d'ouverture — déclenchée au clic
 * L'enveloppe monte vers le haut, la carte apparaît et se positionne à droite
 */
export function playOpenAnimation(envelope, card, onComplete) {
  const gsap = globalThis.gsap;
  if (!gsap) {
    console.warn('GSAP non chargé, animation impossible');
    return;
  }
  const isMobile = globalThis.matchMedia('(max-width: 768px)').matches;

  envelope.userData.opened = true;
  if (card) card.visible = true;

  const openMap = envelope?.userData?.openMap;
  const closedAspect = envelope?.userData?.closedAspect;
  const openAspect = envelope?.userData?.openAspect;
  const baseEnvelopeScaleX = envelope.scale.x;
  const openScaleRatio =
    typeof closedAspect === 'number' && typeof openAspect === 'number' && closedAspect > 0
      ? openAspect / closedAspect
      : 1;
  envelope.renderOrder = 5;
  if (card) {
    card.renderOrder = 10;
    card.material.depthTest = false;
  }

  if (card) {
    gsap.set(card.position, { x: 0.12, y: -0.05, z: 0.42 });
    gsap.set(card.rotation, { y: -0.22, z: -0.02 });
    gsap.set(card.scale, { x: 0.78, y: 0.78 });
  }

  const cardTarget = isMobile
    ? { x: 0.66, y: 0.02, z: 0.86, scale: 0.84 }
    : { x: 1.04, y: 0.01, z: 0.98, scale: 1 };
  const envelopeTarget = isMobile
    ? { x: 0, y: 1.55, z: 0.18 }
    : { x: 0, y: 1.9, z: 0.2 };

  const tl = gsap.timeline({
    defaults: { ease: 'power2.out' },
    onComplete: () => {
      if (onComplete) onComplete();
    },
  });

  // ── Phase 1 : anticipation (petit recul puis impulsion) ──
  tl.addLabel('anticipation')
    .to(
      envelope.position,
      {
        x: -0.1,
        duration: 0.16,
        ease: 'power1.out',
      },
      'anticipation'
    )
    .to(
      envelope.rotation,
      {
        y: 0.08,
        z: -0.06,
        duration: 0.16,
        ease: 'power1.out',
      },
      'anticipation'
    );

  if (openMap) {
    tl.add(() => {
      envelope.material.map = openMap;
      envelope.material.needsUpdate = true;
    }, 'anticipation+=0.13');
  }

  // ── Phase 2 : l'enveloppe monte (la carte 3D est optionnelle) ──
  tl.addLabel('reveal', 'anticipation+=0.12');

  if (card) {
    tl.to(
      card.material,
      {
        opacity: 1,
        duration: 0.46,
      },
      'reveal'
    )
      .to(
        card.position,
        {
          x: cardTarget.x,
          y: cardTarget.y,
          z: cardTarget.z,
          duration: 1.08,
          ease: 'power3.out',
        },
        'reveal'
      )
      .to(
        card.rotation,
        {
          y: 0,
          z: 0,
          duration: 0.95,
          ease: 'power3.out',
        },
        'reveal'
      )
      .to(
        card.scale,
        {
          x: cardTarget.scale,
          y: cardTarget.scale,
          duration: 1.02,
          ease: 'back.out(1.25)',
        },
        'reveal'
      );
  }

  tl.to(
      envelope.position,
      {
        x: envelopeTarget.x,
        y: envelopeTarget.y,
        z: envelopeTarget.z,
        duration: 1.06,
        ease: 'power2.inOut',
      },
      'reveal+=0.04'
    )
    .to(
      envelope.scale,
      {
        x: baseEnvelopeScaleX * openScaleRatio,
        duration: 0.62,
        ease: 'power2.out',
      },
      'reveal+=0.06'
    )
    .to(
      envelope.rotation,
      {
        y: 0,
        z: 0,
        duration: 1.06,
        ease: 'power2.inOut',
      },
      'reveal+=0.04'
    )
    .to(
      envelope.material,
      {
        opacity: 0.92,
        duration: 0.72,
        ease: 'sine.out',
      },
      'reveal+=0.2'
    );

  // ── Phase 3 : finition subtile (settle) ──
  tl.addLabel('settle');

  if (card) {
    tl.to(
      card.position,
      {
        y: 0,
        duration: 0.24,
        ease: 'sine.out',
      },
      'settle'
    );
  }

  tl.to(
      envelope.position,
      {
        y: envelopeTarget.y - 0.06,
        duration: 0.24,
        ease: 'sine.out',
      },
      'settle'
    );

  return tl;
}
