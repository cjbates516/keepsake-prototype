#!/usr/bin/env python3
"""Sync design patterns from ~/Desktop/case-photos into the site.

Repeatable + incremental: drop new images into the Desktop folder and re-run.
- content-hash dedupe (same file twice, or "(1)" re-exports, are skipped)
- web-sizes every image to max 900px JPEG via sips (originals untouched)
- auto-categorizes from the filename; add manual fixes in OVERRIDES
- regenerates assets/designs/designs.json which gallery.html renders
"""
import hashlib, json, os, re, subprocess, sys

SRC = os.path.expanduser("~/Desktop/case-photos")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "assets", "designs")
MANIFEST = os.path.join(DEST, "designs.json")

# filename keyword -> category (first match wins)
RULES = [
    (r"leopard|tiger|zebra|cheetah|animal", "Animal print"),
    (r"lion|teddy|kawaii|cartoon|paw|whimsical|cute", "Cute & kids"),
    (r"heart", "Hearts"),
    (r"strawberr|cherr|lemon|orange seamless|blackberry|fruit|peach(es)?\b", "Fruits"),
    (r"floral|flower|daisy|botanical|flora\b|blossom", "Florals"),
    (r"stripe|chevron|wav(y|es)|bands|plaid|gingham|checkered", "Stripes & waves"),
    (r"sunrise|sunset|landscape|mountain|desert|sea\b|dawn|cosmic|shell|beach|butterfl", "Scenery"),
    (r"gradient|ombre|watercolor|pastel", "Gradients & pastels"),
]
DEFAULT_CAT = "Abstract"

# filename (without extension) -> {title, category} manual fixes
OVERRIDES = {
    "Screenshot 2026-07-18 at 6.16.55 PM": {"title": "Painted Florals", "category": "Florals"},
}

STRIP = [
    r"phone case covers?( design)?", r"seamless pattern( design)?( pattern)?",
    r"social media post", r"mobile wallpaper", r"digital (illustration|art(work)?)",
    r"poster", r"sticker", r"for kids decor", r"for subtle everyday style",
    r"for virtual backgrounds", r"design pattern", r"illustration", r"design\b",
    r"on (a )?(white|plain white|beige|light beige|hot pink|pale green|peach|sky blue|lavender|teal|light pink) (background|plaid)?",
    r"\(\d+\)$",
]

def clean_title(name):
    t = name
    for pat in STRIP:
        t = re.sub(pat, "", t, flags=re.I)
    t = re.sub(r"\s{2,}", " ", t).strip(" -·,")
    return (t[:1].upper() + t[1:]) if t else name

def categorize(name):
    low = name.lower()
    for pat, cat in RULES:
        if re.search(pat, low):
            return cat
    return DEFAULT_CAT

def slugify(t):
    s = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return s[:60] or "design"

def main():
    os.makedirs(DEST, exist_ok=True)
    manifest = []
    if os.path.exists(MANIFEST):
        manifest = json.load(open(MANIFEST))
    seen_hashes = {m["hash"] for m in manifest}
    seen_slugs = {m["file"][:-4] for m in manifest}

    added, skipped = 0, 0
    for fname in sorted(os.listdir(SRC)):
        if not re.search(r"\.(png|jpe?g|heic|webp)$", fname, re.I):
            continue
        path = os.path.join(SRC, fname)
        h = hashlib.md5(open(path, "rb").read()).hexdigest()[:12]
        if h in seen_hashes:
            skipped += 1
            continue
        base = re.sub(r"\.[^.]+$", "", fname).strip()
        ov = OVERRIDES.get(base, {})
        title = ov.get("title") or clean_title(base)
        cat = ov.get("category") or categorize(base)
        slug = slugify(title)
        n, s2 = 2, slug
        while s2 in seen_slugs:
            s2 = f"{slug}-{n}"; n += 1
        slug = s2
        out = os.path.join(DEST, slug + ".jpg")
        r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82",
                            "-Z", "900", path, "--out", out],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print("  ! failed:", fname, r.stderr.strip()[:120]); continue
        manifest.append({"file": slug + ".jpg", "title": title, "category": cat, "hash": h})
        seen_hashes.add(h); seen_slugs.add(slug)
        added += 1

    manifest.sort(key=lambda m: (m["category"], m["title"]))
    json.dump(manifest, open(MANIFEST, "w"), indent=1)
    cats = {}
    for m in manifest:
        cats[m["category"]] = cats.get(m["category"], 0) + 1
    print(f"added {added} · skipped {skipped} duplicates · total {len(manifest)}")
    for c, n in sorted(cats.items()):
        print(f"  {c}: {n}")

if __name__ == "__main__":
    main()
