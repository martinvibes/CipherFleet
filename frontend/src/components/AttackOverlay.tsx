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
      <div className="relative text-center py-10 sm:py-[52px] px-8 sm:px-[60px] min-w-[300px] sm:min-w-[380px]" style={{ border: '1px solid rgba(139,26,26,0.3)', background: 'var(--deep)' }}>
        {/* Corner marks */}
        <div className="absolute top-[-1px] left-[-1px] w-3.5 h-3.5 opacity-50" style={{ borderTop: '2px solid var(--crimson)', borderLeft: '2px solid var(--crimson)' }} />
        <div className="absolute bottom-[-1px] right-[-1px] w-3.5 h-3.5 opacity-50" style={{ borderBottom: '2px solid var(--crimson)', borderRight: '2px solid var(--crimson)' }} />

        {/* Crimson top line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)' }} />

        <div className="text-[8px] tracking-[0.24em] uppercase mb-5" style={{ color: 'var(--t3)' }}>
          Firing at coordinates
        </div>

        {/* Big coordinate */}
        <div className="text-[72px] sm:text-[88px] font-bold leading-none tracking-[0.12em] mb-2" style={{ fontFamily: "'Cinzel', serif", color: 'var(--t1)' }}>
          {display?.coord || '??'}
        </div>

        {/* Description — human readable */}
        <div className="text-[10px] tracking-[0.06em] mb-[30px] font-light" style={{ color: 'var(--t3)' }}>
          {display ? `Checking if there\u2019s a ship at ${display.coord}...` : 'Processing...'}
        </div>

        {/* Computing state */}
        {!resolved && (
          <>
            <div className="w-[200px] h-px mx-auto mb-3 overflow-hidden relative" style={{ background: 'var(--ghost)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent, var(--crimson), transparent)', animation: 'scan-anim 0.85s ease-in-out infinite' }} />
            </div>
            <div className="text-[9px] tracking-[0.14em] uppercase mb-1" style={{ color: 'var(--t3)', animation: 'dot-blink 1.4s ease-in-out infinite' }}>
              Scanning encrypted waters
            </div>
            <div className="text-[7px] tracking-[0.1em] uppercase mt-2" style={{ color: 'var(--t4)' }}>
              Ship positions remain hidden during this check
            </div>
          </>
        )}

        {/* Result */}
        {resolved && result && (
          <div className="mt-[20px]">
            {result.hit ? (
              <>
                <div className="text-[20px] mb-3" style={{ animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  {'\uD83D\uDCA5'}
                </div>
                <div
                  className="text-[52px] font-bold tracking-[0.16em] leading-none mb-3"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: 'var(--flame)',
                    textShadow: 'var(--glow-crimson)',
                    animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  Hit!
                </div>
                <div className="text-[10px] tracking-[0.06em] font-light" style={{ color: 'var(--flame)', opacity: 0.7 }}>
                  Enemy ship found at {result.coord}
                </div>
                <div className="text-[8px] tracking-[0.08em] mt-2" style={{ color: 'var(--t4)' }}>
                  Ship location stays encrypted &mdash; only the hit is revealed
                </div>
              </>
            ) : (
              <>
                <div className="text-[20px] mb-3" style={{ animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  {'\uD83C\uDF0A'}
                </div>
                <div
                  className="text-[52px] font-bold tracking-[0.16em] leading-none mb-3"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    color: 'var(--t3)',
                    animation: 'result-drop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  Miss
                </div>
                <div className="text-[10px] tracking-[0.06em] font-light" style={{ color: 'var(--t3)', opacity: 0.7 }}>
                  Nothing at {result.coord} &mdash; open water
                </div>
                <div className="text-[8px] tracking-[0.08em] mt-2" style={{ color: 'var(--t4)' }}>
                  No ships detected at these coordinates
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
