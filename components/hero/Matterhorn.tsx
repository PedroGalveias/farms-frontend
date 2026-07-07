/**
 * Matterhorn silhouette — the Alps as the hero pane's motif (replacing the app
 * logo watermark). Drawn as layered ridge lines so the sitewide living
 * backdrop reads through the clear glass behind it: a faint back range and the
 * Matterhorn's distinctive hooked summit in front. Pure vector, `currentColor`
 * so it tints with the theme; decorative (aria-hidden via the parent).
 */
export default function Matterhorn({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      viewBox="0 0 400 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back range — soft, distant ridge. */}
      <path
        d="M0 220 L58 150 L96 176 L150 128 L196 168 L250 120 L300 172 L352 138 L400 190 L400 220 Z"
        fill="currentColor"
        opacity="0.10"
      />
      {/* Mid ridge. */}
      <path
        d="M0 220 L70 176 L128 196 L188 150 L250 192 L322 158 L400 200 L400 220 Z"
        fill="currentColor"
        opacity="0.14"
      />
      {/* The Matterhorn — a steep asymmetric pyramid: a long gentle north
          face, a summit that leans and hooks, then a much steeper east face,
          the peak's signature profile from Zermatt. */}
      <path
        d="M104 220 L210 64 L224 44 L236 28 L229 20 L245 32 L258 74 L298 156 L344 220 Z"
        fill="currentColor"
        opacity="0.22"
      />
      {/* Snow-line accent tracing the steep east face. */}
      <path
        d="M236 28 L245 32 L258 74 L298 156"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        opacity="0.3"
      />
    </svg>
  );
}
