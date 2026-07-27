#!/usr/bin/env python3
"""Sync design patterns from ~/Desktop/case-photos into the site.

Repeatable + incremental: drop new images into the Desktop folder and re-run.
- content-hash dedupe (same file twice, or "(1)" re-exports, are skipped)
- web-sizes every image to max 1600px JPEG via sips (originals untouched)
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
    (r"city map|philadelphia|philly|west chester|pottstown|newark|wilmington", "City maps"),
    # seasonal first — "cute halloween ghost" belongs in Halloween, not Cute & kids
    (r"halloween|spooky|pumpkin|ghost|bat(s)?\b|witch|skeleton|spider|candy corn|jack-?o", "Halloween"),
    (r"christmas|xmas|santa|snowflake|snowman|holly|reindeer|candy cane|gingerbread|mistletoe|ornament", "Christmas"),
    (r"bow(s)?\b|ribbon|lace|coquette", "Coquette"),
    (r"checker|smiley|groovy|y2k|gingham|plaid|disco|emoji", "Retro & Y2K"),
    (r"western|cowboy|cowgirl|rodeo|wild west", "Western"),
    (r"\bdogs?\b|\bcats?\b|puppy|puppies|kitten|paw print|dachshund|corgi|labrador|whale|shark|dolphin|octopus|sea life|ocean animal", "Animals"),
    (r"birth[- ]flower", "Birth flowers"),
    (r"zodiac|constellation", "Zodiac"),
    (r"celestial|starry|\bstars?\b|\bmoons?\b|\bsuns?\b", "Celestial"),
    (r"city map|-map-|street map|\blake\b|marsh-creek|marsh creek|atlas", "City maps"),
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
    if "-" in t and " " not in t:
        t = t.replace("-", " ")
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

def classify_colors(img_path):
    """Dominant color buckets for shop-by-color (up to 2 of:
    Red Pink Orange Yellow Green Blue Purple Brown Black White Grey Beige)."""
    try:
        from PIL import Image
    except ImportError:
        return []
    try:
        im = Image.open(img_path).convert("RGB").resize((64, 64))
    except Exception:
        return []
    hsv = im.convert("HSV")
    counts = {}
    px = im.load(); pxh = hsv.load()
    for y in range(64):
        for x in range(64):
            r, g, b = px[x, y]
            h, sat, v = pxh[x, y]
            if v < 60: bucket = "Black"
            elif sat < 45:
                if v > 215: bucket = "White"
                elif r - b > 18 and v > 140: bucket = "Beige"
                else: bucket = "Grey"
            else:
                if (h < 12 or h >= 243):
                    bucket = "Pink" if (sat < 130 and v > 180) else "Red"
                elif h < 30:
                    bucket = "Brown" if v < 150 else "Orange"
                elif h < 48: bucket = "Yellow"
                elif h < 115: bucket = "Green"
                elif h < 180: bucket = "Blue"
                elif h < 205: bucket = "Purple"
                else: bucket = "Pink"
            counts[bucket] = counts.get(bucket, 0) + 1
    total = 64 * 64
    ranked = sorted(counts.items(), key=lambda kv: -kv[1])
    white_share = counts.get("White", 0) / total
    picks = [b for b, n in ranked if b != "White" and n / total >= 0.15][:2]
    if not picks:
        picks = ["White"] if white_share >= 0.5 else [ranked[0][0]] if ranked else []
    return picks

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
                            "-Z", "1600", path, "--out", out],
                           capture_output=True, text=True)
        if r.returncode != 0:
            print("  ! failed:", fname, r.stderr.strip()[:120]); continue
        manifest.append({"file": slug + ".jpg", "title": title, "category": cat, "hash": h,
                         "color": classify_colors(out)})
        seen_hashes.add(h); seen_slugs.add(slug)
        added += 1

    manifest.sort(key=lambda m: (m["category"], m["title"]))
    for entry in manifest:
        if "-" in entry["title"] and " " not in entry["title"]:
            entry["title"] = clean_title(os.path.splitext(entry["file"])[0]).title()
    backfilled = 0
    for entry in manifest:
        if not entry.get("color"):
            tp = os.path.join(DEST, "thumbs", entry["file"])
            entry["color"] = classify_colors(tp if os.path.exists(tp) else os.path.join(DEST, entry["file"]))
            backfilled += 1
    if backfilled: print(f"color backfill: {backfilled} designs")
    hidden_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hidden.json")
    hidden = set(json.load(open(hidden_path))) if os.path.exists(hidden_path) else set()
    for entry in manifest:
        if entry["file"] in hidden: entry["hidden"] = True
        elif "hidden" in entry: del entry["hidden"]
    json.dump(manifest, open(MANIFEST, "w"), indent=1)
    cats = {}
    for m in manifest:
        cats[m["category"]] = cats.get(m["category"], 0) + 1
    print(f"added {added} · skipped {skipped} duplicates · total {len(manifest)}")
    for c, n in sorted(cats.items()):
        print(f"  {c}: {n}")

if __name__ == "__main__":
    main()
