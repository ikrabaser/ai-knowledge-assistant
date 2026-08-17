interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 32, withWordmark = false }: LogoProps) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <radialGradient id="logo-glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="url(#logo-gradient)" />
        <circle cx="24" cy="24" r="22" fill="url(#logo-glow)" />
        <g stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.95">
          <path d="M24 12c-4.5 0-7.5 3.3-7.5 7.2 0 2.3 1.1 3.9 1.1 5.6 0 2-1.4 2.6-1.4 4.6a4 4 0 0 0 4 4h.6" fill="none" />
          <path d="M24 12c4.5 0 7.5 3.3 7.5 7.2 0 2.3-1.1 3.9-1.1 5.6 0 2 1.4 2.6 1.4 4.6a4 4 0 0 1-4 4h-.6" fill="none" />
          <path d="M24 12v21.4" fill="none" />
        </g>
        <circle cx="17.5" cy="18.5" r="1.4" fill="white" />
        <circle cx="30.5" cy="18.5" r="1.4" fill="white" />
        <circle cx="16.2" cy="25" r="1.2" fill="white" />
        <circle cx="31.8" cy="25" r="1.2" fill="white" />
        <circle cx="24" cy="9.5" r="1.3" fill="white" />
      </svg>
      {withWordmark && <span className="logo-wordmark">AI Knowledge Assistant</span>}
    </span>
  );
}
