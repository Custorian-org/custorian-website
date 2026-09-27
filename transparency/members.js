// Member dashboard. Supabase magic-link sign-in; reads members, member_votes and
// member_documents under the RLS policies in supabase/001_members.sql.
//
// MEMBERS_ENABLED stays false until (1) that migration is applied, (2) the site URL
// is added to the Supabase auth redirect allow-list, and (3) members are provisioned.
// While false the page shows a "not switched on yet" notice and loads nothing.
// The URL and anon key are the same public ones track.js already ships.
(function () {
  var MEMBERS_ENABLED = false;
  var SB_URL = 'https://trvbspdqonajtsiivxwl.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydmJzcGRxb25hanRzaWl2eHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTQ4MzcsImV4cCI6MjA5ODI5MDgzN30.MME7OKOU6CZz-ZIz8By0Xiehr25oZ809qmVAQU3HvF8';

  var $ = function (id) { return document.getElementById(id); };
  var e = function (s) { return T.esc(s); };

  if (!MEMBERS_ENABLED || !SB_URL || !SB_KEY || !window.supabase) {
    $('notConfigured').hidden = false;
    return;
  }
  var sb = window.supabase.createClient(SB_URL, SB_KEY);

  function show(signedIn) {
    $('signin').hidden = signedIn;
    $('dash').hidden = !signedIn;
  }

  function msg(text, ok) {
    var m = $('signinMsg');
    m.hidden = false;
    m.className = 'msg ' + (ok ? 'ok' : 'err');
    m.textContent = text;
  }

  $('signinForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var email = $('email').value.trim();
    if (!$('email').checkValidity() || !email) { msg('Enter a valid email address.'); return; }
    $('sendBtn').disabled = true;
    sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } })
      .then(function (r) {
        // Same message whether or not the address is a member, so the form does not
        // reveal who is.
        if (r.error && r.error.status && r.error.status >= 500) msg('Something went wrong. Please try again, or email info@custorian.org.');
        else msg('If that address belongs to a member, a sign-in link is on its way. It expires after one hour.', true);
      })
      .finally(function () { $('sendBtn').disabled = false; });
  });

  $('signOut').addEventListener('click', function () { sb.auth.signOut().then(function () { show(false); }); });

  function load(user) {
    show(true);
    sb.from('members').select('*').eq('user_id', user.id).maybeSingle().then(function (r) {
      var m = r.data;
      $('noRecord').hidden = !!m;
      $('kv').hidden = !m;
      $('hello').textContent = m && m.full_name ? 'Signed in as ' + m.full_name + ' (' + user.email + ').' : 'Signed in as ' + user.email + '.';
      if (!m) return;
      var today = new Date().toISOString().slice(0, 10);
      var dues = m.dues_paid_through ? T.date(m.dues_paid_through) + (m.dues_paid_through < today ? ' (overdue)' : '') : 'Not recorded';
      var cell = function (k, v) { return '<div><div class="k">' + k + '</div><div class="v">' + e(v) + '</div></div>'; };
      $('kv').innerHTML = cell('Category', m.category) + cell('Status', m.status.charAt(0).toUpperCase() + m.status.slice(1)) +
        cell('Member since', m.member_since ? T.date(m.member_since) : 'Not recorded') + cell('Dues paid through', dues);
    });
    sb.from('member_votes').select('*').order('held_on', { ascending: false }).then(function (r) {
      var rows = r.data || [];
      $('voteRows').innerHTML = rows.length ? rows.map(function (v) {
        var t = v.url ? '<a href="' + e(v.url) + '" target="_blank" rel="noopener">' + e(v.title) + '</a>' : e(v.title);
        return '<tr><td>' + t + '</td><td>' + e(v.meeting || '') + '</td><td class="num">' + e(T.date(v.held_on)) + '</td><td>' + e(v.status) + '</td><td>' + e(v.result || '') + '</td></tr>';
      }).join('') : '<tr class="emptyrow"><td colspan="5">No votes scheduled.</td></tr>';
    });
    sb.from('member_documents').select('*').order('published_on', { ascending: false }).then(function (r) {
      var rows = r.data || [];
      $('docList').innerHTML = rows.length ? rows.map(function (d) {
        return '<li><a href="' + e(d.url) + '" target="_blank" rel="noopener">' + e(d.title) + '</a><span class="meta">' + e(d.kind || '') + ' &middot; ' + e(T.date(d.published_on)) + '</span></li>';
      }).join('') : '<li><span class="meta">No documents yet.</span></li>';
    });
  }

  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session;
    if (s) load(s.user); else show(false);
  });
  sb.auth.onAuthStateChange(function (evt, session) {
    if (evt === 'SIGNED_IN' && session) load(session.user);
    if (evt === 'SIGNED_OUT') show(false);
  });
})();
