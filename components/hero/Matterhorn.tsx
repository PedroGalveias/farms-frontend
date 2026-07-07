/**
 * Matterhorn silhouette — the Alps as the hero pane's motif, drawn from the
 * real peak's Zermatt profile: a steep asymmetric pyramid whose summit hooks
 * and leans north (left), a near-vertical, slightly convex east face on the
 * right, the stepped Hörnli ridge descending right, and a two-tone sunlit
 * left face. Layered so the sitewide living backdrop reads through the clear
 * glass behind it. Pure vector, `currentColor` (tints with the theme);
 * decorative (aria-hidden via the parent).
 */
export default function Matterhorn({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      viewBox="0 0 400 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Distant back range — soft. */}
      <path
        d="M0 240 L54 176 L104 200 L168 150 L212 186 L268 138 L330 188 L400 150 L400 240 Z"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Mid ridge with a foreground shoulder on the left. */}
      <path
        d="M0 240 L60 198 L110 214 L150 176 L210 210 L300 168 L360 206 L400 188 L400 240 Z"
        fill="currentColor"
        opacity="0.13"
      />

      {/* The Matterhorn — full silhouette. Left (north) ridge climbs past the
          Hörnli shoulder to the hooked summit that leans left; the right
          (east) face drops near-vertically, bulges, then the Hörnli ridge
          steps down to the right. */}
      <path
        d="M56 240
           L150 150
           L176 132
           L196 96
           L206 58
           L210 34
           L201 22
           L214 30
           L221 58
           L233 92
           L246 108
           L268 150
           L300 182
           L338 212
           L372 240 Z"
        fill="currentColor"
        opacity="0.2"
      />

      {/* Sunlit left (north) face — a brighter plane, echoing the snow/light
          side in the photos. */}
      <path
        d="M201 22 L206 58 L196 96 L176 132 L150 150 L188 120 L205 74 Z"
        fill="currentColor"
        opacity="0.12"
      />

      {/* Summit + east-face edge accent (the crisp snow line). */}
      <path
        d="M201 22 L214 30 L221 58 L233 92 L246 108 L268 150"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        opacity="0.3"
      />
    </svg>
  );
}
