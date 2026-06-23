import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import CopyButton from "@/components/CopyButton";

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

function renderButton(props: Partial<{ value: string; label: string }> = {}) {
  render(
    <LanguageProvider>
      <CopyButton
        value={props.value ?? "Dorfstrasse 1, Bern"}
        label={props.label}
      />
    </LanguageProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CopyButton", () => {
  it("defaults to the 'Copy address' label", () => {
    mockClipboard();
    renderButton();
    expect(
      screen.getByRole("button", { name: /copy address/i }),
    ).toBeInTheDocument();
  });

  it("copies the value and confirms on click", async () => {
    // setup() installs its own clipboard stub, so mock after it.
    const user = userEvent.setup();
    const writeText = mockClipboard();
    renderButton({ value: "46.9480,7.4474" });

    await user.click(screen.getByRole("button"));

    expect(writeText).toHaveBeenCalledWith("46.9480,7.4474");
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
  });

  it("uses a custom label when provided", () => {
    mockClipboard();
    renderButton({ label: "Copy coordinates" });
    expect(
      screen.getByRole("button", { name: "Copy coordinates" }),
    ).toBeInTheDocument();
  });

  it("stays quiet when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("insecure context")),
      },
      configurable: true,
    });
    renderButton();

    await user.click(screen.getByRole("button"));

    // No throw, and no "copied" confirmation.
    expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
  });
});
