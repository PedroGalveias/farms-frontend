/**
 * Matterhorn — a detailed, faithful reproduction of the two-tone alpenglow
 * illustration: a warm sunlit west face and a cool shadowed east face, both
 * broken into many faceted planes, streaked with snow couloirs and crossed by
 * rock bands, the snow-capped north ridge dividing them, a hooked summit, a
 * distant ridge for depth, and layered snow slopes at the base. Its own fixed
 * palette (not `currentColor`) so it reads as the same artwork in light and
 * dark — a framed alpine "postcard" inside the hero pane's glass.
 *
 * Static vector: rendered once, no runtime cost (unrelated to the WebGL
 * ambient layer). Decorative (aria-hidden via the parent).
 */
export default function Matterhorn({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 220 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6eef5" />
          <stop offset="1" stopColor="#f7fafb" />
        </linearGradient>
        <linearGradient id="mh-warm" x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#eca05a" />
          <stop offset="0.5" stopColor="#d1823f" />
          <stop offset="1" stopColor="#b17c53" />
        </linearGradient>
        <linearGradient id="mh-warm-bright" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6bd78" />
          <stop offset="1" stopColor="#e39c52" />
        </linearGradient>
        <linearGradient id="mh-cool" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8299ae" />
          <stop offset="1" stopColor="#4c6076" />
        </linearGradient>
        <linearGradient id="mh-cool-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5c7189" />
          <stop offset="1" stopColor="#3d4f64" />
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="220" height="200" fill="url(#mh-sky)" />

      {/* Distant ridge behind, for depth. */}
      <path
        d="M0 170 L46 132 L78 156 L120 120 L156 150 L200 118 L220 140 L220 200 L0 200 Z"
        fill="#d6e0ea"
        opacity="0.7"
      />
      <path
        d="M118 120 L156 150 L200 118 L220 132 L220 168 L150 168 Z"
        fill="#c7d4e0"
        opacity="0.6"
      />

      {/* ---- Cool (shadowed, east) face ---- */}
      <path
        d="M98 30 L104 34 L116 66 L132 100 L150 130 L172 160 L120 185
           L112 150 L104 110 L100 70 Z"
        fill="url(#mh-cool)"
      />
      {/* Faceting on the cool face (mid + dark planes). */}
      <path d="M98 30 L104 34 L116 66 L106 96 L100 70 Z" fill="#96a9bd" />
      <path d="M116 66 L132 100 L120 118 L106 96 Z" fill="#71889f" />
      <path d="M132 100 L150 130 L134 140 L120 118 Z" fill="#5f7791" />
      <path
        d="M150 130 L172 160 L138 172 L120 150 L134 140 Z"
        fill="url(#mh-cool-dark)"
      />
      <path d="M120 118 L120 150 L112 150 L104 110 L106 96 Z" fill="#54697f" />
      {/* Snow couloirs streaming down the east face. */}
      <path
        d="M107 72 L111 74 L118 138 L112 138 Z"
        fill="#eef3f6"
        opacity="0.92"
      />
      <path
        d="M120 90 L124 92 L134 146 L128 146 Z"
        fill="#e3ebf0"
        opacity="0.86"
      />
      <path
        d="M134 110 L138 112 L149 152 L143 152 Z"
        fill="#d7e1e9"
        opacity="0.8"
      />
      <path
        d="M148 130 L151 132 L162 160 L156 160 Z"
        fill="#cdd9e2"
        opacity="0.72"
      />
      {/* Rock bands crossing the cool face. */}
      <path
        d="M110 96 L122 100 M118 124 L138 130 M128 150 L152 156"
        stroke="#3e5066"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* ---- Warm (sunlit, west) face ---- */}
      <path
        d="M98 30 L94 44 L86 74 L70 118 L48 150 L18 200 L120 185
           L112 150 L104 110 L100 70 Z"
        fill="url(#mh-warm)"
      />
      {/* Faceting on the warm face — bright alpenglow near the crown down to
          darker recesses at the base. */}
      <path d="M98 30 L94 44 L90 62 L100 70 Z" fill="url(#mh-warm-bright)" />
      <path d="M94 44 L86 74 L84 96 L90 62 Z" fill="#e0954f" />
      <path d="M90 62 L84 96 L98 96 L100 70 Z" fill="#d98a44" />
      <path d="M84 96 L74 128 L92 130 L98 96 Z" fill="#c9823f" />
      <path d="M98 96 L92 130 L104 132 L104 110 L100 70 Z" fill="#bd7c46" />
      <path d="M74 128 L58 162 L82 165 L92 130 Z" fill="#b0784f" />
      <path d="M92 130 L82 165 L105 168 L112 150 L104 132 Z" fill="#a5713f" />
      <path d="M58 162 L48 150 L18 200 L54 178 L82 165 Z" fill="#9c6a45" />
      <path d="M82 165 L54 178 L100 176 L105 168 Z" fill="#8f6038" />
      <path d="M100 176 L54 178 L120 185 L112 150 L105 168 Z" fill="#845a37" />
      {/* Lower-left Hörnli shoulder. */}
      <path d="M18 200 L48 150 L64 168 L54 200 Z" fill="#b78a5f" />
      <path d="M48 150 L64 168 L54 200 L40 200 Z" fill="#9c6f49" />
      {/* Rock bands + a couple of snow patches on the warm face. */}
      <path
        d="M86 76 L98 74 M80 104 L98 100 M72 132 L102 130 M60 160 L104 160"
        stroke="#7c5433"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.38"
      />
      <path d="M92 62 L99 64 L98 78 L90 76 Z" fill="#f0dcc2" opacity="0.5" />
      <path
        d="M84 118 L96 116 L94 128 L82 130 Z"
        fill="#e7cfb0"
        opacity="0.4"
      />

      {/* ---- North ridge (snow-capped) dividing the two faces ---- */}
      <path
        d="M98 30 L100 70 L104 110 L112 150 L120 185"
        fill="none"
        stroke="#f3efe9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Summit crown — snow cap + the hooked tip. */}
      <path
        d="M98 30 L94 44 L100 70 L104 55 L104 34 Z"
        fill="#f1ede7"
        opacity="0.8"
      />
      <path d="M98 30 L104 34 L102 46 L98 44 Z" fill="#fbf7f1" opacity="0.9" />
      <path
        d="M98 30 L104 34"
        stroke="#f6f2ec"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* ---- Layered snow slopes at the base ---- */}
      <path
        d="M0 200 L0 176 L38 166 L86 184 L120 168 L164 186 L206 166 L220 174 L220 200 Z"
        fill="#eef3f6"
      />
      <path
        d="M0 200 L0 186 L54 178 L110 192 L168 178 L220 188 L220 200 Z"
        fill="#e2eaef"
      />
      <path
        d="M0 200 L0 194 L70 190 L140 198 L220 192 L220 200 Z"
        fill="#d6e0e8"
      />
      {/* Soft blue shadow pooling under the peak. */}
      <path
        d="M60 186 L120 182 L176 188 L150 196 L92 196 Z"
        fill="#b9c9d6"
        opacity="0.5"
      />
    </svg>
  );
}
