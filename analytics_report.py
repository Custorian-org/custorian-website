#!/usr/bin/env python3
"""Custorian.org analytics report — reads the cookieless pageviews table.

Usage:
    export SUPABASE_SERVICE_KEY=...   # Supabase → Project Settings → API → service_role
    python3 analytics_report.py [days]   # default 30

The anon key in track.js is INSERT-only; reading requires the service key,
which must never be committed or shipped to the browser.
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone

SB_URL = "https://trvbspdqonajtsiivxwl.supabase.co"
KEY = os.environ.get("SUPABASE_SERVICE_KEY")
if not KEY:
    sys.exit("Set SUPABASE_SERVICE_KEY first (Supabase → Project Settings → API → service_role).")

days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

rows, offset = [], 0
while True:
    q = urllib.parse.urlencode({"select": "*", "created_at": f"gte.{since}", "order": "created_at.desc"})
    req = urllib.request.Request(
        f"{SB_URL}/rest/v1/pageviews?{q}",
        headers={"apikey": KEY, "Authorization": f"Bearer {KEY}", "Range": f"{offset}-{offset + 999}"},
    )
    batch = json.load(urllib.request.urlopen(req))
    rows += batch
    if len(batch) < 1000:
        break
    offset += 1000

print(f"custorian.org — {len(rows)} pageviews, last {days} days\n")

def top(title, counter, n=15):
    if not counter:
        return
    print(title)
    width = max(len(k) for k, _ in counter.most_common(n))
    for k, v in counter.most_common(n):
        print(f"  {k:<{width}}  {v}")
    print()

by_day, by_page, by_ref, by_utm = Counter(), Counter(), Counter(), Counter()
for r in rows:
    by_day[r["created_at"][:10]] += 1
    path, _, query = r.get("path", "").partition("?")
    by_page[path or "/"] += 1
    for k, vals in urllib.parse.parse_qs(query).items():
        if k.startswith("utm_"):
            by_utm[f"{k}={vals[0]}"] += 1
    ref = r.get("referer") or ""
    if ref:
        host = urllib.parse.urlparse(ref).netloc
        if host and "custorian.org" not in host:
            by_ref[host] += 1

print("Daily")
for day in sorted(by_day):
    print(f"  {day}  {'█' * min(by_day[day], 60)} {by_day[day]}")
print()
top("Pages", by_page)
top("External referrers", by_ref)
top("Campaigns (utm)", by_utm)
