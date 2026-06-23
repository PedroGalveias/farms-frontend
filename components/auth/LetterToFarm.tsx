/**
 * Decorative illustration for the "check your email" / verification flow: an
 * envelope drifting over rolling farmland along a dashed flight path. Purely
 * presentational (aria-hidden); uses the app's palette tokens so it tracks the
 * theme, and the float respects prefers-reduced-motion.
 */
export default function LetterToFarm({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* sky wash */}
      <rect width="400" height="220" rx="24" fill="var(--color-tone)" />
      <circle cx="320" cy="54" r="26" fill="var(--color-pine)" opacity="0.18" />

      {/* rolling hills */}
      <path
        d="M0 168 C70 138 130 188 210 162 C280 140 340 176 400 156 L400 220 L0 220 Z"
        fill="var(--color-pine)"
        opacity="0.85"
      />
      <path
        d="M0 190 C90 168 150 206 240 184 C310 168 360 198 400 186 L400 220 L0 220 Z"
        fill="var(--color-pine)"
      />

      {/* little barn on a hill */}
      <g transform="translate(60 150)">
        <rect
          x="0"
          y="10"
          width="34"
          height="26"
          rx="2"
          fill="var(--color-cloud)"
        />
        <path d="M-3 12 L17 -2 L37 12 Z" fill="var(--color-ink)" />
        <rect x="13" y="22" width="8" height="14" fill="var(--color-pine)" />
      </g>

      {/* dashed flight path */}
      <path
        d="M40 120 C140 30 260 30 350 78"
        stroke="var(--color-ink)"
        strokeOpacity="0.35"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />

      {/* envelope near the end of the path. Outer group positions it; the inner
          group carries the float animation (a CSS transform would otherwise
          override this translate). */}
      <g transform="translate(300 52)">
        <g className="letter-float">
          <rect
            x="-30"
            y="-22"
            width="60"
            height="44"
            rx="6"
            fill="var(--color-cloud)"
            stroke="var(--color-ink)"
            strokeOpacity="0.15"
            strokeWidth="2"
          />
          <path
            d="M-30 -16 L0 6 L30 -16"
            fill="none"
            stroke="var(--color-pine)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* tiny motion ticks behind the envelope */}
          <path
            d="M-44 -8 H-36 M-48 2 H-38 M-44 12 H-36"
            stroke="var(--color-ink)"
            strokeOpacity="0.25"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
