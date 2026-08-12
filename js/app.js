(function () {
  'use strict';

  const state = {
    deck: [],
    index: 0,
    crew: [],
    sirens: 0,
    activeDeck: null,
    toastTimer: null,
  };

  const els = {
    deck: document.getElementById('card-deck'),
    restart: document.getElementById('btn-restart'),
    port: document.getElementById('btn-port'),
    starboard: document.getElementById('btn-starboard'),
    toast: document.getElementById('toast'),
  };

  function shuffleDeck() {
    state.deck = [...PROFILES].sort(() => Math.random() - 0.5);
  }

  function showToast(message, tone = 'neutral') {
    clearTimeout(state.toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast ${tone}`;
    els.toast.classList.remove('hidden');
    state.toastTimer = setTimeout(() => {
      els.toast.className = 'toast hidden';
      els.toast.classList.add('hidden');
    }, tone === 'siren' ? 2300 : 1600);
  }

  function buildCard(profile) {
    const card = document.createElement('article');
    card.className = 'profile-card';
    card.dataset.id = profile.id;
    card.style.setProperty('--status-bg', profile.isSiren ? 'rgba(255, 99, 125, 0.14)' : 'rgba(30, 166, 217, 0.14)');
    card.style.setProperty('--status-ink', profile.isSiren ? '#c63d5f' : '#0f7fb0');

    const role = profile.isSiren ? 'SIREN' : 'CREW';

    card.innerHTML = `
      <div class="card-hero" aria-hidden="true"></div>
      <div class="card-top">
        <div class="card-badge">
          <strong>${profile.status}</strong>
        </div>
        <div class="card-emoji" aria-hidden="true">${profile.emoji}</div>
      </div>
      <div class="card-content">
        <div class="card-name-row">
          <h2 class="card-name">${profile.name}</h2>
          <span class="card-status">${role}</span>
        </div>
        <p class="card-line">${profile.line}</p>
        <p class="card-bio">${profile.bio}</p>
        <div class="tag-row">
          ${profile.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="card-ripple" aria-hidden="true"></div>
      <div class="stamp stamp-starboard">starboard</div>
      <div class="stamp stamp-port">port</div>
    `;

    card.querySelector('.card-hero').style.background = `
      radial-gradient(circle at 35% 16%, rgba(255,255,255,0.26), transparent 26%),
      linear-gradient(160deg, ${profile.accent} 0%, rgba(255, 255, 255, 0.92) 56%, rgba(245, 251, 255, 0.98) 100%)
    `;

    return card;
  }

  function buildPeek(profile, offsetClass) {
    const peek = document.createElement('article');
    peek.className = `card-peek ${offsetClass}`;
    peek.style.setProperty('--accent', profile.accent);
    return peek;
  }

  function buildEmptyCard() {
    const card = document.createElement('article');
    card.className = 'profile-card';
    card.innerHTML = `
      <div class="card-hero" aria-hidden="true"></div>
      <div class="card-content">
        <div class="card-name-row">
          <h2 class="card-name">Deck empty</h2>
          <span class="card-status">DONE</span>
        </div>
        <p class="card-line">that was the whole joke.</p>
        <p class="card-bio">hit reshuffle if you want to make the same mistake again.</p>
      </div>
    `;
    return card;
  }

  function renderDeck() {
    els.deck.innerHTML = '';

    if (state.index >= state.deck.length) {
      els.deck.appendChild(buildEmptyCard());
      if (state.activeDeck) {
        state.activeDeck.destroy();
        state.activeDeck = null;
      }
      showToast('deck empty. reshuffle if you want more nonsense.', 'neutral');
      return;
    }

    const nextA = state.deck[state.index + 1];
    const nextB = state.deck[state.index + 2];

    if (nextB) {
      els.deck.appendChild(buildPeek(nextB, 'card-peek-3'));
    }
    if (nextA) {
      els.deck.appendChild(buildPeek(nextA, 'card-peek-2'));
    }

    const profile = state.deck[state.index];
    const card = buildCard(profile);
    els.deck.appendChild(card);

    if (state.activeDeck) {
      state.activeDeck.destroy();
    }
    state.activeDeck = new SwipeDeck(card, handleSwipe);
  }

  function handleSwipe(direction) {
    const profile = state.deck[state.index];
    state.index += 1;

    if (direction === 'starboard') {
      state.crew.push(profile);
      if (profile.isSiren) {
        state.sirens += 1;
        showToast(profile.sirenReveal, 'siren');
      } else {
        showToast(`${profile.name} is in.`, 'match');
      }
    } else {
      showToast(`port. ${profile.name} swims off.`, 'neutral');
    }

    renderDeck();
  }

  function restart() {
    state.index = 0;
    state.crew = [];
    state.sirens = 0;
    shuffleDeck();
    renderDeck();
    showToast('fresh deck. same bad decisions.', 'neutral');
  }

  function handleKeydown(event) {
    if (event.key === 'ArrowLeft') {
      els.port.click();
    }
    if (event.key === 'ArrowRight') {
      els.starboard.click();
    }
  }

  els.port.addEventListener('click', () => {
    if (state.activeDeck) state.activeDeck.triggerSwipe('port');
  });

  els.starboard.addEventListener('click', () => {
    if (state.activeDeck) state.activeDeck.triggerSwipe('starboard');
  });

  els.restart.addEventListener('click', restart);
  document.addEventListener('keydown', handleKeydown);

  shuffleDeck();
  renderDeck();
})();
