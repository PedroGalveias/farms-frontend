import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import AuthModal from "@/components/auth/AuthModal";

function renderModal(mode: "login" | "register" = "login") {
  const onClose = vi.fn();
  const onSwitch = vi.fn();
  const onAuthenticated = vi.fn();
  render(
    <LanguageProvider>
      <AuthModal
        mode={mode}
        noticeKey={null}
        onAuthenticated={onAuthenticated}
        onClose={onClose}
        onSwitch={onSwitch}
      />
    </LanguageProvider>,
  );
  return { onClose, onSwitch, onAuthenticated };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.style.overflow = "";
});

describe("AuthModal forgot-password flow", () => {
  it("login view offers a forgot-password link", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /forgot password/i }),
    ).toBeInTheDocument();
  });

  it("switches to the reset view and validates the email", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();
    // Password field is hidden in the reset view (jsdom doesn't apply
    // Tailwind CSS, so assert the class rather than computed visibility).
    expect(screen.getByLabelText(/^password$/i).closest("div")).toHaveClass(
      "hidden",
    );

    // Invalid email → field error, no WIP notice.
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(screen.queryByText(/still in the works/i)).not.toBeInTheDocument();
  });

  it("shows the work-in-progress notice on a valid submit and returns to login", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "pedro@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    // Frontend-only for now: a WIP notice, and NO network request.
    expect(screen.getByText(/still in the works/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /back to log in/i }));
    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it("the back link inside the reset form returns to login without switching mode", () => {
    const { onSwitch } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));
    fireEvent.click(screen.getByRole("button", { name: /back to log in/i }));

    expect(onSwitch).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it("keeps focus inside the confirmation after successful registration", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 202 }),
    );
    renderModal("register");

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "farmfriend" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "friend@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "a-long-enough-password" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "a-long-enough-password" },
    });
    fireEvent.submit(document.querySelector("form")!);

    const dialog = screen.getByRole("dialog");
    const confirmation = await screen.findByRole("button", { name: /got it/i });
    await waitFor(() => expect(confirmation).toHaveFocus());
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).not.toBe(opener);
  });
});
