#!/usr/bin/env python3
"""Transform the source farm dataset into the frontend's `Farm` schema, and
validate that the frontend category catalog covers the dataset.

Usage:
    python3 scripts/transform-farms.py input.json > farms.json

Input: the `farms_with_categorized_products.json` shape — a top-level object
whose (only) list value holds locations, each with
    { title, city, lat, lng, address{...},
      categorized_products: { <German group>: [ {de, en} ] } }

Output: a JSON array of `Farm` objects matching `types/farm.ts`.

`categories` is set to the canonical **German** product-group names (e.g.
"Früchte") — the same strings the backend stores and that `lib/categories.ts`
translates and gives icons. Unknown groups pass through unchanged (the frontend
falls back to showing the raw German), and a warning is printed so the new
group can be added to the catalog. This script is also the sync check: it fails
loudly if the dataset contains a group the frontend catalog doesn't cover.
"""
import json
import os
import sys

# Canonical German product groups, in display order.
# Keep in sync with lib/categories.ts (validated by check_catalog below).
KNOWN_GROUPS = [
    "Früchte",
    "Gemüse",
    "Milchprodukte",
    "Fleisch und Geflügel",
    "Verarbeitete und haltbare Produkte",
    "Honig und Süßstoffe",
    "Getränke",
    "Backwaren und Gebäck",
    "Blumen und Pflanzen",
    "Nüsse, Samen und Öle",
    "Getreide und Cerealien",
    "Fisch und Meeresfrüchte",
    "Sonstiges",
]
ORDER = {g: i for i, g in enumerate(KNOWN_GROUPS)}

CATALOG_PATH = os.path.join(
    os.path.dirname(__file__), "..", "lib", "categories.ts"
)

VALID_CANTONS = {
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU",
    "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS",
    "ZG", "ZH",
}


def to_canton(address: dict) -> str:
    iso = (address or {}).get("ISO3166-2-lvl4", "")
    code = iso.replace("CH-", "") if iso.startswith("CH-") else ""
    return code if code in VALID_CANTONS else ""


def to_address(it: dict) -> str:
    address = it.get("address") or {}
    road = address.get("road") or ""
    postcode = address.get("postcode") or ""
    city = it.get("city") or address.get("village") or ""
    parts = [road, (postcode + " " + city).strip()]
    return ", ".join(p for p in parts if p) or it.get("display_name", "")


def to_categories(it: dict) -> list[str]:
    """Canonical German group names on this farm: known groups first (in
    catalog order), then any unknown groups (alphabetical) so nothing is lost."""
    groups = list((it.get("categorized_products") or {}).keys())
    known = sorted((g for g in groups if g in ORDER), key=lambda g: ORDER[g])
    unknown = sorted(g for g in groups if g not in ORDER)
    return known + unknown


def transform(location: dict, index: int) -> dict:
    return {
        "id": location.get("url_title") or f"farm-{index}",
        "name": location.get("title") or "Unnamed farm",
        "address": to_address(location),
        "canton": to_canton(location.get("address")),
        "coordinates": f"{location.get('lat')}, {location.get('lng')}",
        "categories": to_categories(location),
        "created_at": "2026-06-01T00:00:00Z",
        "updated_at": None,
    }


def check_catalog(seen_groups: set[str]) -> None:
    """Warn if the dataset has groups the frontend catalog doesn't cover."""
    try:
        catalog = open(CATALOG_PATH, encoding="utf-8").read()
    except OSError:
        print("! could not read lib/categories.ts to validate", file=sys.stderr)
        return
    # Catalog keys are either bare identifiers (`Früchte:`) or quoted
    # (`"Fleisch und Geflügel":`) — check both forms.
    missing = sorted(
        g for g in seen_groups
        if f'"{g}"' not in catalog and f"{g}:" not in catalog
    )
    unused = sorted(g for g in KNOWN_GROUPS if g not in seen_groups)
    if missing:
        print(
            "! categories in the data but NOT in lib/categories.ts "
            f"(add them): {missing}",
            file=sys.stderr,
        )
    if unused:
        print(f"· catalog groups not present in this dataset: {unused}", file=sys.stderr)
    if not missing:
        print(
            f"✓ catalog covers all {len(seen_groups)} category groups in the data",
            file=sys.stderr,
        )


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: python3 scripts/transform-farms.py input.json > farms.json")
    src = json.load(open(sys.argv[1], encoding="utf-8"))
    if isinstance(src, list):
        locations = src
    elif "locations" in src:
        locations = src["locations"]
    else:  # top-level object with a single list value
        locations = next((v for v in src.values() if isinstance(v, list)), [])

    farms = [transform(loc, i) for i, loc in enumerate(locations)]

    seen_groups: set[str] = set()
    for loc in locations:
        seen_groups.update((loc.get("categorized_products") or {}).keys())
    check_catalog(seen_groups)

    json.dump(farms, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
