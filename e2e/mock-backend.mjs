// Deterministic stand-in for the farms backend, used only by the Playwright
// e2e run (see playwright.config.ts webServer). The home page fetches the farm
// list *server-side*, so page.route() can't mock it; instead we point the app's
// FARMS_API_BASE_URL at this tiny server. That removes the dependency on the
// free-tier Render backend, whose cold starts made the suite flaky (the home
// page rendered zero farms → no cards → favorite.spec failed).
//
// Run: node e2e/mock-backend.mjs   (PORT defaults to 4319)
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_BACKEND_PORT ?? 4319);

// A small but representative directory: multiple cantons and categories so the
// directory, facets, search and farm cards all have something real to render.
const FARMS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Berghof Studer",
    address: "Dorfstrasse 1, 3013 Bern",
    canton: "BE",
    coordinates: "46.9480,7.4474",
    categories: ["Gemüse", "Früchte", "Eier"],
    created_at: "2026-06-01T08:00:00Z",
    updated_at: null,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Hofladen Meier",
    address: "Bahnhofstrasse 5, 8001 Zürich",
    canton: "ZH",
    coordinates: "47.3769,8.5417",
    categories: ["Milchprodukte", "Honig"],
    created_at: "2026-06-10T08:00:00Z",
    updated_at: null,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Cascina Rossi",
    address: "Via Cantonale 12, 6500 Bellinzona",
    canton: "TI",
    coordinates: "46.1944,9.0244",
    categories: ["Wein", "Früchte"],
    created_at: "2026-06-15T08:00:00Z",
    updated_at: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Ferme du Lac",
    address: "Route du Lac 8, 1006 Lausanne",
    canton: "VD",
    coordinates: "46.5197,6.6323",
    categories: ["Gemüse", "Fleisch"],
    created_at: "2026-06-20T08:00:00Z",
    updated_at: null,
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Alpkäserei Truttmann",
    address: "Hauptstrasse 3, 6440 Brunnen",
    canton: "SZ",
    coordinates: "46.9990,8.6030",
    categories: ["Milchprodukte", "Käse"],
    created_at: "2026-06-25T08:00:00Z",
    updated_at: null,
  },
];

// Pad the directory out to a few hundred farms so the e2e suite exercises the
// same regime that crashed real devices: multiple "Load more" pages, culled
// off-screen cards, long scrolls. Deterministic (no randomness) so runs are
// reproducible; the 5 handcrafted farms above stay first so name-based specs
// keep working.
const GENERATED_COUNT = 235;
const GEN_CANTONS = [
  ["BE", "46.95", "7.45"],
  ["ZH", "47.38", "8.54"],
  ["VD", "46.52", "6.63"],
  ["AG", "47.39", "8.05"],
  ["SG", "47.42", "9.37"],
  ["TI", "46.19", "9.02"],
  ["GR", "46.85", "9.53"],
  ["LU", "47.05", "8.31"],
];
const GEN_CATEGORIES = [
  ["Gemüse", "Früchte"],
  ["Milchprodukte"],
  ["Eier", "Honig"],
  ["Fleisch"],
  ["Käse", "Wein"],
];
for (let i = 0; i < GENERATED_COUNT; i++) {
  const [canton, lat, lng] = GEN_CANTONS[i % GEN_CANTONS.length];
  // Spread each canton's farms over a plausible area instead of stacking them
  // on one point. The old form appended digits to the 4th decimal, a spread of
  // ~1km, so all 235 generated farms collapsed into 8 dots — which is why the
  // quick-search dot map rendered as a near-blank canvas and its screenshot
  // could never have caught a broken projection (issue #183).
  //
  // Deterministic, not random: a golden-angle walk gives an even, repeatable
  // scatter, so baselines and distance assertions stay stable run to run.
  const spread = (n, step, amplitude) =>
    (((n * step) % 1000) / 1000 - 0.5) * amplitude;
  const farmLat = (Number(lat) + spread(i + 1, 381, 0.6)).toFixed(4);
  const farmLng = (Number(lng) + spread(i + 1, 673, 0.9)).toFixed(4);
  FARMS.push({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    name: `Testhof ${canton} ${i + 1}`,
    address: `Feldweg ${i + 1}, 3000 Testdorf`,
    canton,
    coordinates: `${farmLat},${farmLng}`,
    categories: GEN_CATEGORIES[i % GEN_CATEGORIES.length],
    created_at: `2026-05-${String((i % 28) + 1).padStart(2, "0")}T08:00:00Z`,
    updated_at: null,
  });
}

function send(res, status, body, contentType = "application/json") {
  res.writeHead(status, {
    "content-type": contentType,
    "access-control-allow-origin": "*",
  });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

// Category synonyms this fixture uses that fold onto another display group,
// mirroring `productGroupOf` in lib/products for exactly these values. Anything
// absent is already its own group. If the fixture gains a new synonym, the
// visual suite catches the drift — that is how this table was found.
// Display group -> API slug, mirroring lib/categories' CATEGORY_ALIASES for the
// groups this fixture produces. Only what ?category= needs.
const SLUG_OF = {
  Gemüse: "vegetables",
  Früchte: "fruits",
  Milchprodukte: "dairy",
  Fleisch: "meat-poultry",
  Wein: "drinks",
  Eier: "other",
  "Honig und Süßstoffe": "honey-sweeteners",
};

const GROUP_OF = {
  Käse: "Milchprodukte",
  Honig: "Honig und Süßstoffe",
};

const server = createServer((req, res) => {
  const { pathname, searchParams } = new URL(
    req.url,
    `http://localhost:${PORT}`,
  );

  if (req.method === "GET" && pathname === "/health_check") {
    return send(res, 200, { status: "ok" });
  }
  if (req.method === "GET" && pathname === "/farms") {
    // Honour ?canton= and ?category= the way the real API does, so the e2e run
    // actually exercises server-side filtering. A mock that ignored them would
    // return everything, the client would filter locally, and every test would
    // pass while the feature was completely broken in production.
    const canton = searchParams.get("canton");
    const categories = (searchParams.get("category") ?? "")
      .split(",")
      .filter(Boolean);

    let matched = FARMS;
    if (canton) {
      matched = matched.filter((farm) => farm.canton === canton);
    }
    if (categories.length > 0) {
      // Any-of, matching the real backend. The fixture carries German names
      // where the API carries slugs, so fold through the same small table
      // /facets uses.
      const wanted = new Set(categories);
      matched = matched.filter((farm) =>
        (farm.categories ?? []).some((c) =>
          wanted.has(SLUG_OF[GROUP_OF[c] ?? c] ?? ""),
        ),
      );
    }
    return send(res, 200, matched);
  }
  // GET /facets — filter options and their counts across the whole directory.
  // The directory reads these instead of deriving its picker from the farms it
  // was handed, which is what lets it ever show a filtered subset.
  //
  // Derived from FARMS rather than hard-coded, so the counts can never drift
  // from the farms this mock serves — a facet count that disagrees with the
  // list beside it is exactly the bug worth catching here.
  //
  // Real backend emits category SLUGS (`fruits`); this emits the same German
  // strings its farms carry. `canonicalCategory` folds both to one key, so the
  // app sees identical results either way.
  if (req.method === "GET" && pathname === "/facets") {
    const cantons = new Map();
    const categories = new Map();
    for (const farm of FARMS) {
      cantons.set(farm.canton, (cantons.get(farm.canton) ?? 0) + 1);
      // Fold to the display group and dedupe PER FARM before counting, which
      // is what `getFarmGroups` does app-side. A farm carrying both
      // "Milchprodukte" and "Käse" is one dairy farm, not two — counting the
      // raw strings and letting the client fold them afterwards double-counts
      // it, and the directory's chip counts stop matching its list.
      const groups = new Set(
        (farm.categories ?? []).map((c) => GROUP_OF[c] ?? c),
      );
      for (const group of groups) {
        categories.set(group, (categories.get(group) ?? 0) + 1);
      }
    }
    return send(res, 200, {
      lang: "en",
      total: FARMS.length,
      cantons: [...cantons]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => a.code.localeCompare(b.code)),
      categories: [...categories].map(([slug, count]) => ({
        slug,
        name: slug,
        count,
      })),
    });
  }
  // GET /farms/{id} — the single-farm endpoint. The farm page and its OG image
  // read this instead of downloading the directory and running `.find()`.
  // Mirrors the real backend: the farm is flattened into the body with `lang`
  // alongside it, and an unknown id is a 404 (which the app turns into
  // `notFound()`), NOT an empty 200.
  const farmMatch = /^\/farms\/([^/]+)$/.exec(pathname);
  if (req.method === "GET" && farmMatch) {
    const id = decodeURIComponent(farmMatch[1]);
    const list = Array.isArray(FARMS) ? FARMS : FARMS.farms;
    const farm = list.find((entry) => entry.id === id);
    if (!farm) {
      return send(res, 404, { error: "not found" });
    }
    return send(res, 200, { ...farm, lang: "en" });
  }

  if (req.method === "POST" && pathname === "/farms") {
    // The create-farm flow only needs a success; the directory is re-fetched.
    return send(res, 201, { ok: true });
  }
  return send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[mock-backend] listening on http://127.0.0.1:${PORT}`);
});
