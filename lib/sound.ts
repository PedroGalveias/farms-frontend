// Tiny audio feedback for confirmation actions (save, copy). A single short,
// soft "tick" synthesised with the Web Audio API — no asset to load, works on
// every engine, and stays silent until a real user gesture (all call sites are
// click handlers, so the AudioContext is allowed to start).
//
// Deliberately quiet and brief so it reads as a subtle confirmation, never a
// notification. Reuses one AudioContext across the session.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    // Browsers start the context suspended until a gesture resumes it.
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Play a soft confirmation tick. Best-effort and non-blocking — if Web Audio
 * is unavailable or blocked, it simply does nothing.
 */
export function playTick(): void {
  const audio = getContext();
  if (!audio) return;
  try {
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    // A gentle two-tone-ish blip: a quick high sine that decays fast.
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.05);
    // Fast attack, short exponential release; peak is intentionally low.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Never let feedback break the action.
  }
}
