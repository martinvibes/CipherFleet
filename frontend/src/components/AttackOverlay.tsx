interface AttackOverlayProps {
  show: boolean;
  attackCoord: { coord: string; row: number; col: number } | null;
  result: { coord: string; row: number; col: number; hit: boolean } | null;
}

export default function AttackOverlay({ show, attackCoord, result }: AttackOverlayProps) {
  const resolved = result != null;
  const display = result || attackCoord;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[200] transition-opacity duration-250"
      style={{
        background: 'rgba(6,5,10,0.92)',
        backdropFilter: 'blur(6px)',
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'all' : 'none',
      }}
    >
      <div className="relative text-center py-[52px] px-[60px] min-w-[380px]" style={{ border: '1px solid rgba(139,26,26,0.3)', background: 'var(--deep)' }}>
        {/* Corner marks */}
        <div className="absolute top-[-1px] left-[-1px] w-3.5 h-3.5 opacity-50" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
        <div className="absolute bottom-[-1px] right-[-1px] w-3.5 h-3.5 opacity-50" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />

        {/* Crimson top line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)' }} />

        <div className="text-[8px] tracking-[0.24em] uppercase mb-5" style={{ color: 'var(--t3)' }}>
          Encrypted Attack Sequence
        </div>

        <div className="text-[88px] font-bold leading-none tracking-[0.12em] mb-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--t1)' }}>
          {display?.coord || '??'}
        </div>

        <div className="text-[9.5px] tracking-[0.06em] mb-[30px] font-light" style={{ color: 'var(--t3)' }}>
          {display ? `FHE.eq(grid[${display.row}][${display.col}], euint8(1)) \u2192 CoFHE threshold network` : 'Processing...'}
        </div>

        {!resolved && (
          <>
            {/* Scan bar */}
            <div className="w-[200px] h-px mx-auto mb-2.5 overflow-hidden relative" style={{ background: 'var(--ghost)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)', animation: 'scan-anim 0.85s ease-in-out infinite' }} />
            </div>
            <div className="text-[8px] tracking-[0.18em] uppercase" style={{ color: 'var(--t3)', animation: 'dot-blink 1.4s ease-in-out infinite' }}>
              Computing on ciphertext
            </div>
          </>
        )}

        {resolved && result && (
          <div className="mt-[26px]">
            <div
              className="text-[52px] font-bold tracking-[0.16em] leading-none mb-2"
              style={{
                fontFamily: "'Cinzel', serif",
                color: result.hit ? 'var(--flame)' : 'var(--t3)',
                textShadow: result.hit ? 'var(--glow-crimson)' : 'none',
                animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {result.hit ? 'Hit' : 'Miss'}
            </div>
            <div className="text-[9px] tracking-[0.08em] font-light" style={{ color: 'var(--t3)' }}>
              {result.hit ? 'ebool \u2192 true \u00B7 ship coordinates remain encrypted' : 'ebool \u2192 false \u00B7 empty coordinates'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
