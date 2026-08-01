import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  createFarm: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/farms-service", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/farms-service")>();
  return { ...original, createFarm: mocks.createFarm };
});

import { POST } from "@/app/api/farms/route";

afterEach(() => {
  vi.clearAllMocks();
});

const ORIGIN = "http://localhost:3000";
const validPayload = {
  name: "Bauernhof Meier",
  address: "Dorfstrasse 1",
  canton: "BE",
  coordinates: "46.948,7.447",
  categories: ["Gemüse"],
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
  it("rejects cross-origin farm creation before contacting the backend", async () => {
    const response = await POST(request("https://evil.example"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(mocks.createFarm).not.toHaveBeenCalled();
  });

  it("forwards a same-origin authenticated creation and invalidates the list", async () => {
    mocks.createFarm.mockResolvedValue(undefined);

    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(mocks.createFarm).toHaveBeenCalledWith(
      expect.objectContaining({
        ...validPayload,
        idempotency_key: expect.any(String),
      }),
      "farms-session=abc",
    );
    expect(mocks.revalidateTag).toHaveBeenCalledWith("farms", "max");
  });
});
