interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 28, withWordmark = false }: LogoProps) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="55%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logo-gradient)" />
        <path
          d="M16 8.5 17.35 13.9 22.5 16 17.35 18.1 16 23.5 14.65 18.1 9.5 16 14.65 13.9Z"
          fill="white"
        />
        <circle cx="23.5" cy="9.5" r="1.6" fill="white" fillOpacity="0.9" />
      </svg>
      {withWordmark && <span className="logo-wordmark">AI Knowledge Assistant</span>}
    </span>
  );
}
