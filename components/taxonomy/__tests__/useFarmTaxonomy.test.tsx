import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFarmTaxonomy } from "@/components/taxonomy/useFarmTaxonomy";

const TAXONOMY = {
  lang: "fr",
  categories: [{ slug: "vegetables", name: "Légumes", translated: true }],
  products: [
    {
      slug: "carrots",
      name: "Carottes",
      translated: true,
      category: "vegetables",
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useFarmTaxonomy", () => {
  it("retries after a transient request failure", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(TAXONOMY), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      );

    const first = renderHook(() =>
      useFarmTaxonomy({ enabled: true, locale: "fr" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(first.result.current).toBeNull());
    first.unmount();

    const second = renderHook(() =>
      useFarmTaxonomy({ enabled: true, locale: "fr" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(second.result.current?.products[0]?.name).toBe("Carottes"),
    );
  });
});
