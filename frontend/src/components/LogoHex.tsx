export default function LogoHex() {
  return (
    <div className="relative w-[38px] h-[38px] shrink-0">
      <svg
        viewBox="0 0 38 38"
        fill="none"
        className="w-[38px] h-[38px]"
        style={{ animation: 'hex-rotate 12s linear infinite' }}
      >
        <polygon points="19,2 35,11 35,27 19,36 3,27 3,11" stroke="rgba(139,26,26,0.5)" strokeWidth="1" fill="none" />
        <polygon points="19,7 30,13.5 30,24.5 19,31 8,24.5 8,13.5" stroke="rgba(139,26,26,0.3)" strokeWidth="0.5" fill="rgba(139,26,26,0.04)" />
        <circle cx="19" cy="19" r="4" stroke="var(--crimson)" strokeWidth="0.75" fill="rgba(139,26,26,0.2)" />
        <circle cx="19" cy="19" r="1.5" fill="var(--crimson)" />
        <line x1="19" y1="7" x2="19" y2="13" stroke="rgba(139,26,26,0.4)" strokeWidth="0.5" />
        <line x1="19" y1="25" x2="19" y2="31" stroke="rgba(139,26,26,0.4)" strokeWidth="0.5" />
        <line x1="8" y1="13.5" x2="13.5" y2="16.5" stroke="rgba(139,26,26,0.4)" strokeWidth="0.5" />
        <line x1="24.5" y1="21.5" x2="30" y2="24.5" stroke="rgba(139,26,26,0.4)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
