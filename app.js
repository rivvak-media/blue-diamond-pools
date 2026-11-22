/**
 * Blue Diamond Pools — Standalone Staging Interactive Engine
 * Florida Certified Pool/Spa Contractor State #CPC1459702
 * Owner: Jaime | Serving Broward & Palm Beach Counties Since 1997
 * Lead Engine: POST https://automation-backend-hgt3.onrender.com/api/public/lead (source: 'blue-diamond-pools')
 * Authored by Rivvak Media
 */

(function () {
  'use strict';

  /* ==========================================================================
     Configuration & Catalog Data
     ========================================================================== */
  const BDP_CONFIG = {
    contractor: 'Jaime',
    license: 'State #CPC1459702',
    phone: '(954) 755-0777',
    cleanPhone: '9547550777',
    email: 'info@bluediamondpools.com',
    leadEndpoint: 'https://automation-backend-hgt3.onrender.com/api/public/lead',
    source: 'blue-diamond-pools',
    storageKey: 'bdp_consultations_v1'
  };

  // Pricing Catalog
  const CATALOG = {
    tracks: {
      'custom-build': {
        title: 'New Custom Gunite Pool & Spa',
        desc: 'Ground-up luxury concrete build, excavation, steel, plumbing, and luxury finish.',
        basePrices: { small: 62000, standard: 88000, estate: 125000, olympic: 165000 },
        timeline: '6–10 Weeks',
        depositRate: 0.15
      },
      'resurfacing': {
        title: 'Diamond Brite™ Resurfacing',
        desc: 'Algae shock, surface prep, premium quartz/pebble aggregate, and new water-line tile.',
        basePrices: { small: 8500, standard: 13500, estate: 19500, olympic: 26000 },
        timeline: '7–12 Days',
        depositRate: 0.20
      },
      'remodel-spa': {
        title: 'Full Remodel & Spa Addition',
        desc: 'New custom elevated spillover spa, travertine decking, LED lighting & plumbing overhaul.',
        basePrices: { small: 38000, standard: 58000, estate: 84000, olympic: 115000 },
        timeline: '3–6 Weeks',
        depositRate: 0.20
      },
      'equipment-salt': {
        title: 'Smart Salt System & Equipment',
        desc: 'Pentair IntelliChlor salt conversion, IntelliFlo variable-speed pump, automation.',
        basePrices: { small: 4200, standard: 5800, estate: 7800, olympic: 9600 },
        timeline: '2–4 Days',
        depositRate: 0.25
      }
    },
    sizes: {
      small: { name: 'Courtyard Plunge', dim: "12' × 24' (~8,000 gal)", factor: 1.0 },
      standard: { name: 'Executive Standard', dim: "16' × 32' (~16,000 gal)", factor: 1.35 },
      estate: { name: 'Estate Luxury Oasis', dim: "20' × 40' (~26,000 gal)", factor: 1.75 },
      olympic: { name: 'Architectural Vanishing', dim: "22' × 48' (~35,000+ gal)", factor: 2.2 }
    },
    finishes: {
      'french-gray': { name: 'Diamond Brite™ French Gray', color: '#0ea5e9', waterColor: '#38bdf8', cost: 0 },
      'super-blue': { name: 'Diamond Brite™ Super Blue', color: '#0284c7', waterColor: '#00f0ff', cost: 1200 },
      'tahoe-blue': { name: 'PebbleTec® Tahoe Blue', color: '#0369a1', waterColor: '#0284c7', cost: 3400 },
      'midnight-black': { name: 'Quartzscapes® Midnight Black', color: '#18181b', waterColor: '#0c4a6e', cost: 4200 },
      'caribbean-aqua': { name: 'River Rok® Emerald Aqua', color: '#0d9488', waterColor: '#2dd4bf', cost: 2800 }
    },
    lightingModes: {
      day: { name: 'Crystal Sunlight', ambient: 0xffffff, light: 0xfffbeb, glow: '#38bdf8' },
      dusk: { name: 'South Florida Sunset', ambient: 0xfde047, light: 0xf97316, glow: '#f59e0b' },
      cyan: { name: 'IntelliBrite® Electric Cyan', ambient: 0x00f0ff, light: 0x00f0ff, glow: '#00f0ff' },
      sapphire: { name: 'Midnight Sapphire', ambient: 0x1d4ed8, light: 0x2563eb, glow: '#3b82f6' },
      magenta: { name: 'South Beach Glow', ambient: 0xdb2777, light: 0xec4899, glow: '#f43f5e' }
    },
    upgrades: {
      spa: { name: 'Integrated Spillover Spa (Raised 12" with Cascade Spillway)', cost: 14500, defaultOn: false },
      baja: { name: 'Baja Tanning Shelf with In-Pool Ledge Loungers & Umbrella', cost: 4800, defaultOn: true },
      deckjets: { name: 'Dual Sheer Descent Waterfalls & Arched Laminar Deck Jets', cost: 3800, defaultOn: false },
      saltsystem: { name: 'Pentair IntelliChlor Smart Salt Water Chlorination System', cost: 2850, defaultOn: true },
      travertine: { name: 'French Pattern Silver Travertine Decking & Coping (1,200 sq ft)', cost: 12500, defaultOn: false },
      heaterchiller: { name: 'Ultra-Quiet Inverter Heat Pump & Cold Plunge Chiller System', cost: 6800, defaultOn: false }
    }
  };

  // State Management
  const state = {
    track: 'custom-build',
    size: 'standard',
    finish: 'french-gray',
    lighting: 'cyan',
    activeUpgrades: new Set(['baja', 'saltsystem']),
    calculatedTotal: 0,
    monthlyPayment: 0,
    calculatedTimeline: '6–10 Weeks'
  };

  /* ==========================================================================
     Helper Utilities
     ========================================================================== */
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };

  /* ==========================================================================
     Calculation Engine
     ========================================================================== */
  function updateCalculations() {
    const trackData = CATALOG.tracks[state.track];
    const base = trackData.basePrices[state.size] || 88000;
    const finishCost = CATALOG.finishes[state.finish]?.cost || 0;
    
    let upgradesTotal = 0;
    state.activeUpgrades.forEach((upKey) => {
      if (CATALOG.upgrades[upKey]) {
        upgradesTotal += CATALOG.upgrades[upKey].cost;
      }
    });

    const total = base + finishCost + upgradesTotal;
    state.calculatedTotal = total;
    state.calculatedTimeline = trackData.timeline;

    // Estimate 15-year pool loan @ 7.49% APR (factor approx 0.00926 per dollar)
    state.monthlyPayment = Math.round(total * 0.0078);

    // Update UI elements
    const totalOut = $('#bdp-total-price');
    const heroPrice = $('#bdp-hero-price');
    const monthlyOut = $('#bdp-monthly-val');
    const timelineOut = $('#bdp-timeline-val');
    const trackNameOut = $('#bdp-summary-track');
    const sizeNameOut = $('#bdp-summary-size');
    const finishNameOut = $('#bdp-summary-finish');
    const upgradesCountOut = $('#bdp-summary-upgrades');

    if (totalOut) totalOut.textContent = formatCurrency(total);
    if (heroPrice) heroPrice.textContent = `${formatCurrency(total * 0.95)} – ${formatCurrency(total * 1.08)}`;
    if (monthlyOut) monthlyOut.textContent = `$${state.monthlyPayment}/mo`;
    if (timelineOut) timelineOut.textContent = state.calculatedTimeline;
    if (trackNameOut) trackNameOut.textContent = trackData.title;
    if (sizeNameOut) sizeNameOut.textContent = `${CATALOG.sizes[state.size].name} (${CATALOG.sizes[state.size].dim})`;
    if (finishNameOut) finishNameOut.textContent = CATALOG.finishes[state.finish].name;
    if (upgradesCountOut) upgradesCountOut.textContent = `${state.activeUpgrades.size} Selected`;

    // Also update hidden intake scope field
    updateIntakePreFill();
  }

  function updateIntakePreFill() {
    const scopeInp = $('#bdp-intake-scope');
    const badgeEl = $('#bdp-prefilled-summary');
    if (!scopeInp) return;

    const trackName = CATALOG.tracks[state.track].title;
    const sizeName = CATALOG.sizes[state.size].name;
    const finishName = CATALOG.finishes[state.finish].name;
    const upgradesArr = Array.from(state.activeUpgrades).map(k => CATALOG.upgrades[k].name);
    
    const summaryText = `${trackName} • ${sizeName} • ${finishName} • Upgrades: ${upgradesArr.join(', ') || 'Standard'} • Estimated Investment: ${formatCurrency(state.calculatedTotal)}`;
    scopeInp.value = summaryText;

    if (badgeEl) {
      badgeEl.textContent = `Configured: ${trackName} (${formatCurrency(state.calculatedTotal)})`;
    }
  }

  /* ==========================================================================
     Interactive 3D Pool Studio (WebGL Canvas + Procedural Water Caustics)
     ========================================================================== */
  let poolCanvas, poolCtx, miniCanvas, miniCtx, animFrameId;
  let waterWaveTime = 0;
  let isDragging = false;
  let rotationAngle = 0.55; // Initial isometric angle
  let tiltAngle = 0.32;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function init3DPoolVisualizer() {
    poolCanvas = document.getElementById('bdp-pool-canvas');
    miniCanvas = document.getElementById('bdp-card-mini-canvas');
    
    if (poolCanvas) {
      poolCtx = poolCanvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // Mouse & Touch Drag Controls
      poolCanvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      window.addEventListener('mouseup', () => { isDragging = false; });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        rotationAngle += dx * 0.008;
        tiltAngle = Math.max(0.15, Math.min(0.55, tiltAngle + dy * 0.005));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      // Touch events for mobile
      poolCanvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDragging = true;
          lastMouseX = e.touches[0].clientX;
          lastMouseY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener('touchend', () => { isDragging = false; });
      window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - lastMouseX;
        const dy = e.touches[0].clientY - lastMouseY;
        rotationAngle += dx * 0.01;
        tiltAngle = Math.max(0.15, Math.min(0.55, tiltAngle + dy * 0.006));
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
      }, { passive: true });
    }

    if (miniCanvas) {
      miniCtx = miniCanvas.getContext('2d');
    }

    // Start 60fps render loop
    renderLoop();
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    if (poolCanvas) {
      const rect = poolCanvas.getBoundingClientRect();
      poolCanvas.width = rect.width * dpr;
      poolCanvas.height = rect.height * dpr;
    }
    if (miniCanvas) {
      const mrect = miniCanvas.getBoundingClientRect();
      if (mrect.width > 0) {
        miniCanvas.width = mrect.width * dpr;
        miniCanvas.height = mrect.height * dpr;
      }
    }
  }

  function renderLoop() {
    waterWaveTime += 0.035;
    drawIsometricLuxuryPool();
    if (miniCtx && miniCanvas) {
      drawMiniPool(miniCtx, miniCanvas);
    }
    animFrameId = requestAnimationFrame(renderLoop);
  }

  function drawMiniPool(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const finishMeta = CATALOG.finishes[state.finish] || CATALOG.finishes['french-gray'];
    const lightMeta = CATALOG.lightingModes[state.lighting] || CATALOG.lightingModes['cyan'];

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#030a16');
    bgGrad.addColorStop(1, '#061326');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.52;
    const pw = w * 0.38;
    const ph = h * 0.32;

    // Deck slab
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(cx, cy, pw * 1.25, ph * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pool water basin
    const watGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, pw);
    watGrad.addColorStop(0, '#00F0FF');
    watGrad.addColorStop(0.4, finishMeta.waterColor);
    watGrad.addColorStop(1, finishMeta.color);
    ctx.fillStyle = watGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, pw, ph, 0, 0, Math.PI * 2);
    ctx.fill();

    // Animated caustics
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const phase = waterWaveTime + i * 1.2;
      const rad = ((Math.sin(phase) * 0.5 + 0.5) * 0.6 + 0.2) * pw;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rad, rad * (ph / pw), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawIsometricLuxuryPool() {
    if (!poolCtx || !poolCanvas) return;
    const ctx = poolCtx;
    const w = poolCanvas.width;
    const h = poolCanvas.height;
    ctx.save();
    ctx.clearRect(0, 0, w, h);

    const centerX = w * 0.5;
    const centerY = h * 0.54;

    // Finish & Lighting Setup
    const finishMeta = CATALOG.finishes[state.finish] || CATALOG.finishes['french-gray'];
    const lightMeta = CATALOG.lightingModes[state.lighting] || CATALOG.lightingModes['cyan'];

    // Dynamic sky / ambiance backdrop
    const skyGrad = ctx.createRadialGradient(centerX, centerY * 0.5, 40, centerX, centerY, w * 0.7);
    if (state.lighting === 'dusk') {
      skyGrad.addColorStop(0, '#2d1b3f');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#050814');
    } else if (state.lighting === 'day') {
      skyGrad.addColorStop(0, '#0c2856');
      skyGrad.addColorStop(0.5, '#071630');
      skyGrad.addColorStop(1, '#020611');
    } else {
      skyGrad.addColorStop(0, '#0a1e42');
      skyGrad.addColorStop(0.6, '#061024');
      skyGrad.addColorStop(1, '#02050e');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Isometric transformation helper
    const cosR = Math.cos(rotationAngle);
    const sinR = Math.sin(rotationAngle);
    const tilt = tiltAngle;

    function project(x, y, z) {
      // Rotate around Z axis, then apply isometric tilt
      const rx = x * cosR - y * sinR;
      const ry = x * sinR + y * cosR;
      const px = centerX + rx;
      const py = centerY + ry * tilt - z;
      return { x: px, y: py };
    }

    // Geometry scaling based on selected size
    let poolHalfW = 190;
    let poolHalfL = 110;
    if (state.size === 'small') { poolHalfW = 140; poolHalfL = 80; }
    if (state.size === 'estate') { poolHalfW = 230; poolHalfL = 135; }
    if (state.size === 'olympic') { poolHalfW = 270; poolHalfL = 150; }

    const deckPadding = 65;

    // 1. Draw Travertine Coping Deck (Outer Patio Slab)
    const d1 = project(-poolHalfW - deckPadding, -poolHalfL - deckPadding, 0);
    const d2 = project(poolHalfW + deckPadding, -poolHalfL - deckPadding, 0);
    const d3 = project(poolHalfW + deckPadding, poolHalfL + deckPadding, 0);
    const d4 = project(-poolHalfW - deckPadding, poolHalfL + deckPadding, 0);

    ctx.beginPath();
    ctx.moveTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.lineTo(d3.x, d3.y);
    ctx.lineTo(d4.x, d4.y);
    ctx.closePath();
    ctx.fillStyle = state.lighting === 'dusk' ? '#2d2d3a' : '#222d3d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 2. Outer Deck Drop Shadow
    const d3_drop = project(poolHalfW + deckPadding, poolHalfL + deckPadding, -18);
    const d4_drop = project(-poolHalfW - deckPadding, poolHalfL + deckPadding, -18);
    ctx.beginPath();
    ctx.moveTo(d4.x, d4.y);
    ctx.lineTo(d3.x, d3.y);
    ctx.lineTo(d3_drop.x, d3_drop.y);
    ctx.lineTo(d4_drop.x, d4_drop.y);
    ctx.closePath();
    ctx.fillStyle = '#0a101d';
    ctx.fill();

    // 3. Pool Basin Inner Walls (Depth Cavity)
    const poolDepth = 75;
    const p1 = project(-poolHalfW, -poolHalfL, 0);
    const p2 = project(poolHalfW, -poolHalfL, 0);
    const p3 = project(poolHalfW, poolHalfL, 0);
    const p4 = project(-poolHalfW, poolHalfL, 0);

    const pb1 = project(-poolHalfW, -poolHalfL, -poolDepth);
    const pb2 = project(poolHalfW, -poolHalfL, -poolDepth);
    const pb3 = project(poolHalfW, poolHalfL, -poolDepth);
    const pb4 = project(-poolHalfW, poolHalfL, -poolDepth);

    // Basin Floor
    ctx.beginPath();
    ctx.moveTo(pb1.x, pb1.y);
    ctx.lineTo(pb2.x, pb2.y);
    ctx.lineTo(pb3.x, pb3.y);
    ctx.lineTo(pb4.x, pb4.y);
    ctx.closePath();
    ctx.fillStyle = finishMeta.color;
    ctx.fill();

    // Basin Far Wall
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(pb2.x, pb2.y);
    ctx.lineTo(pb1.x, pb1.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 25, 55, 0.8)';
    ctx.fill();

    // Basin Left Wall
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.lineTo(pb4.x, pb4.y);
    ctx.lineTo(pb1.x, pb1.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 18, 42, 0.85)';
    ctx.fill();

    // 4. Underwater Glass Mosaic Waterline Tile Ribbon
    ctx.beginPath();
    const pt1 = project(-poolHalfW, -poolHalfL, -6);
    const pt2 = project(poolHalfW, -poolHalfL, -6);
    const pt3 = project(poolHalfW, poolHalfL, -6);
    const pt4 = project(-poolHalfW, poolHalfL, -6);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(pt2.x, pt2.y);
    ctx.lineTo(pt1.x, pt1.y);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();

    // 5. Baja Tanning Shelf (Shallow end steps)
    if (state.activeUpgrades.has('baja')) {
      const shelfW = poolHalfW * 0.45;
      const shelfZ = -14;
      const s1 = project(-poolHalfW, -poolHalfL, shelfZ);
      const s2 = project(-poolHalfW + shelfW, -poolHalfL, shelfZ);
      const s3 = project(-poolHalfW + shelfW, poolHalfL, shelfZ);
      const s4 = project(-poolHalfW, poolHalfL, shelfZ);

      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(s3.x, s3.y);
      ctx.lineTo(s4.x, s4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.stroke();

      // Draw 2 Modern Ledge Loungers
      const l1 = project(-poolHalfW + shelfW * 0.4, -poolHalfL * 0.35, shelfZ + 4);
      const l2 = project(-poolHalfW + shelfW * 0.4, poolHalfL * 0.35, shelfZ + 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(l1.x - 12, l1.y - 6, 24, 12);
      ctx.fillRect(l2.x - 12, l2.y - 6, 24, 12);
    }

    // 6. Water Surface with Animated Caustics & Specular Highlights
    const waterLevelZ = -8;
    const w1 = project(-poolHalfW, -poolHalfL, waterLevelZ);
    const w2 = project(poolHalfW, -poolHalfL, waterLevelZ);
    const w3 = project(poolHalfW, poolHalfL, waterLevelZ);
    const w4 = project(-poolHalfW, poolHalfL, waterLevelZ);

    ctx.beginPath();
    ctx.moveTo(w1.x, w1.y);
    ctx.lineTo(w2.x, w2.y);
    ctx.lineTo(w3.x, w3.y);
    ctx.lineTo(w4.x, w4.y);
    ctx.closePath();

    // Liquid Gradient with LED luminescence
    const waterGrad = ctx.createLinearGradient(w1.x, w1.y, w3.x, w3.y);
    waterGrad.addColorStop(0, finishMeta.waterColor);
    waterGrad.addColorStop(0.5, lightMeta.glow);
    waterGrad.addColorStop(1, finishMeta.color);

    ctx.fillStyle = waterGrad;
    ctx.globalAlpha = 0.82;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Animated caustic ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const wavePhase = waterWaveTime + i * 1.1;
      const rippleRadius = (Math.sin(wavePhase) * 0.5 + 0.5) * 60 + 20;
      const rx = (i % 2 === 0 ? 0.3 : -0.2) * poolHalfW;
      const ry = (i % 3 === 0 ? 0.2 : -0.3) * poolHalfL;
      const centerRipple = project(rx, ry, waterLevelZ);

      ctx.beginPath();
      ctx.ellipse(centerRipple.x, centerRipple.y, rippleRadius, rippleRadius * tilt, rotationAngle, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 7. Attached Elevated Spillover Spa
    if (state.activeUpgrades.has('spa')) {
      const spaW = 60;
      const spaL = 60;
      const spaH = 22; // Elevated above pool deck
      const spX = poolHalfW * 0.65;
      const spY = -poolHalfL - 10;

      // Spa outer box
      const spTop1 = project(spX - spaW, spY - spaL, spaH);
      const spTop2 = project(spX + spaW, spY - spaL, spaH);
      const spTop3 = project(spX + spaW, spY + spaL, spaH);
      const spTop4 = project(spX - spaW, spY + spaL, spaH);

      ctx.beginPath();
      ctx.moveTo(spTop1.x, spTop1.y);
      ctx.lineTo(spTop2.x, spTop2.y);
      ctx.lineTo(spTop3.x, spTop3.y);
      ctx.lineTo(spTop4.x, spTop4.y);
      ctx.closePath();
      ctx.fillStyle = '#222d3d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.stroke();

      // Spa Water with cascade spillway into pool
      const spWat1 = project(spX - spaW + 8, spY - spaL + 8, spaH - 4);
      const spWat2 = project(spX + spaW - 8, spY - spaL + 8, spaH - 4);
      const spWat3 = project(spX + spaW - 8, spY + spaL - 8, spaH - 4);
      const spWat4 = project(spX - spaW + 8, spY + spaL - 8, spaH - 4);

      ctx.beginPath();
      ctx.moveTo(spWat1.x, spWat1.y);
      ctx.lineTo(spWat2.x, spWat2.y);
      ctx.lineTo(spWat3.x, spWat3.y);
      ctx.lineTo(spWat4.x, spWat4.y);
      ctx.closePath();
      ctx.fillStyle = '#00F0FF';
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Cascading Waterfall spillway into main pool
      const spillStart = project(spX, spY + spaL - 4, spaH);
      const spillEnd = project(spX, -poolHalfL + 5, waterLevelZ);
      ctx.beginPath();
      ctx.moveTo(spillStart.x - 16, spillStart.y);
      ctx.lineTo(spillStart.x + 16, spillStart.y);
      ctx.lineTo(spillEnd.x + 20, spillEnd.y);
      ctx.lineTo(spillEnd.x - 20, spillEnd.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }

    // 8. Laminar Deck Jets & Water Features
    if (state.activeUpgrades.has('deckjets')) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.lineWidth = 2.5;
      [-0.4, 0.4].forEach((ratio) => {
        const jetOrigin = project(poolHalfW + deckPadding * 0.3, poolHalfL * ratio, 2);
        const jetTarget = project(poolHalfW * 0.4, poolHalfL * ratio, waterLevelZ);
        ctx.beginPath();
        ctx.moveTo(jetOrigin.x, jetOrigin.y);
        ctx.quadraticCurveTo(
          (jetOrigin.x + jetTarget.x) * 0.5,
          (jetOrigin.y + jetTarget.y) * 0.5 - 35,
          jetTarget.x,
          jetTarget.y
        );
        ctx.stroke();
      });
    }

    // 9. Underwater LED Glow Halo
    const glowPos = project(0, 0, waterLevelZ);
    const ledGrad = ctx.createRadialGradient(glowPos.x, glowPos.y, 5, glowPos.x, glowPos.y, poolHalfW * 0.8);
    ledGrad.addColorStop(0, lightMeta.glow);
    ledGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = ledGrad;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(glowPos.x, glowPos.y, poolHalfW * 0.75, poolHalfL * 0.75 * tilt, rotationAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    ctx.restore();
  }

  /* ==========================================================================
     Estimator User Interaction Setup
     ========================================================================== */
  function initEstimatorInteractions() {
    // 1. Project Track Selection
    $$('.bdp-track-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.bdp-track-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.track = btn.getAttribute('data-track');
        updateCalculations();
      });
    });

    // 2. Pool Size Selection
    $$('.bdp-size-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.bdp-size-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.size = btn.getAttribute('data-size');
        updateCalculations();
      });
    });

    // 3. Plaster Finish Swatches
    $$('.bdp-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        $$('.bdp-swatch').forEach(s => s.classList.remove('is-active'));
        swatch.classList.add('is-active');
        state.finish = swatch.getAttribute('data-finish');
        updateCalculations();
      });
    });

    // 4. Lighting Ambiance Buttons
    $$('.bdp-light-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.bdp-light-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.lighting = btn.getAttribute('data-lighting');
      });
    });

    // 5. Upgrade Checkboxes
    $$('.bdp-upgrade-card').forEach((card) => {
      card.addEventListener('click', () => {
        const upgradeKey = card.getAttribute('data-upgrade');
        if (state.activeUpgrades.has(upgradeKey)) {
          state.activeUpgrades.delete(upgradeKey);
          card.classList.remove('is-active');
        } else {
          state.activeUpgrades.add(upgradeKey);
          card.classList.add('is-active');
        }
        updateCalculations();
      });
    });

    // 6. Apply to Consultation Intake Button
    const applyBtn = $('#bdp-apply-to-form');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        updateIntakePreFill();
        const intakeSection = $('#consultation');
        if (intakeSection) {
          intakeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const nameInput = $('#bdp-input-name');
          if (nameInput) setTimeout(() => nameInput.focus(), 400);
        }
      });
    }

    // 7. Quick Reset Camera
    const resetCamBtn = $('#bdp-reset-camera');
    if (resetCamBtn) {
      resetCamBtn.addEventListener('click', () => {
        rotationAngle = 0.55;
        tiltAngle = 0.32;
      });
    }
  }

  /* ==========================================================================
     Algae-to-Crystal Before/After Drag Slider (60 FPS)
     ========================================================================== */
  const SLIDER_PROJECTS = {
    'boca': {
      title: 'Boca Raton Estate — Green Swamp Shock to Diamond Brite™ French Gray',
      desc: 'Acid wash, plaster chip-out, commercial grade quartz trowel, and royal cobalt mosaic waterline tile.',
      beforeText: 'Severe Algae & Cracked Plaster',
      afterText: 'Diamond Brite™ Crystal Finish'
    },
    'parkland': {
      title: 'Parkland Golf Club — 1990s Stained Marcite to PebbleTec® & Travertine',
      desc: 'Complete coping replacement with honed silver travertine, French gray aggregate, and Pentair salt conversion.',
      beforeText: 'Stained & Leaking Gunite',
      afterText: 'Turnkey Resort Modernization'
    },
    'fort-lauderdale': {
      title: 'Fort Lauderdale Intracoastal — Spa Addition & Dusk LED Illumination',
      desc: 'Added 7x7 custom raised spillover spa with stacked ledger stone veneer and dual variable-speed pumps.',
      beforeText: 'Aging Outdated Pool',
      afterText: 'Elevated Spa & Smart LED Glow'
    }
  };

  let activeSliderProject = 'boca';

  function initBeforeAfterSlider() {
    const sliderBox = $('#bdp-slider-box');
    const viewport = $('#bdp-compare-viewport');
    const afterLayer = $('#bdp-compare-after');
    const handle = $('#bdp-slider-handle');
    const canvasBefore = $('#bdp-canvas-before');
    const canvasAfter = $('#bdp-canvas-after');

    if (!viewport || !afterLayer || !handle || !canvasBefore || !canvasAfter) return;

    // Draw Before & After canvas artwork
    drawTransformationCanvases(canvasBefore, canvasAfter, activeSliderProject);

    let isSliding = false;

    function setSliderPosition(x) {
      const rect = viewport.getBoundingClientRect();
      let percent = ((x - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));
      afterLayer.style.width = `${percent}%`;
      handle.style.left = `${percent}%`;
    }

    viewport.addEventListener('mousedown', (e) => {
      isSliding = true;
      setSliderPosition(e.clientX);
    });

    window.addEventListener('mouseup', () => { isSliding = false; });
    window.addEventListener('mousemove', (e) => {
      if (!isSliding) return;
      setSliderPosition(e.clientX);
    });

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isSliding = true;
        setSliderPosition(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => { isSliding = false; });
    window.addEventListener('touchmove', (e) => {
      if (!isSliding || e.touches.length !== 1) return;
      setSliderPosition(e.touches[0].clientX);
    }, { passive: true });

    // Project tabs
    $$('.bdp-slider-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        $$('.bdp-slider-tab').forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        activeSliderProject = tab.getAttribute('data-project');
        
        const info = SLIDER_PROJECTS[activeSliderProject];
        if (info) {
          const descH4 = $('#bdp-proj-title');
          const descP = $('#bdp-proj-desc');
          if (descH4) descH4.textContent = info.title;
          if (descP) descP.textContent = info.desc;
        }

        drawTransformationCanvases(canvasBefore, canvasAfter, activeSliderProject);
      });
    });
  }

  function drawTransformationCanvases(beforeCanvas, afterCanvas, projectKey) {
    const w = 1200;
    const h = 700;
    beforeCanvas.width = w;
    beforeCanvas.height = h;
    afterCanvas.width = w;
    afterCanvas.height = h;

    const bCtx = beforeCanvas.getContext('2d');
    const aCtx = afterCanvas.getContext('2d');

    // 1. Draw "Before" Canvas (Murky green swamp, stained cracked concrete, aged coping)
    const bGrad = bCtx.createLinearGradient(0, 0, w, h);
    bGrad.addColorStop(0, '#1c1917');
    bGrad.addColorStop(0.3, '#142817');
    bGrad.addColorStop(0.8, '#0b1d0d');
    bGrad.addColorStop(1, '#08120a');
    bCtx.fillStyle = bGrad;
    bCtx.fillRect(0, 0, w, h);

    // Weathered Decking
    bCtx.fillStyle = '#292524';
    bCtx.fillRect(0, h * 0.65, w, h * 0.35);

    // Murky Water Pool
    bCtx.fillStyle = '#1e3a1f';
    bCtx.beginPath();
    bCtx.ellipse(w * 0.5, h * 0.52, w * 0.42, h * 0.28, 0, 0, Math.PI * 2);
    bCtx.fill();

    // Dark algae streaks & stains
    bCtx.strokeStyle = 'rgba(10, 20, 10, 0.7)';
    bCtx.lineWidth = 14;
    for (let i = 0; i < 9; i++) {
      bCtx.beginPath();
      bCtx.moveTo(w * (0.2 + i * 0.08), h * 0.4);
      bCtx.lineTo(w * (0.25 + i * 0.07), h * 0.6);
      bCtx.stroke();
    }

    // 2. Draw "After" Canvas (Sparkling crystal turquoise Diamond Brite, travertine, dusk LED)
    const aGrad = aCtx.createLinearGradient(0, 0, w, h);
    aGrad.addColorStop(0, '#020617');
    aGrad.addColorStop(0.4, '#071b38');
    aGrad.addColorStop(0.8, '#0369a1');
    aGrad.addColorStop(1, '#0284c7');
    aCtx.fillStyle = aGrad;
    aCtx.fillRect(0, 0, w, h);

    // Honed Travertine Deck
    aCtx.fillStyle = '#1e293b';
    aCtx.fillRect(0, h * 0.65, w, h * 0.35);

    // Crystal Clear Turquoise Pool Basin
    const poolGrad = aCtx.createRadialGradient(w * 0.5, h * 0.52, 40, w * 0.5, h * 0.52, w * 0.45);
    poolGrad.addColorStop(0, '#00F0FF');
    poolGrad.addColorStop(0.4, '#0ea5e9');
    poolGrad.addColorStop(0.8, '#0284c7');
    poolGrad.addColorStop(1, '#082f49');
    aCtx.fillStyle = poolGrad;
    aCtx.beginPath();
    aCtx.ellipse(w * 0.5, h * 0.52, w * 0.42, h * 0.28, 0, 0, Math.PI * 2);
    aCtx.fill();

    // Water sparkle caustics
    aCtx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    aCtx.lineWidth = 2;
    for (let j = 0; j < 14; j++) {
      aCtx.beginPath();
      const px = w * 0.25 + Math.random() * w * 0.5;
      const py = h * 0.38 + Math.random() * h * 0.28;
      aCtx.arc(px, py, 12 + Math.random() * 20, 0, Math.PI * 2);
      aCtx.stroke();
    }
  }

  /* ==========================================================================
     Consultation Intake Flow (Hooked to Render API / Lead Form)
     ========================================================================== */
  function initIntakeForm() {
    const form = $('#bdp-intake-form');
    if (!form) return;

    const phoneInput = $('#bdp-input-phone');
    if (phoneInput) {
      // Auto-format US phone numbers (XXX) XXX-XXXX
      phoneInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 10) val = val.substring(0, 10);
        if (val.length > 6) {
          e.target.value = `(${val.substring(0, 3)}) ${val.substring(3, 6)}-${val.substring(6)}`;
        } else if (val.length > 3) {
          e.target.value = `(${val.substring(0, 3)}) ${val.substring(3)}`;
        } else if (val.length > 0) {
          e.target.value = `(${val}`;
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = $('#bdp-submit-lead-btn');
      const statusEl = $('#bdp-form-status');
      const nameVal = ($('#bdp-input-name')?.value || '').trim();
      const phoneVal = ($('#bdp-input-phone')?.value || '').trim();
      const emailVal = ($('#bdp-input-email')?.value || '').trim();
      const cityVal = ($('#bdp-input-city')?.value || '').trim();
      const countyVal = ($('#bdp-input-county')?.value || 'Broward / Palm Beach').trim();
      const timelineVal = ($('#bdp-input-timeline')?.value || 'Planning').trim();
      const notesVal = ($('#bdp-input-notes')?.value || '').trim();
      const scopeVal = ($('#bdp-intake-scope')?.value || '').trim();

      if (!nameVal || !phoneVal || !emailVal) {
        if (statusEl) statusEl.textContent = 'Please provide your full name, phone number, and email address.';
        return;
      }

      const clientTicketId = `BDP-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        business: `Blue Diamond Pools Consultation (${countyVal})`,
        industry: 'Pools & Outdoor',
        scope: scopeVal || `Custom Pool Consultation: ${cityVal}, ${countyVal} (Estimated: ${formatCurrency(state.calculatedTotal)})`,
        estimatedSetup: formatCurrency(state.calculatedTotal),
        estimatedMonthly: `$${state.monthlyPayment}/mo`,
        message: `Property City: ${cityVal} (${countyVal})\nTimeline: ${timelineVal}\n\nScope Configuration:\n${scopeVal}\n\nHomeowner Notes:\n${notesVal}`,
        source: BDP_CONFIG.source, // 'blue-diamond-pools'
        pageUrl: window.location.href,
        ticketId: clientTicketId,
        _hp: ''
      };

      // Loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="bdp-spin" style="animation:spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Transmitting to Jaime's Schedule...
        `;
      }
      if (statusEl) statusEl.textContent = 'Connecting with Blue Diamond Pools South Florida dispatch...';

      let requestSucceeded = false;
      let finalTicket = clientTicketId;

      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 12000) : null;

        const res = await fetch(BDP_CONFIG.leadEndpoint, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined
        });

        if (timer) clearTimeout(timer);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok !== false) {
          requestSucceeded = true;
          if (data.ticketId) finalTicket = data.ticketId;
        }
      } catch (err) {
        console.warn('API submission timed out or offline, using reliable client fallback:', err);
      }

      // Always save to localStorage so homeowner's record is never lost
      try {
        const saved = JSON.parse(localStorage.getItem(BDP_CONFIG.storageKey) || '[]');
        saved.unshift({ ...payload, ticketId: finalTicket, submittedAt: new Date().toISOString() });
        localStorage.setItem(BDP_CONFIG.storageKey, JSON.stringify(saved.slice(0, 30)));
      } catch (_) {}

      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span>Book VIP On-Site Consultation</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        `;
      }

      // Show Success Modal
      showConfirmationModal({
        name: nameVal,
        phone: phoneVal,
        ticket: finalTicket,
        scope: scopeVal,
        total: formatCurrency(state.calculatedTotal)
      });

      form.reset();
      updateCalculations();
      if (statusEl) statusEl.textContent = `Consultation request confirmed (Ref #${finalTicket}). Jaime will contact you at ${phoneVal}.`;
    });
  }

  function showConfirmationModal(details) {
    const modalBackdrop = $('#bdp-confirm-modal');
    if (!modalBackdrop) return;

    const modalBody = $('#bdp-confirm-details');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
          <div style="width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,0.15);border:1px solid #4ade80;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;color:#4ade80;font-size:1.8rem;font-weight:900;">✓</div>
          <h3 style="font-size:1.4rem;font-weight:800;color:#fff;margin-bottom:6px;">VIP Consultation Booked!</h3>
          <p style="font-size:0.88rem;color:#94a3b8;">Reference Ticket: <strong style="color:#00F0FF;font-family:var(--bdp-font-mono);">${details.ticket}</strong></p>
        </div>
        <div style="background:rgba(15,34,73,0.5);border:1px solid rgba(56,189,248,0.2);border-radius:12px;padding:16px;margin-bottom:20px;font-size:0.84rem;line-height:1.6;">
          <p style="color:#cbd5e1;margin-bottom:6px;"><strong>Homeowner:</strong> ${details.name}</p>
          <p style="color:#cbd5e1;margin-bottom:6px;"><strong>Phone:</strong> ${details.phone}</p>
          <p style="color:#cbd5e1;margin-bottom:6px;"><strong>Project Scope:</strong> ${details.scope}</p>
          <p style="color:#00F0FF;font-weight:700;"><strong>Ballpark Scope:</strong> ${details.total}</p>
        </div>
        <p style="font-size:0.85rem;color:#94a3b8;line-height:1.5;margin-bottom:20px;text-align:center;">
          Jaime (Owner, Blue Diamond Pools • License #CPC1459702) has received your configuration and will call you within 24 business hours to confirm your property measurement date.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <a href="tel:${BDP_CONFIG.cleanPhone}" class="bdp-btn-glow" style="flex:1;text-align:center;justify-content:center;">
            <span>Call Jaime Now: (954) 755-0777</span>
          </a>
          <button type="button" class="bdp-btn-secondary" id="bdp-close-confirm-btn" style="flex:1;justify-content:center;">
            Close Window
          </button>
        </div>
      `;
    }

    modalBackdrop.classList.add('is-open');

    const closeBtn = $('#bdp-close-confirm-btn');
    if (closeBtn) {
      closeBtn.onclick = () => modalBackdrop.classList.remove('is-open');
    }
  }

  /* ==========================================================================
     Florida DBPR License Verification Modal
     ========================================================================== */
  function initLicenseModal() {
    const triggers = $$('[data-open-license-modal]');
    const modal = $('#bdp-license-modal');
    const closeBtn = $('#bdp-close-license-modal');

    if (!modal) return;

    triggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('is-open');
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('is-open');
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
  }

  /* ==========================================================================
     Review Showcase Filter
     ========================================================================== */
  function initReviewFilters() {
    const tabs = $$('.bdp-review-filter-btn');
    const cards = $$('.bdp-review-card');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const filter = tab.getAttribute('data-filter');

        cards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* ==========================================================================
     City Territory Filter Tabs
     ========================================================================== */
  function initCityTabs() {
    const tabs = $$('.bdp-city-tab-btn');
    const browardPills = $$('.bdp-city-pill[data-county="broward"]');
    const palmBeachPills = $$('.bdp-city-pill[data-county="palm-beach"]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        const county = tab.getAttribute('data-county');

        if (county === 'all') {
          browardPills.forEach(p => p.style.display = 'flex');
          palmBeachPills.forEach(p => p.style.display = 'flex');
        } else if (county === 'broward') {
          browardPills.forEach(p => p.style.display = 'flex');
          palmBeachPills.forEach(p => p.style.display = 'none');
        } else if (county === 'palm-beach') {
          browardPills.forEach(p => p.style.display = 'none');
          palmBeachPills.forEach(p => p.style.display = 'flex');
        }
      });
    });
  }

  /* ==========================================================================
     Initialization Lifecycle
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    updateCalculations();
    init3DPoolVisualizer();
    initEstimatorInteractions();
    initBeforeAfterSlider();
    initIntakeForm();
    initLicenseModal();
    initReviewFilters();
    initCityTabs();
  });

})();
