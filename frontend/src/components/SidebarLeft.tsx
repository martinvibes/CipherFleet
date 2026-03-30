import type { Ship, Phase } from '../lib/gameTypes';

interface SidebarLeftProps {
  phase: Phase;
  ships: Ship[];
  placingShipIndex: number;
  placingOrientation: 'H' | 'V';
  onOrientationToggle: () => void;
  onReset: () => void;
  onDemoWin: () => void;
  onQuickDeploy: () => void;
}

export default function SidebarLeft({ phase, ships, placingShipIndex, placingOrientation, onOrientationToggle, onReset, onDemoWin, onQuickDeploy }: SidebarLeftProps) {
  const phases = [
    { label: 'Place Ships', done: phase !== 'PLACING' && phase !== 'WAITING', active: phase === 'PLACING' },
    { label: 'Battle Phase', done: phase === 'FINISHED', active: phase === 'BATTLE' },
    { label: 'Results', done: false, active: phase === 'FINISHED' },
  ];

  return (
    <aside className="sidebar-left-wrap flex flex-col overflow-hidden" style={{ borderRight: '1px solid var(--ghost)', background: 'linear-gradient(180deg, var(--deep) 0%, var(--abyss) 100%)' }}>
      {/* Phase indicator */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--ghost)' }}>
        <SectionTitle>Mission Phase</SectionTitle>
        <div className="flex flex-col gap-1">
          {phases.map((p, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 py-2 px-2.5 border border-transparent relative transition-all ${p.done ? 'opacity-40' : ''}`}
              style={p.active ? { background: 'rgba(139,26,26,0.12)', borderColor: 'rgba(139,26,26,0.4)' } : {}}
            >
              {p.active && <div className="absolute left-[-1px] top-0 bottom-0 w-0.5" style={{ background: 'var(--crimson)' }} />}
              <div
                className="w-[18px] h-[18px] rounded-full border flex items-center justify-center text-[9px] shrink-0"
                style={
                  p.active
                    ? { background: 'var(--crimson)', color: 'white', borderColor: 'var(--crimson)' }
                    : p.done
                      ? { background: 'var(--ghost)', color: 'var(--deep)', borderColor: 'var(--ghost)' }
                      : { borderColor: 'var(--ghost)', color: 'var(--t3)' }
                }
              >
                {p.done ? '\u2713' : i + 1}
              </div>
              <div
                className="text-[10px] tracking-[0.06em] uppercase"
                style={{ color: p.active ? 'var(--flame)' : p.done ? 'var(--t4)' : 'var(--t3)' }}
              >
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placing controls */}
      {phase === 'PLACING' && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--ghost)' }}>
          <SectionTitle>Placing: {ships[placingShipIndex]?.name}</SectionTitle>
          <div className="text-[9px] mb-2" style={{ color: 'var(--t3)' }}>
            Size: {ships[placingShipIndex]?.size} cells &middot; Click grid to place
          </div>
          <button
            onClick={onQuickDeploy}
            className="w-full py-2 mb-2 text-[9px] tracking-[0.1em] uppercase border cursor-pointer transition-all hover:bg-[rgba(139,26,26,0.16)]"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'rgba(139,26,26,0.5)', color: 'var(--flame)', background: 'rgba(139,26,26,0.08)' }}
          >
            Quick Deploy Fleet
          </button>
          <button
            onClick={onOrientationToggle}
            className="w-full py-2 text-[9px] tracking-[0.1em] uppercase border cursor-pointer transition-all hover:border-[var(--crimson)] hover:text-[var(--flame)]"
            style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--ghost)', color: 'var(--t3)', background: 'none' }}
          >
            Orientation: {placingOrientation === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      )}

      {/* Fleet list */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--ghost)' }}>
        <SectionTitle>My Fleet</SectionTitle>
        <div className="flex flex-col">
          {ships.map((ship, i) => (
            <div key={i} className="flex flex-col gap-1.5 py-2.5 px-2.5 transition-colors hover:bg-white/[0.02]" style={{ borderBottom: i < ships.length - 1 ? '1px solid var(--ghost)' : 'none' }}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: 'var(--t2)' }}>{ship.name}</div>
                <div className="text-[8px] tracking-[0.08em] uppercase" style={{
                  color: ship.sunk ? 'var(--t3)' : ship.hits > 0 ? 'var(--gold-hi)' : ship.cells.length > 0 ? 'var(--crimson)' : 'var(--t3)',
                  textDecoration: ship.sunk ? 'line-through' : 'none',
                  opacity: ship.sunk ? 1 : 0.8,
                }}>
                  {ship.sunk ? 'Sunk' : ship.hits > 0 ? 'Damaged' : ship.cells.length > 0 ? 'Encrypted' : 'Pending'}
                </div>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: ship.size }, (_, j) => (
                  <div
                    key={j}
                    className="h-[5px] flex-1 transition-all"
                    style={{
                      background: j < ship.hits ? 'var(--gold-hi)' : ship.cells.length > 0 ? 'var(--crimson)' : 'var(--ghost)',
                      opacity: j < ship.hits ? 0.6 : ship.cells.length > 0 ? 0.4 : 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FHE Encryption Status */}
      <div className="mx-3.5 mb-3.5 p-3.5" style={{ background: 'rgba(139,26,26,0.06)', border: '1px solid rgba(139,26,26,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[7px] tracking-[0.2em] uppercase" style={{ color: 'var(--crimson)' }}>
            <span style={{ fontSize: '10px' }}>{'\u2B21'}</span>
            FHE Engine
          </div>
          <div className="flex items-center gap-1 py-[2px] px-[6px]" style={{ background: 'rgba(32,160,96,0.08)', border: '1px solid rgba(32,160,96,0.2)' }}>
            <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--safe-hi)', animation: 'dot-blink 2s ease-in-out infinite' }} />
            <span className="text-[6px] tracking-[0.15em] uppercase" style={{ color: 'var(--safe-hi)' }}>Active</span>
          </div>
        </div>
        <div className="flex flex-col gap-[6px]">
          <StatusRow label="Encryption" value="euint8" />
          <StatusRow label="Operation" value="FHE.eq()" />
          <StatusRow label="Network" value="CoFHE 5/5" />
          <StatusRow label="Chain" value="Arbitrum" />
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="mt-auto p-3 flex gap-2" style={{ borderTop: '1px solid var(--ghost)' }}>
        <button onClick={onReset} className="flex-1 py-[7px] px-4 text-[8px] tracking-[0.12em] uppercase border cursor-pointer transition-all hover:border-[var(--steel-lo)] hover:text-[var(--t2)]"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'var(--ghost)', color: 'var(--t3)', background: 'none' }}>
          Reset
        </button>
        <button onClick={onDemoWin} className="flex-1 py-[7px] px-4 text-[8px] tracking-[0.12em] uppercase border cursor-pointer transition-all hover:bg-[rgba(139,26,26,0.16)]"
          style={{ fontFamily: "'JetBrains Mono', monospace", borderColor: 'rgba(139,26,26,0.5)', color: 'var(--flame)', background: 'rgba(139,26,26,0.08)' }}>
          Demo Win
        </button>
      </div>
    </aside>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-[7px] tracking-[0.22em] uppercase" style={{ color: 'var(--t3)' }}>
      {children}
      <div className="flex-1 h-px" style={{ background: 'var(--ghost)' }} />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[8px] tracking-[0.08em] uppercase" style={{ color: 'var(--t4)' }}>{label}</span>
      <code className="text-[8px] py-px px-[5px]" style={{ color: 'var(--flame)', background: 'rgba(139,26,26,0.12)', fontFamily: "'JetBrains Mono', monospace" }}>{value}</code>
    </div>
  );
}
