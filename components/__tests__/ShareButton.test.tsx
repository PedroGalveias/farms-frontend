import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import ShareButton from "@/components/ShareButton";

function renderButton(url = "/farm/abc") {
  render(
    <LanguageProvider>
      <ShareButton url={url} title="Hof Sonnenmatt" text="Check this farm" />
    </LanguageProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (navigator as { share?: unknown }).share;
});

describe("ShareButton", () => {
  it("uses the native share sheet with an absolute URL when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });
    const user = userEvent.setup();
    renderButton("/farm/abc");

    await user.click(screen.getByRole("button"));

    expect(share).toHaveBeenCalledWith({
      title: "Hof Sonnenmatt",
      text: "Check this farm",
      url: `${window.location.origin}/farm/abc`,
    });
  });

  it("leaves an already-absolute URL untouched", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });
    const user = userEvent.setup();
    renderButton("https://farms.example/farm/abc");

    await user.click(screen.getByRole("button"));

    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://farms.example/farm/abc" }),
    );
  });

  it("copies to the clipboard and confirms when Web Share is unavailable", async () => {
    // setup() installs its own clipboard stub, so mock after it.
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderButton("/farm/abc");

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/farm/abc`,
    );
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("treats a dismissed share sheet as a no-op (no copy fallback)", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("dismissed", "AbortError"));
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const user = userEvent.setup();
    renderButton("/farm/abc");

    await user.click(screen.getByRole("button"));

    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
  });
});
