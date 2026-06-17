interface LogoProps {
  className?: string;
  /** Unique suffix for gradient ids so multiple logos can coexist in the DOM. */
  idPrefix?: string;
}

/**
 * The farms brand mark — the same artwork as the site favicon
 * (`app/favicon-source.svg`), inlined so it stays crisp at any size and needs
 * no extra request. Used as the top-left logo in the rail and mobile header.
 */
export default function Logo({ className = "", idPrefix = "logo" }: LogoProps) {
  const bg = `${idPrefix}-bg`;
  const hill = `${idPrefix}-hill`;
  const barn = `${idPrefix}-barn`;

  return (
    <svg
      aria-label="farms"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={bg}
          x1="8"
          x2="56"
          y1="8"
          y2="56"
        >
          <stop stopColor="#329164" />
          <stop offset="1" stopColor="#194B39" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={hill}
          x1="12"
          x2="50"
          y1="38"
          y2="58"
        >
          <stop stopColor="#C1E57D" />
          <stop offset="1" stopColor="#72B858" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={barn}
          x1="16"
          x2="34"
          y1="24"
          y2="48"
        >
          <stop stopColor="#F05E52" />
          <stop offset="1" stopColor="#CB312C" />
        </linearGradient>
      </defs>

      <rect fill={`url(#${bg})`} height="56" rx="18" width="56" x="4" y="4" />
      <rect
        height="54.5"
        rx="17.25"
        stroke="#FFFFFF"
        strokeOpacity="0.16"
        strokeWidth="1.5"
        width="54.5"
        x="4.75"
        y="4.75"
      />

      <rect fill="#E23D36" height="14" rx="4.5" width="14" x="11" y="11" />
      <rect
        fill="#FFFFFF"
        height="8.5"
        rx="0.7"
        width="2.5"
        x="16.75"
        y="13.75"
      />
      <rect
        fill="#FFFFFF"
        height="2.5"
        rx="0.7"
        width="8.5"
        x="13.75"
        y="16.75"
      />

      <path
        d="M8 45C15 39 21 36 28 37C34 38 40 41 46 41C50 41 53.5 39.8 56 38V56H8V45Z"
        fill={`url(#${hill})`}
      />
      <path
        d="M14 52C20.8 47.6 27.2 46 34.5 46C41.6 46 47.1 47.7 52 50.8"
        stroke="#51974A"
        strokeLinecap="round"
        strokeWidth="2"
      />

      <path d="M14.5 29L24.5 20L34.5 29L31.5 32H17.5L14.5 29Z" fill="#A92322" />
      <path
        d="M17 31.5H32V44.2C32 46.3 30.3 48 28.2 48H20.8C18.7 48 17 46.3 17 44.2V31.5Z"
        fill={`url(#${barn})`}
      />
      <rect
        fill="#FFF6E8"
        height="12.8"
        rx="1.8"
        width="5.6"
        x="21.7"
        y="35.2"
      />
      <path
        d="M21.9 39L27.1 44.1M27.1 39L21.9 44.1"
        stroke="#CB312C"
        strokeLinecap="round"
        strokeWidth="1.4"
      />

      <ellipse cx="44.5" cy="38.2" fill="#FFF9F1" rx="10.5" ry="8.8" />
      <ellipse cx="40.8" cy="36.4" fill="#183D2F" rx="2.4" ry="3.1" />
      <ellipse cx="47.7" cy="40.5" fill="#183D2F" rx="2.1" ry="2.7" />
      <path
        d="M36.6 31.6L34.9 29.1M50.7 31.7L52.2 29.2"
        stroke="#183D2F"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M36.2 33.3L34.2 35M51.7 33.5L53.9 35.2"
        stroke="#183D2F"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <rect
        fill="#F6B7AB"
        height="5.1"
        rx="2.2"
        width="7.4"
        x="42.1"
        y="39.4"
      />
      <circle cx="44.4" cy="41.8" fill="#915A52" r="0.45" />
      <circle cx="47.2" cy="41.8" fill="#915A52" r="0.45" />
      <path
        d="M39 46.2V50M44.3 46.5V50.8M49 45.8V49.6"
        stroke="#183D2F"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
