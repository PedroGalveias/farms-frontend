import { expect, test } from "@playwright/test";

test.describe("SEO endpoints", () => {
  test("robots.txt allows crawling and points at the sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toMatch(/User-Agent: \*/i);
    expect(body).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i);
  });

  test("sitemap.xml is valid XML listing the home route", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toMatch(/xml/);
    const body = await response.text();
    expect(body).toContain("<urlset");
    // The home route is always present even if the backend is unavailable.
    expect(body).toMatch(/<loc>https?:\/\/[^<]+\/<\/loc>/);
  });
});
