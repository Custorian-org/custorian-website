/* Custorian left-hand section nav: mark the section you are currently reading.
   17 Sep 2026.

   Plain scroll position rather than IntersectionObserver, because what we want
   is "which section owns the top of the viewport", which is one comparison per
   section and stays correct when a section is taller or shorter than the
   window. Sections named by the rail may live in different .shell wrappers, so
   they are looked up by href rather than by walking one container. */
(function () {
  var rails = [].slice.call(document.querySelectorAll('.layout .rail'));
  if (!rails.length) return;

  var links = [];
  rails.forEach(function (rail) {
    [].slice.call(rail.querySelectorAll('a[href^="#"]')).forEach(function (a) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) links.push({ a: a, target: target });
    });
  });
  if (!links.length) return;

  var queued = false;

  function sync() {
    queued = false;
    var line = 140;                     // just below the sticky top bar
    var current = null;
    links.forEach(function (l) {
      if (l.target.getBoundingClientRect().top <= line) current = l;
    });
    // Before the first section has crossed the line but while it is already on
    // screen, it is still the one being read, so fall back to it rather than
    // leaving the rail with nothing marked.
    if (!current && links[0].target.getBoundingClientRect().top < window.innerHeight) {
      current = links[0];
    }
    links.forEach(function (l) { l.a.classList.toggle('on', l === current); });
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
