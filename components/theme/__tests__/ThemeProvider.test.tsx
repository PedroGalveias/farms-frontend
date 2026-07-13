import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import ThemeProvider, { useTheme } from "@/components/theme/ThemeProvider";

// Control prefers-color-scheme + the shared media stub.
const listeners = new Set<() => void>();
let systemDark = false;
const realMatchMedia = window.matchMedia;
function installMatchMedia() {
  window.matchMedia = vi.fn((query: string) => ({
    matches: /dark/.test(query) ? systemDark : false,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
    addListener: (cb: () => void) => listeners.add(cb),
    removeListener: (cb: () => void) => listeners.delete(cb),
    onchange: null,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}
function setSystemDark(next: boolean) {
  systemDark = next;
  listeners.forEach((cb) => cb());
}

// Force the "sun" clock without real geography: mock isDaylight.
vi.mock("@/lib/suncycle", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/suncycle")>();
  return {
    ...actual,
    isDaylight: () => daylight,
    nextSunFlip: () => new Date(Date.now() + 3_600_000),
  };
});
let daylight = true;

function Probe() {
  const { theme, mode, setMode } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="mode">{mode}</span>
      <button onClick={() => setMode("system")}>system</button>
      <button onClick={() => setMode("sun")}>sun</button>
      <button onClick={() => setMode("dark")}>dark</button>
      <button onClick={() => setMode("light")}>light</button>
    </div>
  );
}

async function renderTheme() {
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
  // Let the mount effect resolve the stored mode.
  await act(async () => {});
}

beforeEach(() => {
  installMatchMedia();
  listeners.clear();
  systemDark = false;
  daylight = true;
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.clearAllMocks();
});

describe("ThemeProvider modes", () => {
  it("manual dark/light apply the class and persist the mode", async () => {
    await renderTheme();
    await act(async () => {
      screen.getByRole("button", { name: "dark" }).click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("farms.themeMode")).toBe("dark");
    await act(async () => {
      screen.getByRole("button", { name: "light" }).click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("system mode follows prefers-color-scheme live", async () => {
    systemDark = true;
    await renderTheme();
    await act(async () => {
      screen.getByRole("button", { name: "system" }).click();
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    // OS flips to light → provider re-resolves.
    await act(async () => {
      setSystemDark(false);
    });
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("sun mode resolves dark after sunset", async () => {
    daylight = false;
    await renderTheme();
    await act(async () => {
      screen.getByRole("button", { name: "sun" }).click();
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    expect(localStorage.getItem("farms.themeMode")).toBe("sun");
  });

  it("sun mode resolves light during the day", async () => {
    daylight = true;
    await renderTheme();
    await act(async () => {
      screen.getByRole("button", { name: "sun" }).click();
    });
    expect(screen.getByTestId("theme")).toHaveTextContent("light");
  });

  it("adopts a stored mode on mount", async () => {
    localStorage.setItem("farms.themeMode", "dark");
    await renderTheme();
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("syncs the theme-color meta with the resolved theme", async () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    await renderTheme();
    await act(async () => {
      screen.getByRole("button", { name: "dark" }).click();
    });
    expect(meta.getAttribute("content")).toBe("#0e0f12");
    await act(async () => {
      screen.getByRole("button", { name: "light" }).click();
    });
    expect(meta.getAttribute("content")).toBe("#f4f4ef");
    meta.remove();
  });
});
