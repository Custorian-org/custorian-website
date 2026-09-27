// Funding Commons: renders data/commons.json. A null amount is "To be confirmed", never 0,
// and a bar is drawn only when every amount in its group is known, so a half-filled
// dataset can never show a misleading share.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var e = function (s) { return T.esc(s); };

  function sum(list, key) {
    if (!list.length || list.some(function (x) { return x[key] == null; })) return null;
    return list.reduce(function (a, x) { return a + x[key]; }, 0);
  }

  function bars(list, label, el) {
    var total = sum(list, 'amount');
    el.innerHTML = list.map(function (x) {
      var pct = total ? Math.round(x.amount / total * 100) : null;
      return '<div class="bar"><div class="lab"><span>' + e(x[label]) + '</span><span>' +
        e(T.fmt(x.amount, true)) + (pct != null ? ' &middot; ' + pct + '%' : '') + '</span></div>' +
        '<div class="track"><div class="fill" style="width:' + (pct || 0) + '%"></div></div></div>';
    }).join('');
  }

  T.json('data/commons.json').then(function (d) {
    var inc = sum(d.income_by_source, 'amount'), out = sum(d.spend_by_category, 'amount');
    var members = sum(d.members, 'count');
    $('period').textContent = d.period + (d.updated ? ', last updated ' + T.date(d.updated) : '') + '. All amounts in euro.';
    var stat = function (n, l, cur) {
      return '<div><div class="n' + (n == null ? ' tbc' : '') + '">' + e(T.fmt(n, cur)) + '</div><div class="l">' + l + '</div></div>';
    };
    $('glanceStats').innerHTML = stat(inc, 'Income', true) + stat(out, 'Spent', true) +
      stat(d.received.length ? d.received.length : (d.updated ? 0 : null), 'Grants and payments received') + stat(members, 'Members');
    $('ledgerPending').hidden = !!d.updated;
    bars(d.income_by_source, 'source', $('incomeBars'));
    bars(d.spend_by_category, 'category', $('spendBars'));
    $('ledgerRows').innerHTML = d.received.length ? d.received.map(function (r) {
      return '<tr><td class="num">' + e(T.date(r.date)) + '</td><td>' + e(r.from) + '</td><td>' + e(r.type) + '</td><td>' + e(r.purpose) +
        '</td><td class="num">' + e(T.fmt(r.amount, true)) + '</td></tr>';
    }).join('') : '<tr class="emptyrow"><td colspan="5">No funds recorded yet. Entries appear here once received and booked.</td></tr>';
    $('memberRows').innerHTML = d.members.map(function (m) {
      return '<tr><td>' + e(m.category) + '</td><td class="num">' + e(T.fmt(m.fee, true)) + '</td><td class="num">' + e(T.fmt(m.count)) + '</td></tr>';
    }).join('');
  }).catch(function () {
    $('period').textContent = 'The ledger could not be loaded. Please try again, or email info@custorian.org.';
  });
})();
