'use strict';

/* ============================================================
   CONCEPT SPORT FITNESS — Application PWA
   Router hash : #capsule/{id} | #impression | (accueil)
   ============================================================ */

let DATA = null;

const ZONE_COLORS = {
  dos:       '#ef4444',
  bras:      '#60a5fa',
  jambes:    '#4ade80',
  pectoraux: '#c084fc',
  epaules:   '#fbbf24',
  abdos:     '#22d3ee',
};

const NIVEAU = {
  1: { label: 'Débutant',       color: 'var(--niveau-1)', bg: 'rgba(74,222,128,.12)',  stars: '★☆☆' },
  2: { label: 'Intermédiaire',  color: 'var(--niveau-2)', bg: 'rgba(249,115,22,.12)', stars: '★★☆' },
  3: { label: 'Confirmé',       color: 'var(--niveau-3)', bg: 'rgba(239,68,68,.12)',   stars: '★★★' },
};

const CAT_CLASS = {
  'Haut du corps': 'cat-haut',
  'Bas du corps':  'cat-bas',
  'Full Body':     'cat-full',
  'Cardio':        'cat-cardio',
};

// ---- Boot -------------------------------------------------------

(async function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }

  try {
    const res = await fetch('data.json');
    DATA = await res.json();
  } catch {
    document.getElementById('app').innerHTML =
      '<div class="error-state">Impossible de charger les données.<br>Vérifiez votre connexion.</div>';
    return;
  }

  window.addEventListener('hashchange', route);
  route();
})();

// ---- Router -----------------------------------------------------

function route() {
  const hash = window.location.hash;
  if (hash.startsWith('#capsule/')) {
    renderEquipement(hash.slice('#capsule/'.length));
  } else if (hash === '#impression') {
    renderImpression();
  } else {
    renderHome();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function navigate(hash) {
  window.location.hash = hash;
}

// ---- Vue : ACCUEIL ----------------------------------------------

function renderHome(activeFilter = '') {
  const categories = ['', ...new Set(DATA.equipements.map(e => e.categorie))];
  const filtered = activeFilter
    ? DATA.equipements.filter(e => e.categorie === activeFilter)
    : DATA.equipements;

  const filterHtml = categories.map(cat => `
    <button class="filter-btn ${cat === activeFilter ? 'active' : ''}"
            onclick="renderHome('${cat}')">
      ${cat || 'Tous'}
    </button>`).join('');

  const cardsHtml = filtered.map(e => {
    const levels = e.exercices.map(ex => ex.niveau);
    const minLvl = Math.min(...levels);
    const niv = NIVEAU[minLvl];
    const catClass = CAT_CLASS[e.categorie] || 'cat-default';
    const abbrev = e.nom.split(/[\s—\-]/g).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return `
      <div class="equip-card" onclick="navigate('#capsule/${e.id}')">
        <div class="card-thumb ${catClass}">${abbrev}</div>
        <div class="card-body">
          <div class="card-name">${e.nom}</div>
          <div class="card-meta">
            <span class="card-exercises">${e.exercices.length} exercice${e.exercices.length > 1 ? 's' : ''}</span>
            <span class="card-level" style="background:${niv.bg};color:${niv.color}">
              ${niv.stars}
            </span>
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('app').innerHTML = `
    <div class="view view-home">
      <div class="home-header">
        <div class="home-brand">
          <div class="home-brand-logo">CS</div>
          <div class="home-brand-name">
            Concept Sport
            <span>Fitness Outdoor</span>
          </div>
        </div>
        <h1 class="home-tagline">SCANNEZ.<br><em>APPRENEZ.</em><br>PROGRESSEZ.</h1>
      </div>
      <div class="filter-bar">${filterHtml}</div>
      <div class="cards-grid">${cardsHtml}</div>
      <div style="height:60px"></div>
    </div>
    ${bottomNav('#impression', '⬛ QR Codes', 'Imprimer les QR codes')}`;
}

// ---- Vue : FICHE AGRÈS ------------------------------------------

function renderEquipement(id, exerciceIdx = 0) {
  const eq = DATA.equipements.find(e => e.id === id);
  if (!eq) { navigate(''); return; }

  const ex = eq.exercices[exerciceIdx] || eq.exercices[0];
  const tabsHtml = eq.exercices.map((e, i) => `
    <button class="tab-btn ${i === exerciceIdx ? 'active' : ''}"
            onclick="renderEquipement('${id}', ${i})">
      ${e.titre}
    </button>`).join('');

  document.getElementById('app').innerHTML = `
    <div class="view view-equipement">
      <div class="page-header">
        <button class="btn-back" onclick="navigate('')">&#8592;</button>
        <span class="page-header-title">${eq.nom}</span>
      </div>
      <div class="video-wrap">
        <video id="exVideo" autoplay ${ex.muted === false ? '' : 'muted'} loop playsinline
               poster="" onerror="this.style.background='#0f1117'">
          <source src="${ex.video}" type="video/mp4">
        </video>
        <button class="btn-mute" id="btnMute" onclick="toggleMute()">${ex.muted === false ? '🔊' : '🔇'}</button>
      </div>
      <div class="equip-info">
        <h2 class="equip-nom">${formatNom(eq.nom)}</h2>
        <p class="equip-desc">${eq.description}</p>
      </div>
      <div class="exercice-tabs">${tabsHtml}</div>
      <div class="exercice-panel fade-in" id="exPanel">
        ${renderExercicePanel(ex)}
      </div>
      <div style="height:60px"></div>
    </div>
    ${bottomNav('#impression', '⬛ QR Codes', 'Imprimer les QR codes')}`;
}

function renderExercicePanel(ex) {
  const niv = NIVEAU[ex.niveau];

  const musclesHtml = ex.muscles.map(m => {
    const color = ZONE_COLORS[m.zone] || '#aaa';
    return `<span class="muscle-chip"
      style="color:${color};border-color:${color}33;background:${color}15">
      ${m.nom}
    </span>`;
  }).join('');

  const postureHtml = ex.posture.map((s, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <p class="step-text">${s}</p>
    </div>`).join('');

  const mouvHtml = ex.mouvement.map((s, i) => `
    <div class="step">
      <div class="step-num">${i + 1}</div>
      <p class="step-text">${s}</p>
    </div>`).join('');

  return `
    <div class="ex-header">
      <div class="ex-title">${ex.titre}</div>
      <div class="ex-meta">
        <span class="ex-niveau" style="background:${niv.bg};color:${niv.color}">
          ${niv.stars} ${niv.label}
        </span>
        <span class="ex-duree">${ex.duree}</span>
      </div>
    </div>
    <div class="section-label">Muscles ciblés</div>
    <div class="muscles-row">${musclesHtml}</div>
    <div class="section-label">Posture</div>
    <div class="steps">${postureHtml}</div>
    <div class="section-label">Mouvement</div>
    <div class="steps">${mouvHtml}</div>
    <div class="section-label">Conseil du coach</div>
    <div class="coach-tip">
      <div class="coach-tip-label">&#127944; Conseil du Coach</div>
      <p class="coach-tip-text">${ex.conseil_coach}</p>
    </div>`;
}

// ---- Vue : IMPRESSION QR CODES ----------------------------------

function renderImpression() {
  const baseUrl = DATA.baseUrl.replace('[votre-username]', location.hostname || 'votre-username');

  const homeUrl   = baseUrl + '/';
  const equipUrls = DATA.equipements.map(e => ({
    id:  e.id,
    nom: e.nom,
    url: baseUrl + '/#capsule/' + e.id,
  }));
  const allItems = [{ id: 'accueil', nom: 'Accueil — Tous les agrès', url: homeUrl }, ...equipUrls];

  const cardsHtml = allItems.map(item => `
    <div class="qr-card">
      <div class="qr-card-label">${item.id === 'accueil' ? 'Panneau principal' : 'Agrès'}</div>
      <div class="qr-canvas-wrap" id="qr-${item.id}"></div>
      <div class="qr-nom">${item.nom}</div>
      <div class="qr-url">${item.url}</div>
      <button class="btn-dl" onclick="downloadQR('${item.id}','${escHtml(item.nom)}')">
        ↓ Télécharger PNG
      </button>
    </div>`).join('');

  document.getElementById('app').innerHTML = `
    <div class="view view-impression">
      <div class="page-header">
        <button class="btn-back" onclick="navigate('')">&#8592;</button>
        <span class="page-header-title">QR Codes</span>
      </div>
      <div class="impression-header">
        <h1>QR <span>CODES</span></h1>
        <p>Imprimez et collez sur chaque agrès</p>
      </div>
      <div class="impression-actions">
        <button class="btn-primary" onclick="window.print()">🖨️ Imprimer tout</button>
      </div>
      <div class="qr-grid">${cardsHtml}</div>
    </div>`;

  // Génère les QR codes après le rendu DOM
  requestAnimationFrame(() => {
    allItems.forEach(item => generateQR(item.id, item.url));
  });
}

function generateQR(id, url) {
  if (typeof QRCode === 'undefined') return;
  const wrap = document.getElementById('qr-' + id);
  if (!wrap) return;
  new QRCode(wrap, {
    text: url,
    width: 160,
    height: 160,
    colorDark: '#080a0f',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
}

function downloadQR(id, nom) {
  const wrap = document.getElementById('qr-' + id);
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'qr-' + id + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ---- Utilitaires ------------------------------------------------

function toggleMute() {
  const video = document.getElementById('exVideo');
  const btn   = document.getElementById('btnMute');
  if (!video) return;
  video.muted = !video.muted;
  btn.textContent = video.muted ? '🔇' : '🔊';
}

function bottomNav(href, icon, label) {
  return `
    <div class="bottom-nav">
      <button class="nav-qr-btn" onclick="navigate('${href}')">
        <span class="nav-qr-icon">${icon}</span>
        ${label}
      </button>
    </div>`;
}

function formatNom(nom) {
  // Colore la partie après le tiret en orange
  const parts = nom.split('—');
  if (parts.length > 1) {
    return parts[0] + '— <span>' + parts.slice(1).join('—') + '</span>';
  }
  return nom;
}

function escHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
