#!/usr/bin/env python3
"""Keep In Store pick code numbers stable.

Pick codes look like 17P-FLR-012: phone id, collection code, design number.
This script gives every design in assets/designs/designs.json a number inside its
collection and saves it to instore/codes.json. Numbers already given out never change.
New designs get the next free numbers in their collection, ordered by title then file
name (plain code point order). codes.json is the ONLY source of numbers: the iPad shows no
code at all for a design that is not in it, so a code can never point to two designs.
If a design moves to another collection it gets a new code and its old code is kept under
"retired", so find.html still resolves codes that were already shown to customers.

tools/sync_designs.py runs this automatically. By hand:  python3 tools/instore_codes.py
Check only (exit 1 if a live design has no code):     python3 tools/instore_codes.py --check
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "assets", "designs", "designs.json")
CONFIG = os.path.join(ROOT, "instore", "config.json")
CODES = os.path.join(ROOT, "instore", "codes.json")


def fallback_code(category, used):
    """Same rule as KPI.fallbackCode in instore/instore-lib.js: never collide with a code in use."""
    base = (re.sub(r"[^A-Za-z]", "", category)[:3].upper() or "GEN").ljust(3, "X")
    if base not in used:
        return base
    for i in range(1, 100):
        c = base[:2] + str(i) if i < 10 else base[:1] + str(i)
        if c not in used:
            return c
    return "Z" + str(len(used))


def fallback_codes(designs, col_code):
    """Codes for categories missing from config.json, in sorted order like the iPad."""
    used = set(col_code.values())
    out = {}
    for cat in sorted({d["category"] for d in designs if d["category"] not in col_code},
                      key=lambda c: c.encode("utf-16-be")):
        out[cat] = fallback_code(cat, used)
        used.add(out[cat])
    return out


def main():
    designs = json.load(open(MANIFEST))
    config = json.load(open(CONFIG))
    col_code = {c["category"]: c["code"] for c in config["collections"]}
    try:
        old = json.load(open(CODES))
    except FileNotFoundError:
        old = {}
    reg = old.get("codes", {})
    retired = dict(old.get("retired", {}))
    # high water mark per collection, so a number is never handed out twice,
    # even after a design is removed or moves to another collection
    top = dict(old.get("top", {}))
    for r in reg.values():
        top[r["c"]] = max(top.get(r["c"], 0), r["n"])

    extra = fallback_codes(designs, col_code)
    for cat, code in extra.items():
        print(f"warning: category {cat!r} is not in instore/config.json, using code {code}; add it there")
    code_of = lambda d: col_code.get(d["category"]) or extra[d["category"]]

    if "--check" in sys.argv:
        missing = [d["file"] for d in designs if not d.get("hidden")
                   and not (reg.get(d["file"]) and reg[d["file"]]["c"] == code_of(d))]
        print(f"{len(missing)} live designs without a pick code" + (": " + ", ".join(missing[:10]) if missing else ""))
        sys.exit(1 if missing else 0)

    pending = {}
    for d in designs:
        r = reg.get(d["file"])
        if not (r and r["c"] == code_of(d)):
            pending.setdefault(code_of(d), []).append(d)

    added = 0
    for c, items in pending.items():
        items.sort(key=lambda d: (d["title"], d["file"]))
        n = top.get(c, 0)
        for d in items:
            n += 1
            prev = reg.get(d["file"])
            if prev:   # moved collection: keep the old code resolvable
                retired[f'{prev["c"]}-{prev["n"]:03d}'] = d["file"]
            reg[d["file"]] = {"c": c, "n": n}
            added += 1
        top[c] = n

    out = {
        "_readme": "Pick code numbers for In Store mode. Made by tools/instore_codes.py. Do not edit by hand; numbers never change once given out. top is the highest number ever used in each collection.",
        "top": {c: top[c] for c in sorted(top)},
        "retired": {k: retired[k] for k in sorted(retired)},
        "codes": {f: reg[f] for f in sorted(reg)},
    }
    with open(CODES, "w") as fh:
        json.dump(out, fh, indent=0, sort_keys=False)
        fh.write("\n")
    big = max((v["n"] for v in out["codes"].values()), default=0)
    print(f"{len(out['codes'])} designs coded, {added} new, highest number {big}")


if __name__ == "__main__":
    main()
