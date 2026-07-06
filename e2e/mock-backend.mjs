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
  FARMS.push({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    name: `Testhof ${canton} ${i + 1}`,
    address: `Feldweg ${i + 1}, 3000 Testdorf`,
    canton,
    coordinates: `${lat}${String((i % 90) + 10)},${lng}${String((i % 90) + 10)}`,
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

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && pathname === "/health_check") {
    return send(res, 200, { status: "ok" });
  }
  if (req.method === "GET" && pathname === "/farms") {
    return send(res, 200, FARMS);
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
