"""Validate every shipped colour palette against contrast and colour-vision limits.

Farms carries several category palettes: a default, and alternatives a user can
pick in Settings for a colour-vision condition. Category *meaning* is always
carried by an SF Symbol glyph plus a fill style (filled / outlined / ringed), so
no palette is load-bearing on its own — but every palette still has to be
legible and internally distinguishable, or it isn't worth offering.

Two gates, applied per palette and per theme:

  1. WCAG non-text contrast >= 3.0 against the surfaces the accent sits on.
  2. Pairwise CIEDE2000 >= 10 under normal vision, AND under each vision type
     that palette claims to serve.

Run: python3 scripts/palette-check.py
Exit code is non-zero if any palette fails, so this can gate CI.
"""

import math
import sys
from itertools import combinations

# ── Surfaces ────────────────────────────────────────────────────────────────
SURFACES = {
    "light": {"paper": "#F4F4EF", "cloud": "#FFFFFF"},
    "dark": {"paper": "#0E0F12", "cloud": "#181A20"},
}

# ── Colour-vision simulation (Machado et al. 2009, severity 1.0) ────────────
CVD = {
    "protanopia": [[0.152286, 1.052583, -0.204868],
                   [0.114503, 0.786281, 0.099216],
                   [-0.003882, -0.048116, 1.051998]],
    "deuteranopia": [[0.367322, 0.860646, -0.227968],
                     [0.280085, 0.672501, 0.047413],
                     [-0.011820, 0.042940, 0.968881]],
    "tritanopia": [[1.255528, -0.076749, -0.178779],
                   [-0.078411, 0.930809, 0.147602],
                   [0.004733, 0.691367, 0.303900]],
}

# ── Palettes ────────────────────────────────────────────────────────────────
# `serves` lists the vision types the palette must remain distinguishable under,
# beyond normal vision. The default palette only promises normal vision: the
# glyph + fill-style axis is what carries meaning for everyone else, and users
# who want colour to work too can switch to one of the alternatives.
PALETTES = {
    "default": {
        "serves": [],
        "light": {"pine": "#1C7C47", "beet": "#8E2C46", "yolk": "#7A5B00",
                  "sky": "#3D6B88", "soil": "#5A4632"},
        "dark": {"pine": "#2EA866", "beet": "#E58AA0", "yolk": "#D9A427",
                 "sky": "#7FB3CE", "soil": "#BFA184"},
    },
    # Red-green deficiencies (deuteranopia ~6% of men, protanopia ~2%).
    # Both types keep the blue<->yellow axis, so the palette lives on it and
    # uses lightness as the second cue. Violet is deliberately absent: it loses
    # its red component and collapses into blue.
    "red-green": {
        "serves": ["deuteranopia", "protanopia"],
        "light": {"pine": "#0E4D3C", "beet": "#7A4B00", "yolk": "#B07F1A",
                  "sky": "#2B6CB8", "soil": "#7C7C7C"},
        "dark": {"pine": "#5FD1C0", "beet": "#C98A22", "yolk": "#F5DE7A",
                 "sky": "#6FA8E8", "soil": "#7E7E7E"},
    },
    # Blue-yellow deficiency (tritanopia, rare). The red-green axis is intact,
    # so it can lean on hues the palette above deliberately avoids.
    "blue-yellow": {
        "serves": ["tritanopia"],
        "light": {"pine": "#1C7C47", "beet": "#A3202E", "yolk": "#8A5A00",
                  "sky": "#6E4B8C", "soil": "#4A4A4A"},
        "dark": {"pine": "#46C77E", "beet": "#FF9FB0", "yolk": "#A87410",
                 "sky": "#C29AE0", "soil": "#B4B4B4"},
    },
    # Achromatopsia, and anyone reading in harsh sunlight.
    #
    # NOT a ramp of five greys: the usable luminance band is only 0-0.26 in the
    # light theme and 0.13-1.0 in the dark, and five steps inside either band
    # land ~9 dE apart — below the floor, i.e. indistinguishable at pin size.
    # So this palette drops tint entirely. Category is carried by glyph and
    # fill style alone, which is what achromatopsia actually needs.
    "monochrome": {
        "serves": ["protanopia", "deuteranopia", "tritanopia"],
        "untinted": True,
        "light": {"ink": "#14161B"},
        "dark": {"ink": "#F1F2EE"},
    },
}

CONTRAST_FLOOR = 3.0
DELTA_E_FLOOR = 10.0


# ── Colour maths ────────────────────────────────────────────────────────────
def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def linear_to_srgb(c):
    c = max(0.0, min(1.0, c))
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def relative_luminance(rgb):
    r, g, b = (srgb_to_linear(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = relative_luminance(a), relative_luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def apply_cvd(rgb, matrix):
    lin = [srgb_to_linear(c) for c in rgb]
    out = [sum(matrix[i][j] * lin[j] for j in range(3)) for i in range(3)]
    return tuple(linear_to_srgb(c) for c in out)


def rgb_to_lab(rgb):
    r, g, b = (srgb_to_linear(c) for c in rgb)
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b)
    z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883

    def f(t):
        return t ** (1 / 3) if t > 216 / 24389 else (841 / 108) * t + 4 / 29

    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cbar = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7))) if Cbar > 0 else 0
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360 if (a1p or b1) else 0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360 if (a2p or b2) else 0
    dLp, dCp = L2 - L1, C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180:
        dhp = h2p - h1p
    else:
        dhp = h2p - h1p - 360 if h2p > h1p else h2p - h1p + 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp) / 2)
    Lbar, Cbarp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbarp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbarp = (h1p + h2p) / 2
    elif h1p + h2p < 360:
        hbarp = (h1p + h2p + 360) / 2
    else:
        hbarp = (h1p + h2p - 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hbarp - 30))
         + 0.24 * math.cos(math.radians(2 * hbarp))
         + 0.32 * math.cos(math.radians(3 * hbarp + 6))
         - 0.20 * math.cos(math.radians(4 * hbarp - 63)))
    dTheta = 30 * math.exp(-(((hbarp - 275) / 25) ** 2))
    Rc = 2 * math.sqrt(Cbarp ** 7 / (Cbarp ** 7 + 25 ** 7)) if Cbarp > 0 else 0
    Sl = 1 + (0.015 * (Lbar - 50) ** 2) / math.sqrt(20 + (Lbar - 50) ** 2)
    Sc = 1 + 0.045 * Cbarp
    Sh = 1 + 0.015 * Cbarp * T
    Rt = -math.sin(math.radians(2 * dTheta)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2
                     + Rt * (dCp / Sc) * (dHp / Sh))


# ── Validation ──────────────────────────────────────────────────────────────
def check_palette(name, spec):
    failures = []
    visions = ["normal"] + spec["serves"]

    for theme in ("light", "dark"):
        accents = spec[theme]

        for accent, hexv in accents.items():
            rgb = hex_to_rgb(hexv)
            for sname, shex in SURFACES[theme].items():
                c = contrast(rgb, hex_to_rgb(shex))
                if c < CONTRAST_FLOOR:
                    failures.append(
                        f"contrast  {theme}/{accent} on {sname}: {c:.2f} < {CONTRAST_FLOOR}")

        # An untinted palette carries category on glyph + fill style alone, so
        # there are no accent pairs to keep apart — only legibility to check.
        if spec.get("untinted"):
            continue

        for a, b in combinations(accents, 2):
            ra, rb = hex_to_rgb(accents[a]), hex_to_rgb(accents[b])
            for vision in visions:
                if vision == "normal":
                    va, vb = ra, rb
                else:
                    va = apply_cvd(ra, CVD[vision])
                    vb = apply_cvd(rb, CVD[vision])
                d = ciede2000(rgb_to_lab(va), rgb_to_lab(vb))
                if d < DELTA_E_FLOOR:
                    failures.append(
                        f"distance  {theme}/{a}+{b} under {vision}: dE {d:.1f} < {DELTA_E_FLOOR}")

    return failures


def main():
    total_failures = 0
    for name, spec in PALETTES.items():
        serves = ", ".join(spec["serves"]) or "normal vision only"
        failures = check_palette(name, spec)
        status = "PASS" if not failures else f"FAIL ({len(failures)})"
        print(f"\n{'=' * 72}\n{name:<16} serves: {serves:<40} {status}\n{'=' * 72}")
        for f in failures:
            print(f"  {f}")
        if not failures:
            print("  All accents clear 3:1 in both themes and stay >=10 dE apart.")
        total_failures += len(failures)

    print(f"\n{'=' * 72}")
    if total_failures:
        print(f"{total_failures} failure(s). Every palette offered in Settings must pass.")
    else:
        print("All palettes pass. Note: category meaning is still glyph-primary —")
        print("these palettes are reinforcement, never the sole carrier (WCAG 1.4.1).")
    return 1 if total_failures else 0


if __name__ == "__main__":
    sys.exit(main())
