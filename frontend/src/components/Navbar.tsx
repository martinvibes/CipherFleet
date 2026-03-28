import LogoHex from './LogoHex';

interface NavbarProps {
  myShips: number;
  enemyShips: number;
  attackCount: number;
  hitCount: number;
  isMyTurn: boolean;
  phase: string;
}

export default function Navbar({ myShips, enemyShips, attackCount, hitCount, isMyTurn, phase }: NavbarProps) {
  return (
    <nav className="h-16 flex items-center px-10 sticky top-0 z-50"
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

      {/* Logo */}
      <div className="flex items-center gap-4 flex-1">
        <LogoHex />
        <div>
          <div className="text-xl tracking-[0.2em] font-bold uppercase" style={{ fontFamily: "'Cinzel', serif", color: 'var(--t1)' }}>
            CipherFleet
          </div>
          <div className="text-[8px] tracking-[0.2em] uppercase mt-0.5 font-light" style={{ color: 'var(--t3)' }}>
            Encrypted Naval Warfare &middot; Fhenix CoFHE
          </div>
        </div>
      </div>

      {/* Center stats */}
      <div className="hidden md:flex items-center gap-5 absolute left-1/2 -translate-x-1/2">
        <StatBlock value={myShips} label="My Ships" color="var(--safe-hi)" />
        <StatBlock value={enemyShips} label="Enemy" color="var(--scarlet)" />
        <StatBlock value={attackCount} label="Attacks" color="var(--gold-hi)" />
        <StatBlock value={hitCount} label="Hits" color="var(--t1)" />
      </div>

      {/* Right chips */}
      <div className="flex items-center gap-2.5 ml-auto">
        <Chip className="border-[rgba(139,26,26,0.6)]" style={{ color: 'var(--flame)', background: 'rgba(139,26,26,0.1)' }}>
          <span className="w-[5px] h-[5px] rounded-full bg-current" style={{ animation: 'dot-blink 1.6s ease-in-out infinite' }} />
          FHE Active
        </Chip>
        <Chip style={{ borderColor: 'var(--ghost)', color: 'var(--t3)' }}>
          Arbitrum Sepolia
        </Chip>
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
            {isMyTurn ? 'Your Turn' : 'Enemy Turn'}
          </Chip>
        )}
        <button className="py-[7px] px-4 text-[9px] tracking-[0.08em] border transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--t3)', background: 'transparent', borderColor: 'var(--ghost)', cursor: 'pointer' }}
        >
          0x4a2b...f3c1
        </button>
      </div>
    </nav>
  );
}

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-px px-3.5" style={{ borderRight: '1px solid var(--ghost)', borderLeft: label === 'My Ships' ? '1px solid var(--ghost)' : 'none' }}>
      <div className="text-xl font-semibold leading-none tracking-[0.05em]" style={{ fontFamily: "'Cinzel', serif", color }}>{value}</div>
      <div className="text-[7px] tracking-[0.16em] uppercase" style={{ color: 'var(--t3)' }}>{label}</div>
    </div>
  );
}

function Chip({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex items-center gap-[5px] py-[5px] px-3 text-[9px] tracking-[0.1em] uppercase border ${className}`} style={style}>
      {children}
    </div>
  );
}
