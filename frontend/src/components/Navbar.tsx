import LogoHex from './LogoHex';

interface NavbarProps {
  myShips: number;
  enemyShips: number;
  attackCount: number;
  hitCount: number;
  isMyTurn: boolean;
  phase: string;
  onLogoClick: () => void;
  musicOn: boolean;
  sfxOn: boolean;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
}

export default function Navbar({ myShips, enemyShips, attackCount, hitCount, isMyTurn, phase, onLogoClick, musicOn, sfxOn, onToggleMusic, onToggleSfx }: NavbarProps) {
  return (
    <nav className="nav-wrap h-14 sm:h-16 flex items-center px-3 sm:px-6 lg:px-10 sticky top-0 z-50 relative"
      style={{
        borderBottom: '1px solid rgba(139,26,26,0.3)',
        background: 'linear-gradient(180deg, rgba(12,10,18,0.98) 0%, rgba(12,10,18,0.85) 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top crimson line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, var(--crimson) 30%, var(--crimson) 70%, transparent 100%)' }}
      />

      {/* Logo — click to go back to landing */}
      <div className="flex items-center gap-2 sm:gap-4 cursor-pointer shrink-0" onClick={onLogoClick}>
        <div className="hidden sm:block"><LogoHex /></div>
        <div>
          <div className="text-sm sm:text-xl tracking-[0.12em] sm:tracking-[0.2em] font-bold uppercase" style={{ fontFamily: "'Cinzel', serif", color: 'var(--t1)' }}>
            CipherFleet
          </div>
          <div className="hidden lg:block text-[8px] tracking-[0.2em] uppercase mt-0.5 font-light" style={{ color: 'var(--t3)' }}>
            Encrypted Naval Warfare &middot; Fhenix CoFHE
          </div>
        </div>
      </div>

      {/* Center stats — hidden on small screens */}
      <div className="hidden lg:flex items-center gap-5 absolute left-1/2 -translate-x-1/2">
        <StatBlock value={myShips} label="My Ships" color="var(--safe-hi)" first />
        <StatBlock value={enemyShips} label="Enemy" color="var(--scarlet)" />
        <StatBlock value={attackCount} label="Attacks" color="var(--gold-hi)" />
        <StatBlock value={hitCount} label="Hits" color="var(--t1)" />
      </div>

      {/* Compact stats for tablet — shown between sm and lg */}
      <div className="hidden sm:flex lg:hidden items-center gap-3 mx-auto">
        <MiniStat value={myShips} label="Ships" color="var(--safe-hi)" />
        <MiniStat value={enemyShips} label="Enemy" color="var(--scarlet)" />
        <MiniStat value={hitCount} label="Hits" color="var(--gold-hi)" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto shrink-0">
        {/* FHE + Network chips — desktop only */}
        <div className="hidden xl:flex items-center gap-2.5">
          <Chip style={{ borderColor: 'rgba(139,26,26,0.6)', color: 'var(--flame)', background: 'rgba(139,26,26,0.1)' }}>
            <span className="w-[5px] h-[5px] rounded-full bg-current" style={{ animation: 'dot-blink 1.6s ease-in-out infinite' }} />
            FHE Active
          </Chip>
          <Chip style={{ borderColor: 'var(--ghost)', color: 'var(--t3)' }}>
            Arbitrum Sepolia
          </Chip>
        </div>

        {/* Turn indicator */}
        {phase === 'BATTLE' && (
          <Chip
            style={{
              borderColor: 'var(--gold)',
              color: 'var(--gold-hi)',
              background: 'var(--gold-dim)',
              fontWeight: 500,
              animation: isMyTurn ? 'turn-pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            <span className="w-[5px] h-[5px] rounded-full bg-current" style={{ animation: 'dot-blink 1.6s ease-in-out infinite' }} />
            <span className="hidden sm:inline">{isMyTurn ? 'Your Turn' : 'Enemy Turn'}</span>
            <span className="sm:hidden">{isMyTurn ? 'You' : 'Enemy'}</span>
          </Chip>
        )}

        {/* Sound toggles */}
        <SoundToggle icon={musicOn ? 'music-on' : 'music-off'} active={musicOn} onClick={onToggleMusic} tooltip={musicOn ? 'Music On' : 'Music Off'} />
        <SoundToggle icon={sfxOn ? 'sfx-on' : 'sfx-off'} active={sfxOn} onClick={onToggleSfx} tooltip={sfxOn ? 'SFX On' : 'SFX Off'} />

        {/* Wallet — desktop only */}
        <button className="hidden md:block py-[7px] px-4 text-[9px] tracking-[0.08em] border transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--t3)', background: 'transparent', borderColor: 'var(--ghost)', cursor: 'pointer' }}
        >
          0x4a2b...f3c1
        </button>
      </div>
    </nav>
  );
}

function StatBlock({ value, label, color, first }: { value: number; label: string; color: string; first?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-px px-3.5" style={{ borderRight: '1px solid var(--ghost)', borderLeft: first ? '1px solid var(--ghost)' : 'none' }}>
      <div className="text-xl font-semibold leading-none tracking-[0.05em]" style={{ fontFamily: "'Cinzel', serif", color }}>{value}</div>
      <div className="text-[7px] tracking-[0.16em] uppercase" style={{ color: 'var(--t3)' }}>{label}</div>
    </div>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold" style={{ fontFamily: "'Cinzel', serif", color }}>{value}</span>
      <span className="text-[7px] tracking-[0.1em] uppercase" style={{ color: 'var(--t3)' }}>{label}</span>
    </div>
  );
}

function Chip({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center gap-[5px] py-[4px] sm:py-[5px] px-2 sm:px-3 text-[8px] sm:text-[9px] tracking-[0.1em] uppercase border ${className}`} style={style}>
      {children}
    </div>
  );
}

function SoundToggle({ icon, active, onClick, tooltip }: { icon: string; active: boolean; onClick: () => void; tooltip: string }) {
  const isMusic = icon.includes('music');
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="relative flex items-center gap-1 sm:gap-[6px] py-[4px] sm:py-[5px] px-1.5 sm:px-2.5 text-[8px] sm:text-[9px] tracking-[0.1em] uppercase border cursor-pointer transition-all"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        borderColor: active ? 'rgba(139,26,26,0.5)' : 'rgba(255,50,50,0.3)',
        color: active ? 'var(--flame)' : 'var(--scarlet)',
        background: active ? 'rgba(139,26,26,0.08)' : 'rgba(255,50,50,0.06)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-3.5 sm:h-3.5">
        {isMusic ? (
          <>
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" fill={active ? 'currentColor' : 'none'} />
            <circle cx="18" cy="16" r="3" fill={active ? 'currentColor' : 'none'} />
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill={active ? 'currentColor' : 'none'} />
            {active && (
              <>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </>
            )}
          </>
        )}
        {!active && (
          <line x1="2" y1="2" x2="22" y2="22" stroke="var(--scarlet)" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
      <span className="hidden sm:inline" style={{ opacity: active ? 1 : 0.6 }}>
        {isMusic ? (active ? 'Music' : 'Off') : (active ? 'SFX' : 'Off')}
      </span>
    </button>
  );
}
