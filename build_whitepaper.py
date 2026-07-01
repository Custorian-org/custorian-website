#!/usr/bin/env python3
"""
Build whitepaper.html — an on-brand, readable HTML edition of the Custorian
White Paper with a section-level public-comment form after every section.

Comments submit client-side to Web3Forms (email to info@custorian.org) AND are
mirrored into the existing Supabase `feedback` table, with the section title
folded into the `comments` field and marked source='whitepaper'. No schema
change required.

Re-run this whenever the source markdown changes:

    python3 build_whitepaper.py

Point SRC at the current white-paper markdown if the version bumps.
"""
import subprocess, re, html, sys, os

# ---- inputs ---------------------------------------------------------------
SRC = "/Users/tanyabecheva/Desktop/Custorian/01_NGO/standard/papers/Custorian_White_Paper_v6_1.md"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "whitepaper.html")

# reused from index.html (public keys by design)
W3_KEY = "cfeb795c-19e4-42ee-9ab3-66290e1c5e34"
SB_URL = "https://trvbspdqonajtsiivxwl.supabase.co"
SB_KEY = ("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6"
          "InRydmJzcGRxb25hanRzaWl2eHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MTQ4"
          "MzcsImV4cCI6MjA5ODI5MDgzN30.MME7OKOU6CZz-ZIz8By0Xiehr25oZ809qmVAQU3HvF8")

TITLE    = "A Compliance Standard for Child Digital Safety"
SUBTITLE = ("An open framework for platform certification, institutional "
            "intelligence, and regulatory conformity.")
VERSION  = "Version 6.1 — Pre-Publication Draft, June 2026"

# ---- 1. read + trim source -------------------------------------------------
md = open(SRC, encoding="utf-8").read()

# keep from the first "## " section onward (drop the H1 title + front matter;
# we build the cover ourselves)
i = md.find("\n## ")
body_md = md[i + 1:] if i != -1 else md

# drop the paper's own "## Contents" section — we generate a live TOC
body_md = re.sub(r"\n## Contents\b.*?(?=\n## )", "\n", body_md, flags=re.S)

# ---- 2. markdown -> html fragment ------------------------------------------
# NB: use pandoc's own `markdown` reader (not `gfm`) — the source uses pandoc
# multiline tables (---- rules), which gfm misreads as Setext headings.
proc = subprocess.run(
    ["pandoc", "--from", "markdown", "--to", "html", "--wrap=none"],
    input=body_md, capture_output=True, text=True,
)
if proc.returncode:
    sys.exit("pandoc failed:\n" + proc.stderr)
frag = proc.stdout

# ---- 3. inject section ids + comment tools, collect TOC --------------------
def slug(text):
    s = re.sub(r"<[^>]+>", "", text)
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).strip().lower()
    return re.sub(r"\s+", "-", s) or "section"

toc = []

TOOLS = """
<div class="section-tools" data-nocomment-print>
  <button type="button" class="cmt-toggle" onclick="toggleComment(this)">\U0001F4AC Comment on this section</button>
  <form class="cmt-form" data-section="{sec}" onsubmit="return submitComment(this)" hidden>
    <p class="cmt-label">Comment on <strong>{sec}</strong></p>
    <textarea name="message" rows="4" placeholder="Your thoughts on this section…" required></textarea>
    <input type="email" name="email" placeholder="Email (required)" required>
    <input type="text" name="botcheck" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="cmt-actions">
      <button type="submit">Send comment</button>
      <button type="button" class="cmt-cancel" onclick="toggleComment(this)">Cancel</button>
    </div>
    <p class="cmt-status" role="status"></p>
  </form>
</div>
"""

def on_h2(m):
    hid = m.group("id")
    inner = m.group("inner")
    title_txt = re.sub(r"<[^>]+>", "", inner).strip()
    if not hid:
        hid = slug(title_txt)
    toc.append((hid, title_txt))
    tag = '<h2 id="%s">%s</h2>' % (hid, inner)
    return tag + TOOLS.format(sec=html.escape(title_txt, quote=True))

frag = re.sub(r'<h2(?:\s+id="(?P<id>[^"]*)")?>(?P<inner>.*?)</h2>',
              on_h2, frag, flags=re.S)

toc_html = "\n".join(
    '      <li><a href="#%s">%s</a></li>' % (hid, html.escape(t)) for hid, t in toc
)

# ---- 4. assemble page ------------------------------------------------------
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Custorian White Paper — read &amp; comment</title>
<meta name="description" content="The Custorian White Paper, open for review. Read it section by section and comment on any part — a public consultation on an open child digital-safety standard.">
<meta property="og:title" content="Custorian White Paper — read &amp; comment">
<meta property="og:description" content="Read the Custorian standard's white paper and comment on any section. A public consultation, in the open.">
<style>
  :root{
    --purple:#8B5CF6; --ink:#1a1a1a; --muted:#6b6b6b;
    --line:#e4e0da; --paper:#ffffff; --wash:#faf8f5;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact;scroll-behavior:smooth;}
  body{
    background:var(--paper); color:var(--ink);
    font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased; line-height:1.6; font-size:16px;
  }
  a{color:var(--purple);}
  .doc{max-width:820px; margin:0 auto; padding:56px 48px 96px;}

  .actionbar{
    position:sticky; top:0; z-index:50; background:var(--ink); color:#fff;
    display:flex; justify-content:space-between; align-items:center;
    padding:12px 24px; font-size:12px; letter-spacing:0.2em; text-transform:uppercase;
  }
  .actionbar a.home{color:#fff; text-decoration:none;}
  .actionbar button{
    font-family:inherit; font-size:12px; letter-spacing:0.2em; text-transform:uppercase;
    background:var(--purple); color:#fff; border:none; padding:10px 22px; cursor:pointer; font-weight:700;
  }
  .actionbar button:hover{opacity:.9;}

  .cover{border-bottom:2px solid var(--ink); padding-bottom:40px; margin-bottom:8px;}
  .wordmark{
    font-size:13px; letter-spacing:0.5em; text-transform:uppercase; font-weight:800;
    display:flex; align-items:center; gap:12px; margin-bottom:44px;
  }
  .wordmark .glyph{display:inline-grid; grid-template-columns:repeat(2,7px); grid-gap:2px;}
  .wordmark .glyph i{width:7px; height:7px; background:var(--purple); display:block;}
  .cover h1{
    font-size:clamp(32px,5.5vw,54px); font-weight:900; letter-spacing:-0.03em;
    line-height:1.0; text-transform:uppercase; margin-bottom:20px;
  }
  .cover .lede{font-size:18px; line-height:1.5; max-width:60ch; color:var(--ink);}
  .cover .meta{margin-top:26px; font-size:11px; letter-spacing:0.16em; text-transform:uppercase; color:var(--muted);}
  .cover .meta span{margin-right:16px;}

  .consult{
    background:var(--wash); border-left:3px solid var(--purple);
    padding:18px 22px; margin:28px 0 8px; font-size:15px;
  }
  .consult strong{font-weight:800;}

  .toc{margin:36px 0 8px; padding:24px 26px; border:1px solid var(--line); background:#fff;}
  .toc h2{font-size:11px; letter-spacing:0.3em; text-transform:uppercase; color:var(--muted); font-weight:800; margin-bottom:14px; border:0;}
  .toc ol{list-style:none; counter-reset:toc; columns:2; column-gap:36px;}
  .toc li{margin-bottom:7px; break-inside:avoid; font-size:14px;}
  .toc a{text-decoration:none;}
  .toc a:hover{text-decoration:underline;}

  h2{
    font-size:27px; font-weight:900; letter-spacing:-0.02em; line-height:1.15;
    margin:52px 0 4px; padding-top:22px; border-top:2px solid var(--ink); scroll-margin-top:64px;
  }
  h3{font-size:19px; font-weight:800; letter-spacing:-0.01em; margin:30px 0 6px; scroll-margin-top:64px;}
  h4{font-size:15px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted); margin:22px 0 4px;}
  p{margin-bottom:14px; max-width:72ch;}
  ul,ol{margin:12px 0 16px 22px;}
  li{margin-bottom:6px; max-width:70ch;}
  blockquote{background:var(--wash); border-left:3px solid var(--purple); padding:14px 20px; margin:16px 0; font-size:15px;}
  code{background:var(--wash); padding:1px 5px; border-radius:3px; font-size:13.5px;}
  pre{background:var(--wash); padding:16px 18px; overflow-x:auto; margin:16px 0; font-size:13px; border:1px solid var(--line);}
  pre code{background:none; padding:0;}
  hr{border:0; border-top:1px solid var(--line); margin:28px 0;}
  table{width:100%; border-collapse:collapse; margin:14px 0; font-size:13.5px;}
  thead th{text-align:left; font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--muted); border-bottom:1.5px solid var(--ink); padding:8px 10px 8px 0; font-weight:700;}
  tbody td{border-bottom:1px solid var(--line); padding:9px 10px 9px 0; vertical-align:top;}

  /* SECTION COMMENT TOOLS */
  .section-tools{margin:14px 0 6px;}
  .cmt-toggle{
    font-family:inherit; font-size:12px; letter-spacing:0.04em; font-weight:700;
    background:none; color:var(--purple); border:1px solid var(--line);
    padding:7px 14px; border-radius:20px; cursor:pointer;
  }
  .cmt-toggle:hover{border-color:var(--purple); background:var(--wash);}
  .cmt-form{border:1px solid var(--line); border-left:3px solid var(--purple); background:#fff; padding:18px 20px; margin-top:10px; max-width:60ch;}
  .cmt-label{font-size:13px; color:var(--muted); margin-bottom:10px;}
  .cmt-form textarea, .cmt-form input[type=email]{
    width:100%; font-family:inherit; font-size:14px; padding:10px 12px;
    border:1px solid var(--line); border-radius:4px; margin-bottom:10px; resize:vertical;
  }
  .cmt-form textarea:focus, .cmt-form input:focus{outline:none; border-color:var(--purple);}
  .hp{position:absolute; left:-9999px; width:1px; height:1px; opacity:0;}
  .cmt-actions{display:flex; gap:10px; align-items:center;}
  .cmt-form button[type=submit]{
    font-family:inherit; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; font-weight:700;
    background:var(--purple); color:#fff; border:none; padding:9px 18px; border-radius:4px; cursor:pointer;
  }
  .cmt-cancel{font-family:inherit; font-size:13px; background:none; border:none; color:var(--muted); cursor:pointer;}
  .cmt-status{font-size:13px; color:var(--muted); margin:8px 0 0;}
  .cmt-thanks{font-size:14px; color:var(--ink);}

  footer{margin-top:64px; padding-top:22px; border-top:2px solid var(--ink); font-size:11px; letter-spacing:0.06em; color:var(--muted);}
  footer a{color:var(--purple); text-decoration:none;}

  @media print{
    .actionbar, .section-tools, .toc{display:none;}
    .doc{max-width:none; padding:0 8mm;}
    body{font-size:10.5pt;}
    h2{page-break-after:avoid;}
  }
  @media (max-width:640px){
    .doc{padding:32px 20px;}
    .toc ol{columns:1;}
    table, thead, tbody, th, td, tr{display:block;}
    thead{display:none;}
    tbody td{border:none; padding:2px 0;}
    tbody tr{border-bottom:1px solid var(--line); padding:12px 0;}
  }
</style>
</head>
<body>

<div class="actionbar">
  <a class="home" href="https://custorian.org">‹ Back to custorian.org</a>
  <span>White Paper · open for comment</span>
  <button onclick="window.print()">Download / Print PDF</button>
</div>

<div class="doc">

  <div class="cover">
    <div class="wordmark"><span class="glyph"><i></i><i></i><i></i><i></i></span> Custorian</div>
    <h1>__TITLE__</h1>
    <p class="lede">__SUBTITLE__</p>
    <div class="meta">
      <span>Foreningen Custorian</span><span>CVR 46399455</span><span>__VERSION__</span>
    </div>
  </div>

  <div class="consult">
    <strong>This is a living consultation draft.</strong> Custorian is an open standard, developed in the open. Read any section below and use the &ldquo;Comment on this section&rdquo; button to tell us what is wrong, missing, or unclear. Comments reach the foreningen directly; an email address is required so we can follow up or clarify.
    <br><br>
    <strong>Please note:</strong> we have already received a substantial volume of feedback, which is currently under review and being considered for the next revision. As a result, <strong>this version (__VERSION__) may not reflect our most current thinking</strong>, and some sections may be revised or superseded in the forthcoming edition.
    <br><br>
    The formal standard — <strong>Custorian Draft EN v0.2</strong> — is published on Zenodo: <a href="https://zenodo.org/records/19675375">zenodo.org/records/19675375</a>.
  </div>

  <nav class="toc" aria-label="Contents">
    <h2>Contents</h2>
    <ol>
__TOC__
    </ol>
  </nav>

__BODY__

  <footer>
    Foreningen Custorian &middot; CVR 46399455 &middot; Odense, Denmark<br>
    __VERSION__. This white paper is open for review and comment; the Custorian Standard (Draft EN v0.2) is the authoritative source, and where the two differ, the standard governs.<br>
    Read the standard: <a href="https://zenodo.org/records/19675375">zenodo.org/records/19675375</a> &middot; <a href="https://custorian.org">custorian.org</a>
  </footer>

</div>

<script>
  var W3_KEY = "__W3KEY__";
  var SB_URL = "__SBURL__";
  var SB_KEY = "__SBKEY__";

  function toggleComment(el){
    var tools = el.closest('.section-tools');
    var form = tools.querySelector('.cmt-form');
    var toggle = tools.querySelector('.cmt-toggle');
    var show = form.hasAttribute('hidden');
    if(show){ form.removeAttribute('hidden'); toggle.style.display='none'; form.querySelector('textarea').focus(); }
    else{ form.setAttribute('hidden',''); toggle.style.display=''; }
  }

  function sbInsert(row){
    try{
      fetch(SB_URL + '/rest/v1/feedback', {
        method:'POST',
        headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},
        body:JSON.stringify(row), keepalive:true
      }).catch(function(){});
    }catch(e){}
  }

  function submitComment(form){
    if(form.botcheck && form.botcheck.value){ return false; } // honeypot
    var section = form.getAttribute('data-section');
    var message = form.message.value.trim();
    var email = form.email.value.trim();
    var status = form.querySelector('.cmt-status');
    if(!message || !email){ return false; }
    status.textContent = 'Sending…';
    var payload = {
      access_key: W3_KEY,
      subject: 'White paper comment — ' + section,
      from_name: 'Custorian White Paper',
      section: section,
      email: email,
      message: message
    };
    fetch('https://api.web3forms.com/submit', {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload)
    })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.success){
        sbInsert({name:null, email:(email||null), comments:'[§ '+section+'] '+message, source:'whitepaper'});
        var safe = section.replace(/&/g,'&amp;').replace(/</g,'&lt;');
        form.innerHTML = '<p class="cmt-thanks">Thank you — your comment on <strong>'+safe+'</strong> has been received.</p>';
      } else {
        status.textContent = 'Something went wrong. Please email info@custorian.org.';
      }
    })
    .catch(function(){ status.textContent = 'Network error. Please email info@custorian.org.'; });
    return false;
  }
</script>

<!-- Cookieless page-view analytics -->
<script src="track.js"></script>
</body>
</html>
"""

page = (HEAD
        .replace("__TITLE__", html.escape(TITLE))
        .replace("__SUBTITLE__", html.escape(SUBTITLE))
        .replace("__VERSION__", html.escape(VERSION))
        .replace("__TOC__", toc_html)
        .replace("__BODY__", frag)
        .replace("__W3KEY__", W3_KEY)
        .replace("__SBURL__", SB_URL)
        .replace("__SBKEY__", SB_KEY))

open(OUT, "w", encoding="utf-8").write(page)
print("Wrote %s  (%d sections, %d bytes)" % (OUT, len(toc), len(page)))
