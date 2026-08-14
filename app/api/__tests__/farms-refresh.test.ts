import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag: mocks.revalidateTag }));

import { POST } from "@/app/api/farms/refresh/route";

afterEach(() => {
  vi.clearAllMocks();
});

function request(origin = "https://farms.test") {
  return new Request("https://farms.test/api/farms/refresh", {
    headers: { host: "farms.test", origin },
    method: "POST",
  });
}

describe("POST /api/farms/refresh", () => {
  it("invalidates every directory data cache", async () => {
    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(mocks.revalidateTag.mock.calls).toEqual([
      ["farms", "max"],
      ["farm-facets", "max"],
      ["farm-taxonomy", "max"],
    ]);
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(request("https://evil.test"));

    expect(response.status).toBe(403);
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });
});
