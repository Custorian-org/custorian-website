// Certification Registry: renders data/register.json. Schema in data/README.md.
(function () {
  var LEVELS = { L1: 'L1 Baseline', L2: 'L2 Standard', L3: 'L3 Advanced' };
  var STATUS = { valid: ['Current', 'g'], suspended: ['Suspended', 'a'], withdrawn: ['Withdrawn', 'r'], expired: ['Expired', ''] };
  var today = new Date().toISOString().slice(0, 10);
  var all = [];
  var $ = function (id) { return document.getElementById(id); };

  function effective(c) {
    return c.status === 'valid' && c.valid_to && c.valid_to < today ? 'expired' : c.status;
  }

  function card(c) {
    var st = STATUS[effective(c)] || [c.status, ''];
    var e = T.esc;
    return '<article class="cert"><div class="top"><div><h3>' + e(c.service) + '</h3><div class="holder">' + e(c.holder) +
      '</div></div><span class="pill ' + st[1] + '">' + e(st[0]) + '</span></div><dl>' +
      '<div><dt>Certificate ID</dt><dd>' + e(c.cert_id) + '</dd></div>' +
      '<div><dt>Level</dt><dd>' + e(LEVELS[c.level] || c.level) + '</dd></div>' +
      '<div><dt>Certification body</dt><dd>' + e(c.certification_body) + '</dd></div>' +
      '<div><dt>Edition</dt><dd>' + e(c.edition || '') + '</dd></div>' +
      '<div><dt>Issued</dt><dd>' + e(T.date(c.issued)) + '</dd></div>' +
      '<div><dt>Valid to</dt><dd>' + e(T.date(c.valid_to)) + '</dd></div>' +
      '<div style="grid-column:1/-1"><dt>Scope</dt><dd>' + e(c.scope) + '</dd></div>' +
      '</dl></article>';
  }

  function render() {
    var q = $('q').value.trim().toLowerCase();
    var lv = $('fLevel').value, st = $('fStatus').value, cb = $('fCb').value;
    var rows = all.filter(function (c) {
      if (lv && c.level !== lv) return false;
      if (st && effective(c) !== st) return false;
      if (cb && c.certification_body !== cb) return false;
      if (q && [c.service, c.holder, c.certification_body, c.cert_id].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    $('certs').innerHTML = rows.map(card).join('');
    $('emptyAll').hidden = all.length > 0;
    $('emptyFilter').hidden = !(all.length > 0 && rows.length === 0);
    $('count').textContent = all.length ? rows.length + ' of ' + all.length + ' certificates' : '';
  }

  function lookup(ev) {
    ev.preventDefault();
    var id = $('lookupId').value.trim().toLowerCase();
    var box = $('lookupResult');
    var hit = all.filter(function (c) { return String(c.cert_id).toLowerCase() === id; })[0];
    box.hidden = false;
    if (!hit) {
      box.className = 'result bad';
      box.innerHTML = '<strong>Not on the registry.</strong> No certificate with the ID &ldquo;' + T.esc($('lookupId').value.trim()) +
        '&rdquo; has been issued. Treat any claim resting on it as unverified, and tell us at <a class="inline" href="mailto:info@custorian.org?subject=Certificate%20ID%20check">info@custorian.org</a>.';
      return;
    }
    var s = effective(hit);
    box.className = 'result ' + (s === 'valid' ? 'ok' : 'bad');
    box.innerHTML = (s === 'valid' ? '<strong>Current certificate.</strong> ' : '<strong>Not current: ' + T.esc(STATUS[s][0].toLowerCase()) + '.</strong> ') +
      T.esc(hit.service) + ', held by ' + T.esc(hit.holder) + ', ' + T.esc(LEVELS[hit.level] || hit.level) + ', issued by ' + T.esc(hit.certification_body) +
      ', valid to ' + T.esc(T.date(hit.valid_to)) + '. Check the scope below before relying on it.';
  }

  T.json('data/register.json').then(function (d) {
    all = d.certificates || [];
    var cbs = all.map(function (c) { return c.certification_body; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).sort();
    $('fCb').insertAdjacentHTML('beforeend', cbs.map(function (c) { return '<option>' + T.esc(c) + '</option>'; }).join(''));
    $('updated').textContent = d.updated ? 'Registry last updated ' + T.date(d.updated) + '.' : '';
    render();
  }).catch(function () {
    $('updated').textContent = 'The registry could not be loaded. Please try again, or email info@custorian.org.';
  });

  ['q', 'fLevel', 'fStatus', 'fCb'].forEach(function (id) { $(id).addEventListener('input', render); });
  $('lookupForm').addEventListener('submit', lookup);
})();
