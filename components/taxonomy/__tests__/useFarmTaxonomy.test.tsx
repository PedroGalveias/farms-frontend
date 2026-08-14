import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFarmTaxonomy } from "@/components/taxonomy/useFarmTaxonomy";
import type { Locale } from "@/lib/i18n-core";
import type { FarmTaxonomy } from "@/types/taxonomy";

const TAXONOMY: FarmTaxonomy = {
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
  it("hides taxonomy from the previous locale during a locale change", () => {
    const { result, rerender } = renderHook(
      ({ locale }: { locale: Locale }) =>
        useFarmTaxonomy({ enabled: false, initial: TAXONOMY, locale }),
      { initialProps: { locale: "fr" as Locale } },
    );

    expect(result.current?.lang).toBe("fr");
    rerender({ locale: "de" });
    expect(result.current).toBeNull();
  });

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
