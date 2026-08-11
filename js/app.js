/* app.js — main Plundr controller */

(function () {
  'use strict';

  // ─── State ───
  let deck = [];
  let currentIndex = 0;
  let matches = [];
  let swipeDeck = null;
  let awaitingModal = false;

  // Profile avatars (emoji fallbacks — no external images needed)
  const AVATARS = ['🧭','⚓','🦜','🌊','⚔️','🏴‍☠️','🐚','🌙','🗺️','🔱'];

  // ─── DOM refs ───
  const screens = {
    landing: document.getElementById('landing-screen'),
    swipe:   document.getElementById('swipe-screen'),
    log:     document.getElementById('log-screen'),
    empty:   document.getElementById('empty-screen'),
  };

  const cardDeck     = document.getElementById('card-deck');
  const crewCount    = document.getElementById('crew-count');
  const crewBtn      = document.getElementById('crew-btn');

  const matchModal   = document.getElementById('match-modal');
  const sirenModal   = document.getElementById('siren-modal');
  const matchName    = document.getElementById('match-modal-name');
  const matchMsg     = document.getElementById('match-modal-msg');
  const sirenName    = document.getElementById('siren-modal-name');
  const sirenMsg     = document.getElementById('siren-modal-msg');

  const logList      = document.getElementById('log-list');

  // ─── Helpers ───
  function showScreen(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== name);
    });
  }

  function updateCrewCounter() {
    crewCount.textContent = matches.length;
  }

  // ─── Profile card builder ───
  function buildCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.id = profile.id;

    const avatarEmoji = AVATARS[(profile.id - 1) % AVATARS.length];

    card.innerHTML = `
      <div class="card-photo-placeholder">${avatarEmoji}</div>
      <div class="card-overlay"></div>
      <div class="card-content">
        <div class="card-name-row">
          <span class="card-name">${profile.name}</span>
          <span class="card-voyages">${profile.voyages} voyages</span>
        </div>
        <div class="card-location">📍 Sighted near ${profile.port}</div>
        <div class="card-bio">${profile.bio}</div>
        <div class="card-treasures">
          ${profile.treasures.map(t => `<span class="treasure-tag">⚓ ${t}</span>`).join('')}
        </div>
      </div>
      <div class="stamp stamp-starboard">ABOARD!</div>
      <div class="stamp stamp-port">PORT!</div>
    `;
    return card;
  }

  function buildPeekCard(cls) {
    const el = document.createElement('div');
    el.className = `card-peek ${cls}`;
    return el;
  }

  // ─── Render deck ───
  function renderDeck() {
    cardDeck.innerHTML = '';

    if (currentIndex >= deck.length) {
      showEmpty();
      return;
    }

    // Peek cards (behind)
    if (currentIndex + 2 < deck.length) {
      cardDeck.appendChild(buildPeekCard('card-peek-3'));
    }
    if (currentIndex + 1 < deck.length) {
      cardDeck.appendChild(buildPeekCard('card-peek-2'));
    }

    // Active card (on top)
    const profile = deck[currentIndex];
    const card = buildCard(profile);
    cardDeck.appendChild(card);

    // Attach swipe logic
    if (swipeDeck) swipeDeck.destroy();
    swipeDeck = new SwipeDeck(card, handleSwipe);
  }

  // ─── Handle swipe decision ───
  function handleSwipe(direction) {
    if (awaitingModal) return;
    const profile = deck[currentIndex];
    currentIndex++;

    if (direction === 'starboard') {
      matches.push(profile);
      updateCrewCounter();

      awaitingModal = true;
      setTimeout(() => {
        if (profile.isSiren) {
          showSirenModal(profile);
        } else {
          showMatchModal(profile);
        }
      }, 150);
    } else {
      renderDeck();
    }
  }

  // ─── Match modal ───
  function showMatchModal(profile) {
    matchName.textContent = `Ye found yer first mate — ${profile.name}!`;
    matchMsg.textContent = `${profile.name} has joined yer crew! The seas look brighter already, ye lucky scallywag.`;
    matchModal.classList.remove('hidden');
  }

  function hideMatchModal() {
    matchModal.classList.add('hidden');
    awaitingModal = false;
    renderDeck();
  }

  // ─── Siren modal ───
  function showSirenModal(profile) {
    sirenName.textContent = `🚨 ${profile.name} is a SIREN! 🚨`;
    sirenMsg.textContent = profile.sirenReveal;
    sirenModal.classList.remove('hidden');
  }

  function hideSirenModal() {
    sirenModal.classList.add('hidden');
    awaitingModal = false;
    renderDeck();
  }

  // ─── Ship's Log ───
  function renderLog() {
    logList.innerHTML = '';
    if (matches.length === 0) {
      logList.innerHTML = `<div class="log-empty">
        <div style="font-size:3rem;margin-bottom:0.5rem">📜</div>
        <div>Yer ship's log be empty, sailor.<br>Set sail and find yer crew!</div>
      </div>`;
      return;
    }
    matches.forEach((profile, i) => {
      const avatarEmoji = AVATARS[(profile.id - 1) % AVATARS.length];
      const item = document.createElement('div');
      item.className = 'log-item';
      item.innerHTML = `
        <div class="log-avatar">${avatarEmoji}</div>
        <div class="log-info">
          <div class="log-name">${profile.name} ${profile.isSiren ? '<span class="log-siren-badge">⚠ Siren</span>' : ''}</div>
          <div class="log-last">${profile.voyages} voyages · Sighted near ${profile.port}</div>
        </div>
        <button class="btn-bottle" data-idx="${i}">🍾 Send a Bottle</button>
      `;
      logList.appendChild(item);
    });

    // Bottle message placeholder
    logList.querySelectorAll('.btn-bottle').forEach(btn => {
      btn.addEventListener('click', () => {
        const profile = matches[parseInt(btn.dataset.idx)];
        btn.textContent = '📩 Sent!';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        setTimeout(() => { btn.textContent = '🍾 Send a Bottle'; btn.disabled = false; btn.style.opacity = ''; }, 2000);
        // Fake "toast"
        showToast(`Yer bottle has been cast to ${profile.name}!`);
      });
    });
  }

  // ─── Toast ───
  function showToast(msg) {
    const existing = document.querySelector('.plundr-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'plundr-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;bottom:4rem;left:50%;transform:translateX(-50%);
      background:rgba(10,22,40,0.95);color:#f5e6c8;
      font-family:'Cinzel',serif;font-size:0.78rem;letter-spacing:0.04em;
      padding:0.6rem 1.2rem;border-radius:20px;
      border:1px solid rgba(201,151,58,0.4);
      box-shadow:0 4px 16px rgba(0,0,0,0.5);
      z-index:500;animation:fade-in 0.3s ease;
      white-space:nowrap;pointer-events:none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  // ─── Empty state ───
  function showEmpty() {
    showScreen('empty');
    document.getElementById('empty-siren-count').textContent =
      matches.filter(p => p.isSiren).length;
    document.getElementById('empty-match-count').textContent = matches.length;
  }

  // ─── Restart ───
  function restart() {
    // Shuffle deck
    deck = [...PROFILES].sort(() => Math.random() - 0.5);
    currentIndex = 0;
    matches = [];
    updateCrewCounter();
    showScreen('swipe');
    renderDeck();
  }

  // ─── Keyboard ───
  document.addEventListener('keydown', (e) => {
    if (screens.swipe.classList.contains('hidden')) return;
    if (awaitingModal) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!matchModal.classList.contains('hidden')) hideMatchModal();
        if (!sirenModal.classList.contains('hidden')) hideSirenModal();
      }
      return;
    }
    if (e.key === 'ArrowLeft')  swipeDeck && swipeDeck.triggerSwipe('port');
    if (e.key === 'ArrowRight') swipeDeck && swipeDeck.triggerSwipe('starboard');
  });

  // ─── Event listeners ───
  document.getElementById('btn-set-sail').addEventListener('click', () => {
    restart();
  });

  document.getElementById('btn-port').addEventListener('click', () => {
    if (!awaitingModal && swipeDeck) swipeDeck.triggerSwipe('port');
  });

  document.getElementById('btn-starboard').addEventListener('click', () => {
    if (!awaitingModal && swipeDeck) swipeDeck.triggerSwipe('starboard');
  });

  crewBtn.addEventListener('click', () => {
    renderLog();
    showScreen('log');
  });

  document.getElementById('btn-back-from-log').addEventListener('click', () => {
    showScreen('swipe');
  });

  document.getElementById('btn-match-continue').addEventListener('click', hideMatchModal);
  document.getElementById('btn-match-log').addEventListener('click', () => {
    hideMatchModal();
    setTimeout(() => { renderLog(); showScreen('log'); }, 300);
  });

  document.getElementById('btn-siren-continue').addEventListener('click', hideSirenModal);
  document.getElementById('btn-siren-log').addEventListener('click', () => {
    hideSirenModal();
    setTimeout(() => { renderLog(); showScreen('log'); }, 300);
  });

  document.getElementById('btn-restart').addEventListener('click', restart);
  document.getElementById('btn-view-log').addEventListener('click', () => {
    renderLog();
    showScreen('log');
  });

  // ─── Init ───
  showScreen('landing');

})();
