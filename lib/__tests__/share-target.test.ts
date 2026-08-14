import { describe, expect, it } from "vitest";
import { productsFromShareTarget } from "@/lib/share-target";

describe("productsFromShareTarget", () => {
  it("matches localized product and category labels", () => {
    const params = new URLSearchParams({
      title: "Apples et légumes",
      text: "Ich suche auch Käse.",
    });

    expect(productsFromShareTarget(params)).toEqual(
      expect.arrayContaining(["Äpfel", "Gemüse", "Käse"]),
    );
  });

  it("imports canonical keys from a shared quick-search URL", () => {
    const params = new URLSearchParams({
      url: "https://farms.example/quick-search?products=%C3%84pfel%2CK%C3%A4se",
    });

    expect(productsFromShareTarget(params)).toEqual(["Äpfel", "Käse"]);
  });

  it("recognizes a shared product page", () => {
    const params = new URLSearchParams({
      url: "https://farms.example/de/product/apples",
    });

    expect(productsFromShareTarget(params)).toEqual(["Äpfel"]);
  });

  it("ignores ordinary query strings and unknown content", () => {
    expect(
      productsFromShareTarget(new URLSearchParams("products=Käse")),
    ).toEqual([]);
    expect(
      productsFromShareTarget(new URLSearchParams({ text: "A nice weekend" })),
    ).toEqual([]);
  });
});
