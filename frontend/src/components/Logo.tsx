interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 28, withWordmark = false }: LogoProps) {
  return (
    <span className="logo">
      <svg
        className="logo-mark"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="masteacon-beacon-gradient"
            x1="26"
            y1="17"
            x2="39"
            y2="53"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F7CE76" />
            <stop offset="35%" stopColor="#32C6D5" />
            <stop offset="68%" stopColor="#168BBE" />
            <stop offset="100%" stopColor="#2458C5" />
          </linearGradient>

          <radialGradient id="masteacon-light">
            <stop offset="0%" stopColor="#FFFDF4" />
            <stop offset="42%" stopColor="#F7C65B" />
            <stop offset="100%" stopColor="#F7C65B" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M7 52V24L21 37L32 28L43 37L57 24V52H49V40L32 55L15 40V52H7Z"
          fill="currentColor"
        />

        <path
          d="M32 14L40 23H36.2L39 47L32 54L25 47L27.8 23H24L32 14Z"
          fill="url(#masteacon-beacon-gradient)"
        />

        <path
          d="M20 23C22.5 18.6 26.8 16 32 16C37.2 16 41.5 18.6 44 23"
          stroke="#38BDD3"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity="0.85"
        />

        <path
          d="M14.5 20C18.4 13.8 24.7 10 32 10C39.3 10 45.6 13.8 49.5 20"
          stroke="#278EC3"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.55"
        />

        <circle
          cx="32"
          cy="25"
          r="9"
          fill="url(#masteacon-light)"
          opacity="0.85"
        />

        <path
          d="M32 18.5L33.2 23.8L38.5 25L33.2 26.2L32 31.5L30.8 26.2L25.5 25L30.8 23.8L32 18.5Z"
          fill="#FFFBEF"
        />

        <path
          d="M21 25H43"
          stroke="#F5BD4B"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.95"
        />
      </svg>

      {withWordmark && <span className="logo-wordmark">Masteacon</span>}
    </span>
  );
}
