#!/usr/bin/env python3
"""Stamp every local CSS and JS reference with a hash of the file it points at.

WHY

The site is plain static files on GitHub Pages, which serves them with a cache
lifetime the repository does not control. A page that asks for `foundation.css` with
no version gets whatever copy the visitor's browser already has. On 17 September 2026
that hid a live change for long enough to look like a bug: the markup was correct and
the rule was being served, but the browser held the stylesheet from before the rule
existed, so a restored logo rendered as nothing.

Shared assets make this worse, not better. foundation.css, sidetabs.css, sidetabs.js,
sectionnav.js and track.js are each referenced from several pages, so one stale copy
affects the whole site rather than one page.

WHAT IT DOES

Rewrites every reference to a local .css or .js file as `name.ext?v=<hash>`, where the
hash is the first eight hex characters of the file's SHA-256. Change the file and the
URL changes with it, so browsers fetch the new copy; leave it alone and the URL is
stable, so they keep using their cache. Idempotent: running it twice changes nothing.

USAGE

    python3 stamp_assets.py            rewrite the pages in place
    python3 stamp_assets.py --check    report staleness and exit 1, changing nothing

--check is what CI runs, so a push that skipped the hook is noisy rather than silent.

Install the hook once, so this cannot be forgotten locally:

    git config core.hooksPath .githooks
"""

import argparse
import hashlib
import pathlib
import re
import sys

# Only local assets. A protocol-relative or absolute URL belongs to someone else and is
# not ours to version.
REF = re.compile(r'(?P<attr>href|src)="(?P<file>(?!https?:|//)[^"?]+\.(?:css|js))(?:\?v=[a-f0-9]+)?"')


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="report what would change and exit 1; do not write")
    args = ap.parse_args()

    root = pathlib.Path(__file__).parent
    hashes: dict[str, str] = {}
    stale: list[str] = []
    changed: list[str] = []
    missing: set[str] = set()

    for page in sorted(root.glob("*.html")):
        text = page.read_text(encoding="utf-8")

        def stamp(m: re.Match) -> str:
            name = m.group("file")
            target = root / name
            if not target.is_file():
                # A reference to something not in the repo: leave it exactly as it is.
                missing.add(name)
                return m.group(0)
            if name not in hashes:
                hashes[name] = digest(target)
            return f'{m.group("attr")}="{name}?v={hashes[name]}"'

        updated = REF.sub(stamp, text)
        if updated != text:
            (stale if args.check else changed).append(page.name)
            if not args.check:
                page.write_text(updated, encoding="utf-8")

    for name in sorted(hashes):
        print(f"  {name:<20} v={hashes[name]}")
    for name in sorted(missing):
        print(f"  {name:<20} not in the repo, left alone")

    if args.check:
        if stale:
            print(f"\nSTALE: {', '.join(stale)}")
            print("Run `python3 stamp_assets.py` and commit the result.")
            return 1
        print("\nEvery asset reference is current.")
        return 0

    print(f"\n{len(changed)} page(s) updated" + (f": {', '.join(changed)}" if changed else ", nothing to do"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
