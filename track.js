// Custorian — cookieless page-view analytics for custorian.org.
// No cookies, no localStorage, no visitor id, no personal data: one
// fire-and-forget POST per page load, recording only the path + referrer.
// Anon key is public by design; Supabase RLS allows INSERT only.
(function () {
  try {
    var SB_URL = 'https://trvbspdqonajtsiivxwl.supabase.co';
    var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydmJzcGRxb25hanRzaWl2eHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTQ4MzcsImV4cCI6MjA5ODI5MDgzN30.MME7OKOU6CZz-ZIz8By0Xiehr25oZ809qmVAQU3HvF8';
    fetch(SB_URL + '/rest/v1/pageviews', {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': 'Bearer ' + SB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        path: location.pathname,
        referer: document.referrer || null,
        source: 'org_website'
      }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
})();
