import { afterEach, describe, expect, it, vi } from "vitest";
import { setSoundEnabled, soundEnabled } from "@/lib/sound";

// Minimal fake Web Audio graph so we can assert playTick wires and starts an
// oscillator, and that it's resilient when the API is missing.
function installFakeAudio() {
  const osc = {
    type: "",
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(() => gain),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
  };
  const resume = vi.fn();
  class FakeAudioContext {
    currentTime = 0;
    state = "suspended";
    destination = {};
    resume = resume;
    createOscillator = vi.fn(() => osc);
    createGain = vi.fn(() => gain);
  }
  (window as unknown as { AudioContext: unknown }).AudioContext =
    FakeAudioContext as unknown;
  return { osc, gain, resume };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as { AudioContext?: unknown }).AudioContext;
  delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;
  vi.resetModules();
});

describe("playTick", () => {
  it("creates and starts a short oscillator, resuming a suspended context", async () => {
    const { osc, resume } = installFakeAudio();
    // Re-import to reset the module-level cached context.
    vi.resetModules();
    const { playTick: fresh } = await import("@/lib/sound");
    fresh();
    expect(osc.start).toHaveBeenCalledTimes(1);
    expect(osc.stop).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalled();
    expect(osc.type).toBe("sine");
  });

  it("is a no-op (never throws) when Web Audio is unavailable", async () => {
    delete (window as { AudioContext?: unknown }).AudioContext;
    delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;
    vi.resetModules();
    const { playTick: fresh } = await import("@/lib/sound");
    expect(() => fresh()).not.toThrow();
  });

  it("swallows errors thrown while building the audio graph", async () => {
    class ThrowingContext {
      state = "running";
      createOscillator() {
        throw new Error("blocked");
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext =
      ThrowingContext as unknown;
    vi.resetModules();
    const { playTick: fresh } = await import("@/lib/sound");
    expect(() => fresh()).not.toThrow();
  });
});

describe("sound preference gate", () => {
  it("is enabled by default and reflects the stored mute flag", () => {
    localStorage.clear();
    expect(soundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(localStorage.getItem("farms.sound")).toBe("off");
    expect(soundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(localStorage.getItem("farms.sound")).toBeNull();
    expect(soundEnabled()).toBe(true);
  });

  it("playTick is a no-op while muted", async () => {
    setSoundEnabled(false);
    vi.resetModules();
    const { playTick: fresh, setSoundEnabled: mute } =
      await import("@/lib/sound");
    mute(false);
    expect(() => fresh()).not.toThrow();
  });
});
