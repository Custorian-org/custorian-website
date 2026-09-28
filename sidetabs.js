/* Custorian side navigation rail: keep the resting colour legible.
   17 Sep 2026.

   The tabs are transparent at rest, so their text and outline sit directly on
   whatever the page has behind them. The rail is fixed and vertically centred
   while the page alternates between full-bleed black bands and paper sections,
   so one fixed colour cannot work: violet disappears on a black band, white
   disappears on paper.

   The decision is per tab, not per rail. The rail is ~675px tall and regularly
   straddles the edge of a band, so flipping all six together leaves whichever
   tabs are on the other side of that edge unreadable.

   Nothing here touches the lit states: hovered, pressed and current-page all
   fill violet with white text, which reads on either background.

   Pages with no dark bands (the legacy-design ones) never get the class. */

/* Mobile menu, 28 Sep 2026. Below 1180px the rail is hidden (sidetabs.css), so
   build a Menu button and a drop-down from the rail's own tabs. Links are cloned;
   buttons (Take action opens a modal) get a stand-in that clicks the original, so
   whatever handler the page bound to it still runs. Desktop is untouched: the
   button and panel are display:none above 1180px. */
(function () {
  var rail = document.querySelector('.sidetabs');
  if (!rail) return;
  var tabs = [].slice.call(rail.querySelectorAll('.sidetab'));
  if (!tabs.length) return;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'navmenu-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'navmenu');
  btn.innerHTML = '<span class="bars" aria-hidden="true"><i></i></span>Menu';

  var panel = document.createElement('nav');
  panel.className = 'navmenu';
  panel.id = 'navmenu';
  panel.setAttribute('aria-label', 'Site menu');

  tabs.forEach(function (t) {
    var item;
    if (t.tagName === 'A') {
      item = t.cloneNode(true);
      item.className = t.classList.contains('solid') ? 'solid' : '';
    } else {
      item = document.createElement('button');
      item.type = 'button';
      item.textContent = t.textContent;
      if (t.classList.contains('solid')) item.className = 'solid';
      item.addEventListener('click', function () { close(); t.click(); });
    }
    panel.appendChild(item);
  });

  function open() {
    // The top bar can wrap to two rows on a phone, so drop the panel from
    // wherever the button actually is rather than a fixed offset.
    panel.style.top = Math.round(btn.getBoundingClientRect().bottom + 8) + 'px';
    panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
  }
  function close() { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    panel.classList.contains('open') ? close() : open();
  });
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('click', function (e) {
    if (!panel.contains(e.target) && e.target !== btn) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) { close(); btn.focus(); }
  });

  // Sit in the foundation top bar where there is one; otherwise pin top right.
  // Placed straight after the brand group so it stays on the first row when the
  // right-hand group wraps below 900px (foundation.css).
  var bar = document.querySelector('.topbar .inner');
  var left = bar && bar.querySelector('.navleft');
  if (left) left.insertAdjacentElement('afterend', btn);
  else if (bar) bar.appendChild(btn);
  else { btn.classList.add('floating'); document.body.appendChild(btn); }
  document.body.appendChild(panel);
})();

(function () {
  var rail = document.querySelector('.sidetabs');
  if (!rail) return;

  var darks = [].slice.call(document.querySelectorAll('.herowrap, .band'));
  if (!darks.length) return;

  var tabs = [].slice.call(rail.querySelectorAll('.sidetab'));
  var queued = false;

  function sync() {
    queued = false;
    // Read every band once, then test each tab against them.
    var bands = darks.map(function (d) {
      var r = d.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    });
    tabs.forEach(function (t) {
      var r = t.getBoundingClientRect();
      var mid = r.top + r.height / 2;
      var onDark = bands.some(function (b) { return b.top <= mid && b.bottom >= mid; });
      t.classList.toggle('on-dark', onDark);
    });
  }

  function request() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  sync();
})();
