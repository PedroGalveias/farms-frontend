// Progressive haptic feedback. Android Chrome supports the Vibration API; iOS
// Safari does not expose it, so this is a graceful no-op there (and anywhere
// the API is missing or the user has it disabled).

/** A short, light tap — for confirmations like save, copy, or a tab switch. */
export function haptic(durationMs = 10): void {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Some browsers throw if vibration is blocked by a permissions policy.
    }
  }
}
