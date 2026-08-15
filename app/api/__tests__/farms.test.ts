import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createFarm: vi.fn(),
  getFarms: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/farms-service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/farms-service")>();
  return {
    ...original,
    createFarm: mocks.createFarm,
    getFarms: mocks.getFarms,
  };
});

import { GET, POST } from "@/app/api/farms/route";

afterEach(() => {
  vi.clearAllMocks();
});

const ORIGIN = "http://localhost:3000";
const validPayload = {
  name: "Bauernhof Meier",
  address: "Dorfstrasse 1",
  canton: "BE",
  coordinates: "46.948,7.447",
  categories: ["vegetables"],
  products: ["carrots"],
};

const farm = {
  id: "farm-1",
  name: "Hof",
  address: "Dorfstrasse 1",
  canton: "BE",
  coordinates: "46.9,7.4",
  categories: ["Gemüse"],
  products: [
    {
      slug: "carrots",
      name_en: "Carrots",
      group: "vegetables",
      status: "AVAILABLE",
      last_confirmed_at: null,
    },
  ],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};

function request(origin = ORIGIN, cookie = "farms-session=abc") {
  return new NextRequest(`${ORIGIN}/api/farms`, {
    body: JSON.stringify(validPayload),
    headers: {
      "content-type": "application/json",
      cookie,
      host: "localhost:3000",
      origin,
    },
    method: "POST",
  });
}

describe("POST /api/farms", () => {
  it("rejects the legacy payload that omits product identities", async () => {
    const legacyPayload: Record<string, unknown> = { ...validPayload };
    delete legacyPayload.products;
    const legacyRequest = new NextRequest(`${ORIGIN}/api/farms`, {
      body: JSON.stringify(legacyPayload),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: ORIGIN,
      },
      method: "POST",
    });

    const response = await POST(legacyRequest);

    expect(response.status).toBe(400);
    expect(mocks.createFarm).not.toHaveBeenCalled();
  });

  it("rejects cross-origin farm creation before contacting the backend", async () => {
    const response = await POST(request("https://evil.example"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(mocks.createFarm).not.toHaveBeenCalled();
  });

  it("rejects semantically invalid farms before contacting the backend", async () => {
    const invalid = new NextRequest(`${ORIGIN}/api/farms`, {
      body: JSON.stringify({
        ...validPayload,
        canton: "XX",
        coordinates: "not coordinates",
        name: "   ",
      }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: ORIGIN,
      },
      method: "POST",
    });

    const response = await POST(invalid);

    expect(response.status).toBe(400);
    expect(mocks.createFarm).not.toHaveBeenCalled();
  });

  it("rejects unknown taxonomy slugs", async () => {
    const invalid = new NextRequest(`${ORIGIN}/api/farms`, {
      body: JSON.stringify({ ...validPayload, products: ["mystery-item"] }),
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: ORIGIN,
      },
      method: "POST",
    });

    const response = await POST(invalid);

    expect(response.status).toBe(400);
    expect(mocks.createFarm).not.toHaveBeenCalled();
  });

  it("forwards a same-origin authenticated creation and invalidates the list", async () => {
    mocks.createFarm.mockResolvedValue(undefined);

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(mocks.createFarm).toHaveBeenCalledWith(
      expect.objectContaining({
        ...validPayload,
        address: "Dorfstrasse 1",
        name: "Bauernhof Meier",
        idempotency_key: expect.any(String),
      }),
      "farms-session=abc",
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith("farms", "max");
  });
});

describe("GET /api/farms", () => {
  it("returns a product-free directory projection by default", async () => {
    mocks.getFarms.mockResolvedValue([farm]);

    const response = await GET(new Request(`${ORIGIN}/api/farms?lang=de`));
    const body = (await response.json()) as Array<Record<string, unknown>>;

    expect(mocks.getFarms).toHaveBeenCalledWith("de");
    expect(body[0]).not.toHaveProperty("products");
    expect(body[0]).toHaveProperty("categories", ["Gemüse"]);
  });

  it("returns only command-index fields for the palette view", async () => {
    mocks.getFarms.mockResolvedValue([farm]);

    const response = await GET(
      new Request(`${ORIGIN}/api/farms?view=command&lang=fr`),
    );

    await expect(response.json()).resolves.toEqual([
      {
        id: "farm-1",
        name: "Hof",
        address: "Dorfstrasse 1",
        canton: "BE",
      },
    ]);
    expect(mocks.getFarms).toHaveBeenCalledWith("fr");
  });
});
