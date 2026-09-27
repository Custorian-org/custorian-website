// ESP Accountability Index: renders ../intermediary-index/hosting-evidence.json, the same
// published-source file the Intermediary Accountability Index uses. One file, two views.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var e = function (s) { return T.esc(s); };
  var all = [], key = 'brand', dir = 1;

  function recid(x) { var m = /([\d.]+)\s*%/.exec(x.recidivism || ''); return m ? parseFloat(m[1]) : null; }

  function render() {
    var q = $('q').value.trim().toLowerCase(), src = $('fSource').value;
    var rows = all.filter(function (x) {
      if (src && x.source !== src) return false;
      return !q || (x.brand + ' ' + x.figure).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) {
      var va = key === 'recid' ? recid(a) : a[key], vb = key === 'recid' ? recid(b) : b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    });
    $('rows').innerHTML = rows.length ? rows.map(function (x) {
      return '<tr><td><strong>' + e(x.brand) + '</strong></td><td class="num">' + e(x.recidivism || '') + '</td><td>' + e(x.figure) +
        '</td><td><a href="' + e(x.url) + '" target="_blank" rel="noopener noreferrer">' + e(x.source) + ' &#8599;</a></td><td class="num">' + e(x.year) + '</td></tr>';
    }).join('') : '<tr class="emptyrow"><td colspan="5">No provider matches.</td></tr>';
    $('count').textContent = rows.length + ' of ' + all.length + ' providers';
  }

  T.json('../intermediary-index/hosting-evidence.json').then(function (d) {
    all = d;
    var srcs = d.map(function (x) { return x.source; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
    $('fSource').insertAdjacentHTML('beforeend', srcs.map(function (s) { return '<option>' + e(s) + '</option>'; }).join(''));
    render();
  }).catch(function () { $('count').textContent = 'The provider list could not be loaded.'; });

  $('q').addEventListener('input', render);
  $('fSource').addEventListener('input', render);
  [].forEach.call(document.querySelectorAll('#espTable th button'), function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-sort');
      dir = key === k ? -dir : (k === 'recid' ? -1 : 1);
      key = k;
      render();
    });
  });
})();
