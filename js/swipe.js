/* swipe.js — drag & drop swipe logic for Plundr */

class SwipeDeck {
  constructor(cardEl, onSwipe) {
    this.card = cardEl;
    this.onSwipe = onSwipe;

    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.THRESHOLD = 80;

    this._bindEvents();
  }

  _bindEvents() {
    this.card.addEventListener('mousedown', this._onStart.bind(this));
    this.card.addEventListener('touchstart', this._onStart.bind(this), { passive: true });

    document.addEventListener('mousemove', this._onMove.bind(this));
    document.addEventListener('touchmove', this._onMove.bind(this), { passive: false });

    document.addEventListener('mouseup', this._onEnd.bind(this));
    document.addEventListener('touchend', this._onEnd.bind(this));
  }

  _getClientX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  _getClientY(e) {
    return e.touches ? e.touches[0].clientY : e.clientY;
  }

  _onStart(e) {
    if (e.target.tagName === 'BUTTON') return;
    this.isDragging = true;
    this.startX = this._getClientX(e);
    this.startY = this._getClientY(e);
    this.currentX = 0;
    this.card.classList.add('is-dragging');
  }

  _onMove(e) {
    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();

    this.currentX = this._getClientX(e) - this.startX;
    const deltaY = this._getClientY(e) - this.startY;
    const rotation = this.currentX * 0.08;

    this.card.style.transform = `translateX(${this.currentX}px) translateY(${deltaY * 0.1}px) rotate(${rotation}deg)`;

    const stampStarboard = this.card.querySelector('.stamp-starboard');
    const stampPort = this.card.querySelector('.stamp-port');
    const ratio = Math.abs(this.currentX) / this.THRESHOLD;
    const opacity = Math.min(ratio, 1);

    if (this.currentX > 10) {
      stampStarboard.style.opacity = opacity;
      stampPort.style.opacity = 0;
    } else if (this.currentX < -10) {
      stampPort.style.opacity = opacity;
      stampStarboard.style.opacity = 0;
    } else {
      stampStarboard.style.opacity = 0;
      stampPort.style.opacity = 0;
    }
  }

  _onEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.card.classList.remove('is-dragging');

    const stampStarboard = this.card.querySelector('.stamp-starboard');
    const stampPort = this.card.querySelector('.stamp-port');
    stampStarboard.style.opacity = 0;
    stampPort.style.opacity = 0;

    if (this.currentX > this.THRESHOLD) {
      this._flyOff('right');
    } else if (this.currentX < -this.THRESHOLD) {
      this._flyOff('left');
    } else {
      // snap back
      this.card.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
      this.card.style.transform = '';
      setTimeout(() => { this.card.style.transition = ''; }, 400);
    }
  }

  _flyOff(direction) {
    this.card.style.transform = '';
    this.card.classList.add(direction === 'right' ? 'fly-right' : 'fly-left');
    setTimeout(() => {
      this.onSwipe(direction === 'right' ? 'starboard' : 'port');
    }, 400);
  }

  triggerSwipe(direction) {
    this._flyOff(direction === 'starboard' ? 'right' : 'left');
  }

  destroy() {
    document.removeEventListener('mousemove', this._onMove.bind(this));
    document.removeEventListener('touchmove', this._onMove.bind(this));
    document.removeEventListener('mouseup', this._onEnd.bind(this));
    document.removeEventListener('touchend', this._onEnd.bind(this));
  }
}
