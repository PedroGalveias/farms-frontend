/**
 * Matterhorn silhouette — the Alps as the hero pane's motif, drawn from the
 * real peak's Zermatt profile as detailed low-poly line-art: the hooked summit
 * leaning north, the near-vertical east face, the stepped Hörnli ridge, the
 * Zmutt ridge, and the couloirs/snow bands that give the face its structure.
 * Fills model the major sunlit/shadowed planes; the many strokes are the
 * aretes, gullies and rock bands. Layered so the sitewide living backdrop
 * reads through the clear glass behind it.
 *
 * It is a STATIC vector (rendered once, never animated), so the extra detail
 * carries no runtime cost — unrelated to the WebGL ambient layer's budget.
 * `currentColor` tints it with the theme; decorative (aria-hidden via parent).
 */
export default function Matterhorn({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      preserveAspectRatio="xMidYMax meet"
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Distant back ranges — soft, for depth. */}
      <path
        d="M0 300 L48 232 L96 262 L150 210 L206 250 L262 200 L322 248 L400 205 L400 300 Z"
        fill="currentColor"
        opacity="0.06"
      />
      <path
        d="M0 300 L58 258 L118 280 L168 236 L232 274 L300 232 L360 268 L400 246 L400 300 Z"
        fill="currentColor"
        opacity="0.1"
      />

      {/* Main silhouette (rock body). The apex (185 19) sits left of the
          summit shoulder (201 31), so the top leans and hooks north — the
          peak's signature profile. */}
      <path
        d="M185 19 L180 62 L166 108 L150 158 L126 212 L96 256 L60 300
           L384 300 L328 240 L296 198 L268 166 L252 140 L238 112 L226 90
           L214 58 L201 31 Z"
        fill="currentColor"
        opacity="0.18"
      />

      {/* Sunlit left/front planes — a touch lighter, for modelling. */}
      <path
        d="M185 19 L180 62 L186 110 L196 60 Z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M180 62 L166 108 L176 160 L186 110 Z"
        fill="currentColor"
        opacity="0.09"
      />
      <path
        d="M166 108 L150 158 L188 205 L176 160 Z"
        fill="currentColor"
        opacity="0.08"
      />
      {/* Shadowed summit face on the east (right) side of the hooked tip. */}
      <path
        d="M185 19 L201 31 L214 58 L226 90 L204 108 L196 60 Z"
        fill="currentColor"
        opacity="0.07"
      />

      {/* Aretes — the crisp summit ridges. */}
      <path
        d="M185 19 L180 62 L166 108 L150 158 L126 212 L96 256"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        opacity="0.34"
      />
      <path
        d="M185 19 L201 31 L214 58 L226 90 L238 112 L252 140 L268 166 L296 198 L328 240"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        opacity="0.34"
      />

      {/* Couloirs / gullies down the face — the vertical detail. */}
      <path
        d="M196 60 L198 108 L204 158 L214 200"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.22"
      />
      <path
        d="M180 62 L186 110 L176 160 L188 205"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.2"
      />
      <path
        d="M226 90 L218 116 L226 150 L244 178"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.2"
      />

      {/* Snow-line bands crossing the face (short, jagged horizontals). */}
      <path
        d="M186 110 L198 104 L204 108"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.24"
      />
      <path
        d="M176 160 L198 150 L226 150"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.2"
      />

      {/* Foreground snow slopes + a couple of ridge lines. */}
      <path
        d="M60 300 L118 262 L176 288 L214 262 L268 292 L328 258 L384 300 Z"
        fill="currentColor"
        opacity="0.07"
      />
      <path
        d="M96 256 L126 212"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
        opacity="0.18"
      />
      <path
        d="M118 262 L176 288 M214 262 L268 292"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1"
        opacity="0.14"
      />
    </svg>
  );
}
