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
