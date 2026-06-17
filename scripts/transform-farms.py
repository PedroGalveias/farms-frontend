#!/usr/bin/env python3
"""Transform the source farm dataset into the frontend's `Farm` schema.

Usage:
    python3 scripts/transform-farms.py input.json > farms.json

Input: the `farms_with_categorized_products.json` shape
    { "locations": [ { title, city, lat, lng, address{...},
                       categorized_products{ <German group>: [ {de, en} ] } } ] }

Output: a JSON array of `Farm` objects matching `types/farm.ts`:
    { id, name, address, canton, coordinates, categories[], created_at, updated_at }

`categories` is set to the English names of the 13 product GROUPS (not the
granular products) — that's the level the directory filter and quick-search
are designed around. Swap GROUP_EN below if you prefer different labels.
"""
import json
import sys

# German category group -> concise English label used across the frontend.
GROUP_EN = {
    "Früchte": "Fruits",
    "Gemüse": "Vegetables",
    "Milchprodukte": "Dairy",
    "Fleisch und Geflügel": "Meat & poultry",
    "Honig und Süßstoffe": "Honey & sweeteners",
    "Backwaren und Gebäck": "Bakery",
    "Getränke": "Drinks",
    "Verarbeitete und haltbare Produkte": "Preserves",
    "Nüsse, Samen und Öle": "Nuts & oils",
    "Getreide und Cerealien": "Grains",
    "Blumen und Pflanzen": "Flowers & plants",
    "Fisch und Meeresfrüchte": "Fish & seafood",
    "Sonstiges": "Other",
}
# Stable display order for categories on each farm.
ORDER = list(GROUP_EN.values())

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
    groups = it.get("categorized_products") or {}
    found = {GROUP_EN[g] for g in groups if g in GROUP_EN}
    return [g for g in ORDER if g in found]


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


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("usage: python3 scripts/transform-farms.py input.json > farms.json")
    src = json.load(open(sys.argv[1], encoding="utf-8"))
    locations = src.get("locations", src if isinstance(src, list) else [])
    farms = [transform(loc, i) for i, loc in enumerate(locations)]
    json.dump(farms, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
