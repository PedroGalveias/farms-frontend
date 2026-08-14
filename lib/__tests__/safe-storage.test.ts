import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readStorageJson,
  safeStorage,
  writeStorage,
  writeStorageJson,
} from "@/lib/safe-storage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("safe storage", () => {
  it("folds corrupt JSON into null", () => {
    localStorage.setItem("broken", "{nope");
    expect(readStorageJson("broken")).toBeNull();
  });

  it("reports quota exhaustion distinctly", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(writeStorage("key", "value")).toEqual({
      ok: false,
      reason: "quota",
    });
  });

  it("reports values that cannot be serialized without writing", () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;

    expect(writeStorageJson("circular", circular)).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(writeStorageJson("undefined", undefined)).toEqual({
      ok: false,
      reason: "unavailable",
    });
    expect(localStorage.getItem("circular")).toBeNull();
    expect(localStorage.getItem("undefined")).toBeNull();
  });

  it("keeps domain validation beside the typed store", () => {
    const store = safeStorage("number", (value) =>
      typeof value === "number" ? value : null,
    );
    store.write(42);
    expect(store.read()).toBe(42);
    localStorage.setItem("number", JSON.stringify("wrong"));
    expect(store.read()).toBeNull();
  });
});
