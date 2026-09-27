// Shared helpers for the transparency section. No cookies, no storage, no tracking.
(function () {
  var back = document.getElementById('backBtn');
  if (back) {
    if (history.length <= 1) back.disabled = true;
    back.addEventListener('click', function () { history.back(); });
  }
})();

window.T = {
  esc: function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },
  json: function (url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  },
  // Numbers only ever come from the data files; null means "not yet published".
  fmt: function (n, cur) {
    if (n == null) return 'To be confirmed';
    var s = Number(n).toLocaleString('en-GB');
    return cur ? '€' + s : s;
  },
  date: function (d) {
    if (!d) return '';
    var x = new Date(d + (d.length === 10 ? 'T00:00:00Z' : ''));
    return isNaN(x) ? d : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
};
